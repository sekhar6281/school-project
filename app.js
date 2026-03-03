const storageKey = "schoolHubDataV1";
const today = new Date();

const state = {
  students: [],
  attendance: [],
  marks: []
};

const els = {
  todayDate: document.getElementById("todayDate"),
  tabs: document.querySelectorAll(".tab-btn"),
  panels: document.querySelectorAll(".tab-panel"),

  studentForm: document.getElementById("studentForm"),
  rollNumber: document.getElementById("rollNumber"),
  studentName: document.getElementById("studentName"),
  className: document.getElementById("className"),
  studentsTableBody: document.getElementById("studentsTableBody"),

  attendanceForm: document.getElementById("attendanceForm"),
  attendanceDate: document.getElementById("attendanceDate"),
  attendanceStudent: document.getElementById("attendanceStudent"),
  attendanceStatus: document.getElementById("attendanceStatus"),
  attendanceTableBody: document.getElementById("attendanceTableBody"),

  marksForm: document.getElementById("marksForm"),
  marksDate: document.getElementById("marksDate"),
  marksStudent: document.getElementById("marksStudent"),
  subject: document.getElementById("subject"),
  score: document.getElementById("score"),
  maxScore: document.getElementById("maxScore"),
  marksTableBody: document.getElementById("marksTableBody"),

  reportTableBody: document.getElementById("reportTableBody"),
  totalStudents: document.getElementById("totalStudents"),
  todayAttendance: document.getElementById("todayAttendance"),
  avgMarks: document.getElementById("avgMarks")
};

function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.students = Array.isArray(parsed.students) ? parsed.students : [];
    state.attendance = Array.isArray(parsed.attendance) ? parsed.attendance : [];
    state.marks = Array.isArray(parsed.marks) ? parsed.marks : [];
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function studentById(studentId) {
  return state.students.find((student) => student.id === studentId);
}

function studentDisplay(studentId) {
  const student = studentById(studentId);
  return student ? `${student.name} (${student.roll})` : "Unknown";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function setTodayDefaults() {
  const isoToday = today.toISOString().slice(0, 10);
  els.attendanceDate.value = isoToday;
  els.marksDate.value = isoToday;
  els.todayDate.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function activateTab(tabId) {
  els.tabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  els.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function renderStudentSelects() {
  const options = state.students
    .map((student) => `<option value="${student.id}">${student.name} (${student.roll})</option>`)
    .join("");

  const fallback = '<option value="">No students added</option>';
  els.attendanceStudent.innerHTML = options || fallback;
  els.marksStudent.innerHTML = options || fallback;

  els.attendanceStudent.disabled = state.students.length === 0;
  els.marksStudent.disabled = state.students.length === 0;
}

function renderStudents() {
  if (state.students.length === 0) {
    els.studentsTableBody.innerHTML = '<tr><td class="empty" colspan="4">No students yet.</td></tr>';
    return;
  }

  const rows = state.students
    .map(
      (student) => `
        <tr>
          <td>${student.roll}</td>
          <td>${student.name}</td>
          <td>${student.className}</td>
          <td><button class="row-btn" data-delete-student="${student.id}">Delete</button></td>
        </tr>
      `
    )
    .join("");

  els.studentsTableBody.innerHTML = rows;
}

function renderAttendance() {
  if (state.attendance.length === 0) {
    els.attendanceTableBody.innerHTML = '<tr><td class="empty" colspan="4">No attendance records yet.</td></tr>';
    return;
  }

  const rows = [...state.attendance]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (entry) => `
        <tr>
          <td>${formatDate(entry.date)}</td>
          <td>${studentDisplay(entry.studentId)}</td>
          <td>${entry.status}</td>
          <td><button class="row-btn" data-delete-attendance="${entry.id}">Delete</button></td>
        </tr>
      `
    )
    .join("");

  els.attendanceTableBody.innerHTML = rows;
}

function renderMarks() {
  if (state.marks.length === 0) {
    els.marksTableBody.innerHTML = '<tr><td class="empty" colspan="5">No marks records yet.</td></tr>';
    return;
  }

  const rows = [...state.marks]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (entry) => `
        <tr>
          <td>${formatDate(entry.date)}</td>
          <td>${studentDisplay(entry.studentId)}</td>
          <td>${entry.subject}</td>
          <td>${entry.score}/${entry.maxScore}</td>
          <td><button class="row-btn" data-delete-marks="${entry.id}">Delete</button></td>
        </tr>
      `
    )
    .join("");

  els.marksTableBody.innerHTML = rows;
}

function calculateAttendanceFor(studentId) {
  const data = state.attendance.filter((entry) => entry.studentId === studentId);
  if (data.length === 0) return 0;
  const presentDays = data.filter((entry) => entry.status !== "Absent").length;
  return (presentDays / data.length) * 100;
}

function calculateMarksFor(studentId) {
  const data = state.marks.filter((entry) => entry.studentId === studentId);
  if (data.length === 0) return 0;

  const totals = data.reduce(
    (acc, row) => {
      acc.score += Number(row.score);
      acc.max += Number(row.maxScore);
      return acc;
    },
    { score: 0, max: 0 }
  );

  if (totals.max === 0) return 0;
  return (totals.score / totals.max) * 100;
}

function renderReports() {
  if (state.students.length === 0) {
    els.reportTableBody.innerHTML = '<tr><td class="empty" colspan="3">Add students to generate report.</td></tr>';
    return;
  }

  const rows = state.students
    .map((student) => {
      const attendancePct = calculateAttendanceFor(student.id).toFixed(1);
      const marksPct = calculateMarksFor(student.id).toFixed(1);

      return `
        <tr>
          <td>${student.name} (${student.roll})</td>
          <td>${attendancePct}%</td>
          <td>${marksPct}%</td>
        </tr>
      `;
    })
    .join("");

  els.reportTableBody.innerHTML = rows;
}

function renderDashboard() {
  els.totalStudents.textContent = state.students.length;

  const todayIso = today.toISOString().slice(0, 10);
  const todayRows = state.attendance.filter((entry) => entry.date === todayIso);
  const presentRows = todayRows.filter((entry) => entry.status !== "Absent").length;
  const todayPct = todayRows.length === 0 ? 0 : (presentRows / todayRows.length) * 100;
  els.todayAttendance.textContent = `${todayPct.toFixed(1)}%`;

  if (state.marks.length === 0) {
    els.avgMarks.textContent = "0%";
    return;
  }

  const totals = state.marks.reduce(
    (acc, row) => {
      acc.score += Number(row.score);
      acc.max += Number(row.maxScore);
      return acc;
    },
    { score: 0, max: 0 }
  );

  const avg = totals.max === 0 ? 0 : (totals.score / totals.max) * 100;
  els.avgMarks.textContent = `${avg.toFixed(1)}%`;
}

function renderAll() {
  renderStudentSelects();
  renderStudents();
  renderAttendance();
  renderMarks();
  renderReports();
  renderDashboard();
}

function bindEvents() {
  els.tabs.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  els.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const roll = els.rollNumber.value.trim();
    const name = els.studentName.value.trim();
    const className = els.className.value.trim();

    if (!roll || !name || !className) return;

    const duplicateRoll = state.students.some((student) => student.roll.toLowerCase() === roll.toLowerCase());
    if (duplicateRoll) {
      alert("Roll number already exists.");
      return;
    }

    state.students.push({
      id: createId(),
      roll,
      name,
      className
    });

    saveState();
    renderAll();
    els.studentForm.reset();
  });

  els.attendanceForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!els.attendanceStudent.value) return;

    const entry = {
      id: createId(),
      date: els.attendanceDate.value,
      studentId: els.attendanceStudent.value,
      status: els.attendanceStatus.value
    };

    const existing = state.attendance.find(
      (row) => row.date === entry.date && row.studentId === entry.studentId
    );

    if (existing) {
      existing.status = entry.status;
    } else {
      state.attendance.push(entry);
    }

    saveState();
    renderAll();
  });

  els.marksForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!els.marksStudent.value) return;

    const score = Number(els.score.value);
    const maxScore = Number(els.maxScore.value);

    if (Number.isNaN(score) || Number.isNaN(maxScore) || score < 0 || maxScore <= 0 || score > maxScore) {
      alert("Please enter valid score values.");
      return;
    }

    state.marks.push({
      id: createId(),
      date: els.marksDate.value,
      studentId: els.marksStudent.value,
      subject: els.subject.value.trim(),
      score,
      maxScore
    });

    saveState();
    renderAll();
    els.subject.value = "";
    els.score.value = "";
  });

  document.addEventListener("click", (event) => {
    const deleteStudentId = event.target.dataset.deleteStudent;
    if (deleteStudentId) {
      state.students = state.students.filter((row) => row.id !== deleteStudentId);
      state.attendance = state.attendance.filter((row) => row.studentId !== deleteStudentId);
      state.marks = state.marks.filter((row) => row.studentId !== deleteStudentId);
      saveState();
      renderAll();
      return;
    }

    const deleteAttendanceId = event.target.dataset.deleteAttendance;
    if (deleteAttendanceId) {
      state.attendance = state.attendance.filter((row) => row.id !== deleteAttendanceId);
      saveState();
      renderAll();
      return;
    }

    const deleteMarksId = event.target.dataset.deleteMarks;
    if (deleteMarksId) {
      state.marks = state.marks.filter((row) => row.id !== deleteMarksId);
      saveState();
      renderAll();
    }
  });
}

function init() {
  loadState();
  setTodayDefaults();
  bindEvents();
  renderAll();
}

init();
