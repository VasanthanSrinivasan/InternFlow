// Turns raw json-server collections into export-ready datasets.
// Used by the Enrollments page and by the Reports page.
import { formatCode, formatDate } from "./format";

export function lessonIdsOf(course) {
  return (course?.modules ?? []).flatMap((module) => (module.lessons ?? []).map((lesson) => lesson.id));
}

// done / total / percent / completion ("Completed" | "In Progress" | "Not Started") for one student in one course
export function completionInfo(course, doneLessonIds = []) {
  const all = lessonIdsOf(course);
  const done = all.filter((id) => doneLessonIds.includes(id)).length;
  const total = all.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const completion = total > 0 && done >= total ? "Completed" : done > 0 ? "In Progress" : "Not Started";
  return { done, total, percent, completion };
}

// One row per enrollment with the student's progress. Shared by screen + exports.
export function buildEnrollmentRows({ enrollments, users, courses, progress }) {
  return enrollments.map((enrollment) => {
    const student = users.find((u) => u.id === enrollment.userId);
    const course = courses.find((c) => c.id === enrollment.courseId);
    const reviewer = users.find((u) => u.id === enrollment.reviewedBy);
    const row = progress.find((p) => p.userId === enrollment.userId && p.courseId === enrollment.courseId);
    const info = completionInfo(course, row?.lessonIds ?? []);

    return {
      ...enrollment,
      studentName: student?.name ?? "Unknown student",
      studentEmail: student?.email ?? "",
      college: student?.college ?? "",
      courseTitle: course?.title ?? "Course removed",
      category: course?.category ?? "",
      instructor: course?.instructor ?? "",
      reviewerName: reviewer?.name ?? "",
      done: info.done,
      total: info.total,
      percent: info.percent,
      // Only approved students can learn, so only they have a real completion status
      completionStatus: enrollment.status === "Approved" ? info.completion : "—",
    };
  });
}

export function enrollmentDataset(rows, name = "Enrollments & Learning") {
  return {
    name,
    columns: [
      "Enrollment ID", "Student", "Email", "College", "Course", "Category", "Instructor",
      "Requested On", "Status", "Reviewed By", "Reviewed On",
      "Lessons Done", "Total Lessons", "Progress %", "Completion Status",
    ],
    rows: rows.map((r) => [
      formatCode("ENR", r.id), r.studentName, r.studentEmail, r.college, r.courseTitle, r.category, r.instructor,
      formatDate(r.requestedAt), r.status, r.reviewerName, r.reviewedAt ? formatDate(r.reviewedAt) : "",
      r.done, r.total, r.status === "Approved" ? r.percent : "", r.completionStatus,
    ]),
  };
}

export function submissionDataset(rows, name = "Submissions") {
  return {
    name,
    columns: [
      "Submission ID", "Student", "Email", "Course", "Assessment", "Type", "Due Date", "Max Marks",
      "Submitted On", "Status", "Marks", "Feedback", "Graded By", "Answer", "Link",
    ],
    rows: rows.map((r) => [
      formatCode("SUB", r.id), r.studentName, r.studentEmail, r.courseTitle, r.assessmentTitle, r.type,
      r.dueDate ? formatDate(r.dueDate) : "", r.maxMarks, formatDate(r.submittedAt), r.status,
      r.status === "Graded" ? r.marks : "", r.feedback ?? "", r.graderName ?? "", r.content ?? "", r.link ?? "",
    ]),
  };
}

// One row per submission with names resolved
export function buildSubmissionRows({ submissions, assessments, users, courses }) {
  return submissions.map((submission) => {
    const assessment = assessments.find((a) => a.id === submission.assessmentId);
    const student = users.find((u) => u.id === submission.userId);
    const course = courses.find((c) => c.id === (assessment?.courseId ?? submission.courseId));
    const grader = users.find((u) => u.id === submission.gradedBy);

    return {
      ...submission,
      studentName: student?.name ?? "Unknown student",
      studentEmail: student?.email ?? "",
      courseTitle: course?.title ?? "Course removed",
      assessmentTitle: assessment?.title ?? "Assessment removed",
      type: assessment?.type ?? "",
      dueDate: assessment?.dueDate ?? "",
      maxMarks: assessment?.maxMarks ?? 0,
      graderName: grader?.name ?? "",
    };
  });
}

// Every dataset available on the Reports page
export function buildDatasets(data) {
  const { users, openings, applications, mentors, attendance, evaluations, courses, enrollments, progress, assessments, submissions } = data;
  const students = users.filter((u) => u.role === "student");
  const nameOf = (id) => users.find((u) => u.id === id)?.name ?? "Unknown";

  const enrollmentRows = buildEnrollmentRows({ enrollments, users, courses, progress });
  const submissionRows = buildSubmissionRows({ submissions, assessments, users, courses });

  return {
    enrollments: enrollmentDataset(enrollmentRows),
    submissions: submissionDataset(submissionRows),

    students: {
      name: "Students",
      columns: ["Student ID", "Name", "Email", "Phone", "College", "Joined", "Applications", "Approved Courses", "Completed Courses", "Submissions"],
      rows: students.map((s) => {
        const mine = enrollmentRows.filter((r) => r.userId === s.id && r.status === "Approved");
        return [
          formatCode("USR", s.id), s.name, s.email, s.phone ?? "", s.college ?? "", formatDate(s.createdAt),
          applications.filter((a) => a.userId === s.id).length,
          mine.length,
          mine.filter((r) => r.completionStatus === "Completed").length,
          submissions.filter((x) => x.userId === s.id).length,
        ];
      }),
    },

    courses: {
      name: "Courses",
      columns: ["Course ID", "Title", "Category", "Level", "Instructor", "Duration", "Modules", "Lessons", "Approved Students", "Pending Requests", "Completed"],
      rows: courses.map((c) => {
        const mine = enrollmentRows.filter((r) => r.courseId === c.id);
        return [
          formatCode("CRS", c.id), c.title, c.category, c.level, c.instructor, c.duration,
          (c.modules ?? []).length, lessonIdsOf(c).length,
          mine.filter((r) => r.status === "Approved").length,
          mine.filter((r) => r.status === "Pending").length,
          mine.filter((r) => r.completionStatus === "Completed").length,
        ];
      }),
    },

    openings: {
      name: "Openings",
      columns: ["Opening ID", "Title", "Company", "Location", "Mode", "Duration", "Stipend (Rs/month)", "Skills", "Status", "Applications"],
      rows: openings.map((o) => [
        formatCode("INT", o.id), o.title, o.company, o.location, o.type, o.duration, o.stipend,
        (o.skills ?? []).join(", "), o.status, applications.filter((a) => a.openingId === o.id).length,
      ]),
    },

    applications: {
      name: "Applications",
      columns: ["Application ID", "Student", "Email", "Internship", "Company", "Applied On", "Status"],
      rows: applications.map((a) => {
        const opening = openings.find((o) => o.id === a.openingId);
        return [formatCode("APP", a.id), a.student, a.email, opening?.title ?? "Opening removed", opening?.company ?? "", formatDate(a.appliedOn), a.status];
      }),
    },

    attendance: {
      name: "Attendance",
      columns: ["Record ID", "Student", "Date", "Status"],
      rows: attendance.map((a) => [a.id, nameOf(a.userId), formatDate(a.date), a.status]),
    },

    evaluations: {
      name: "Evaluations",
      columns: ["Evaluation ID", "Student", "Mentor", "Technical", "Communication", "Teamwork", "Average", "Feedback", "Date"],
      rows: evaluations.map((e) => [
        e.id, nameOf(e.userId), mentors.find((m) => m.id === e.mentorId)?.name ?? "Unknown",
        e.technical, e.communication, e.teamwork,
        Number(((e.technical + e.communication + e.teamwork) / 3).toFixed(1)), e.feedback ?? "", formatDate(e.createdAt),
      ]),
    },

    mentors: {
      name: "Mentors",
      columns: ["Mentor ID", "Name", "Role", "Email", "Skills", "Students", "Experience", "Status"],
      rows: mentors.map((m) => [m.id, m.name, m.role, m.email, (m.skills ?? []).join(", "), m.students, m.experience, m.status]),
    },
  };
}
