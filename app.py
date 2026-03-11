from flask import Flask, render_template, request, redirect
from models import db, Student, Attendance

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route("/")
def home():
    students = Student.query.all()
    return render_template("dashboard.html", students=students)

@app.route("/add_student", methods=["POST"])
def add_student():
    name = request.form["name"]
    class_name = request.form["class"]
    email = request.form["email"]

    student = Student(name=name, class_name=class_name, email=email)
    db.session.add(student)
    db.session.commit()

    return redirect("/")

@app.route("/delete/<int:id>")
def delete(id):
    student = Student.query.get(id)
    db.session.delete(student)
    db.session.commit()
    return redirect("/")

@app.route("/attendance", methods=["POST"])
def attendance():
    student_id = request.form["student_id"]
    date = request.form["date"]
    status = request.form["status"]

    att = Attendance(student_id=student_id, date=date, status=status)
    db.session.add(att)
    db.session.commit()

    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True)
