// Run:  npm run seed
// Rebuilds data/db.json with demo data (resets every change you made).
import { writeFileSync } from "node:fs";
import { hashPassword } from "../src/utils/hash.js";
import { courses } from "../src/data/courseData.js";

const user = (id, name, email, password, role, phone, college, createdAt) => ({
  id, name, email, password: hashPassword(email, password), role, phone, college, createdAt,
});

const users = [
  user(1, "Admin User", "admin@internflow.com", "Admin@123", "admin", "9000000001", "InternFlow HQ", "2026-05-01T09:00:00.000Z"),
  user(2, "Arun Kumar", "arun@example.com", "Student@123", "student", "9000000002", "Paavai Engineering College", "2026-05-10T09:00:00.000Z"),
  user(3, "Priya Sharma", "priya@example.com", "Student@123", "student", "9000000003", "Anna University", "2026-06-02T09:00:00.000Z"),
  user(4, "Karthik Raj", "karthik@example.com", "Student@123", "student", "9000000004", "PSG College of Technology", "2026-07-15T09:00:00.000Z"),
  user(5, "Sneha Ravi", "sneha@example.com", "Student@123", "student", "9000000005", "SRM Institute", "2026-08-20T09:00:00.000Z"),
  user(6, "Ravi Shankar", "ravi@internflow.com", "Trainer@123", "trainer", "9000000006", "InternFlow Academy", "2026-05-03T09:00:00.000Z"),
  user(7, "Lakshmi Narayanan", "lakshmi@internflow.com", "Trainer@123", "trainer", "9000000007", "InternFlow Academy", "2026-05-04T09:00:00.000Z"),
];

const openings = [
  { id: 1, title: "React Developer Intern", company: "TechNova Solutions", location: "Chennai", type: "Remote", duration: "3 Months", stipend: 12000, skills: ["React", "JavaScript", "CSS"], status: "Open" },
  { id: 2, title: "Python Developer Intern", company: "CloudBridge", location: "Bengaluru", type: "Hybrid", duration: "6 Months", stipend: 15000, skills: ["Python", "SQL", "Git"], status: "Open" },
  { id: 3, title: "UI/UX Design Intern", company: "PixelCraft", location: "Remote", type: "Remote", duration: "3 Months", stipend: 10000, skills: ["Figma", "Wireframing"], status: "Open" },
  { id: 4, title: "Node.js Backend Intern", company: "ServerWorks", location: "Coimbatore", type: "On-site", duration: "6 Months", stipend: 14000, skills: ["Node.js", "Express", "MongoDB"], status: "Open" },
  { id: 5, title: "IoT Embedded Intern", company: "SmartGrid Labs", location: "Salem", type: "On-site", duration: "3 Months", stipend: 9000, skills: ["Arduino", "ESP32", "C++"], status: "Open" },
  { id: 6, title: "Data Analyst Intern", company: "InsightHub", location: "Remote", type: "Remote", duration: "3 Months", stipend: 11000, skills: ["Excel", "SQL", "Power BI"], status: "Closed" },
];

const mentors = [
  { id: 1, name: "Divya Krishnan", role: "Senior React Developer", email: "divya@example.com", skills: ["React", "JavaScript", "Node.js"], students: 8, experience: "6 years", status: "Available" },
  { id: 2, name: "Sanjay Kumar", role: "Python Engineer", email: "sanjay@example.com", skills: ["Python", "Django", "SQL"], students: 6, experience: "5 years", status: "Busy" },
  { id: 3, name: "Rahul Dev", role: "Full Stack Developer", email: "rahul@example.com", skills: ["React", "Node.js", "MongoDB"], students: 10, experience: "7 years", status: "Available" },
  { id: 4, name: "Meena Devi", role: "UI/UX Designer", email: "meena@example.com", skills: ["Figma", "UI/UX", "CSS"], students: 4, experience: "4 years", status: "Available" },
];

const app = (id, userId, openingId, status, appliedOn) => {
  const u = users.find((x) => x.id === userId);
  return { id, userId, openingId, student: u.name, email: u.email, status, appliedOn };
};

const applications = [
  app(1, 2, 1, "Under Review", "2026-05-18"),
  app(2, 3, 2, "Shortlisted", "2026-06-12"),
  app(3, 4, 1, "Approved", "2026-06-25"),
  app(4, 5, 3, "Under Review", "2026-07-08"),
  app(5, 2, 4, "Rejected", "2026-07-22"),
  app(6, 3, 3, "Approved", "2026-08-14"),
  app(7, 4, 5, "Shortlisted", "2026-09-03"),
  app(8, 5, 1, "Under Review", "2026-09-19"),
  app(9, 2, 5, "Under Review", "2026-10-10"),
  app(10, 3, 4, "Shortlisted", "2026-10-12"),
  app(11, 4, 2, "Approved", "2026-10-14"),
];

const attendance = [];
let attId = 1;
for (const date of ["2026-10-14", "2026-10-15"]) {
  for (const [userId, status] of [[2, "Present"], [3, "Present"], [4, date === "2026-10-14" ? "Absent" : "Present"], [5, "Leave"]]) {
    attendance.push({ id: attId++, userId, date, status });
  }
}

const evaluations = [
  { id: 1, userId: 4, mentorId: 1, technical: 8, communication: 9, teamwork: 8, feedback: "Good progress and strong problem-solving skills.", createdAt: "2026-10-12T10:00:00.000Z" },
  { id: 2, userId: 3, mentorId: 4, technical: 9, communication: 8, teamwork: 9, feedback: "Excellent design thinking. Keep documenting your decisions.", createdAt: "2026-10-13T10:00:00.000Z" },
];

const progress = [
  { id: 1, userId: 2, courseId: 1, lessonIds: ["react-l1", "react-l2"] },
  { id: 2, userId: 3, courseId: 3, lessonIds: ["uiux-l1", "uiux-l2"] },
  { id: 3, userId: 4, courseId: 2, lessonIds: ["python-l1"] },
  { id: 4, userId: 2, courseId: 2, lessonIds: [] },
];

// status: Pending | Approved | Rejected   (reviewedBy = trainer/admin user id)
const enrollments = [
  { id: 1, userId: 2, courseId: 1, status: "Approved", requestedAt: "2026-10-05T09:00:00.000Z", reviewedBy: 6, reviewedAt: "2026-10-05T12:00:00.000Z" },
  { id: 2, userId: 3, courseId: 3, status: "Approved", requestedAt: "2026-10-06T09:00:00.000Z", reviewedBy: 1, reviewedAt: "2026-10-06T10:30:00.000Z" },
  { id: 3, userId: 4, courseId: 2, status: "Approved", requestedAt: "2026-10-07T09:00:00.000Z", reviewedBy: 7, reviewedAt: "2026-10-07T11:00:00.000Z" },
  { id: 4, userId: 4, courseId: 1, status: "Pending", requestedAt: "2026-10-14T09:00:00.000Z", reviewedBy: null, reviewedAt: null },
  { id: 5, userId: 5, courseId: 2, status: "Pending", requestedAt: "2026-10-15T09:00:00.000Z", reviewedBy: null, reviewedAt: null },
  { id: 6, userId: 2, courseId: 2, status: "Rejected", requestedAt: "2026-10-08T09:00:00.000Z", reviewedBy: 6, reviewedAt: "2026-10-09T09:00:00.000Z" },
];

// type: Task | Test | Assignment
const assessments = [
  { id: 1, courseId: 1, type: "Task", title: "Build a counter with hooks", description: "Create a React counter using useState and push it to GitHub. Share the repo link.", dueDate: "2026-10-30", maxMarks: 10, createdBy: 6 },
  { id: 2, courseId: 1, type: "Test", title: "React Basics Quiz", description: "Answer the questions in the box: What is JSX? Difference between props and state? What does useEffect do?", dueDate: "2026-11-02", maxMarks: 20, createdBy: 6 },
  { id: 3, courseId: 1, type: "Assignment", title: "Portfolio page", description: "Build a one-page portfolio with React Router (Home, Projects, Contact) and share the deployed link.", dueDate: "2026-11-10", maxMarks: 50, createdBy: 1 },
  { id: 4, courseId: 2, type: "Task", title: "Python file organizer script", description: "Write a Python script that sorts files in a folder by extension.", dueDate: "2026-10-31", maxMarks: 15, createdBy: 7 },
  { id: 5, courseId: 3, type: "Assignment", title: "Login screen wireframe", description: "Design a login and register wireframe in Figma and share the view link.", dueDate: "2026-11-05", maxMarks: 25, createdBy: 6 },
];

const submissions = [
  { id: 1, assessmentId: 1, courseId: 1, userId: 2, content: "Counter built with useState and a reset button. Added keyboard shortcuts too.", link: "https://github.com/example/counter-app", submittedAt: "2026-10-12T10:00:00.000Z", status: "Graded", marks: 9, feedback: "Clean code. Add a README next time.", gradedBy: 6, gradedAt: "2026-10-13T09:00:00.000Z" },
  { id: 2, assessmentId: 2, courseId: 1, userId: 2, content: "JSX is a syntax extension. Props are read-only inputs, state is internal and changeable. useEffect runs side effects after render.", link: "", submittedAt: "2026-10-15T08:30:00.000Z", status: "Submitted", marks: null, feedback: "", gradedBy: null, gradedAt: null },
  { id: 3, assessmentId: 5, courseId: 3, userId: 3, content: "Wireframe with email/password, forgot password and social login.", link: "https://www.figma.com/file/example", submittedAt: "2026-10-14T16:20:00.000Z", status: "Submitted", marks: null, feedback: "", gradedBy: null, gradedAt: null },
  { id: 4, assessmentId: 4, courseId: 2, userId: 4, content: "Script uses os and shutil to move files into folders by extension.", link: "https://github.com/example/file-organizer", submittedAt: "2026-10-15T19:45:00.000Z", status: "Submitted", marks: null, feedback: "", gradedBy: null, gradedAt: null },
];

const db = {
  users,
  openings,
  applications,
  mentors,
  attendance,
  evaluations,
  courses: courses.map((course, index) => ({ ...course, id: index + 1, createdBy: 1 })),
  progress,
  enrollments,
  assessments,
  submissions,
};

writeFileSync(new URL("../data/db.json", import.meta.url), JSON.stringify(db, null, 2));
console.log("data/db.json created:", Object.entries(db).map(([k, v]) => `${k}=${v.length}`).join("  "));
