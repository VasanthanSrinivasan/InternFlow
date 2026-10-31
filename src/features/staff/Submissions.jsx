import { useEffect, useState } from "react";
import { Search, Inbox, Hourglass, BadgeCheck, Percent, X, ExternalLink, Eye } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import AnimatedNumber from "../../components/common/AnimatedNumber";
import ExportButtons from "../../components/common/ExportButtons";
import { buildSubmissionRows, submissionDataset } from "../../utils/reportData";
import { formatCode, formatDate, initials, statusClass } from "../../utils/format";

const TYPES = ["All", "Task", "Test", "Assignment"];
const STATUSES = ["All", "Submitted", "Graded"];

export default function Submissions() {
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("all");

  const [reviewing, setReviewing] = useState(null); // the row being graded
  const [grade, setGrade] = useState({ marks: "", feedback: "" });
  const [saving, setSaving] = useState(false);

  // READ
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [subsRes, assessRes, usersRes, coursesRes] = await Promise.all([
          api.get("/submissions", { params: { _sort: "id", _order: "desc" } }),
          api.get("/assessments"),
          api.get("/users"),
          api.get("/courses"),
        ]);
        setSubmissions(subsRes.data);
        setAssessments(assessRes.data);
        setStudents(usersRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // join the tables
  useEffect(() => {
    setRows(buildSubmissionRows({ submissions, assessments, users: students, courses }));
  }, [submissions, assessments, students, courses]);

  // filter
  useEffect(() => {
    const query = search.toLowerCase().trim();

    setFiltered(
      rows.filter(
        (row) =>
          (typeFilter === "All" || row.type === typeFilter) &&
          (statusFilter === "All" || row.status === statusFilter) &&
          (courseFilter === "all" || String(row.courseId) === courseFilter) &&
          `${row.studentName} ${row.assessmentTitle} ${row.courseTitle}`.toLowerCase().includes(query)
      )
    );
  }, [rows, search, typeFilter, statusFilter, courseFilter]);

  const graded = rows.filter((row) => row.status === "Graded");
  const average = graded.length
    ? Math.round(graded.reduce((sum, row) => sum + (row.marks / (row.maxMarks || 1)) * 100, 0) / graded.length)
    : 0;

  const stats = [
    { label: "Total submissions", value: rows.length, icon: Inbox, tone: "blue" },
    { label: "Waiting for grading", value: rows.filter((r) => r.status === "Submitted").length, icon: Hourglass, tone: "amber" },
    { label: "Graded", value: graded.length, icon: BadgeCheck, tone: "green" },
    { label: "Average score", value: `${average}%`, icon: Percent, tone: "purple" },
  ];

  function openReview(row) {
    setReviewing(row);
    setGrade({ marks: row.status === "Graded" ? String(row.marks) : "", feedback: row.feedback ?? "" });
  }

  // UPDATE -> PATCH marks + feedback
  async function saveGrade(event) {
    event.preventDefault();
    const marks = Number(grade.marks);

    if (Number.isNaN(marks) || marks < 0 || marks > reviewing.maxMarks) {
      toast.error(`Marks must be between 0 and ${reviewing.maxMarks}.`);
      return;
    }

    setSaving(true);

    try {
      const response = await api.patch(`/submissions/${reviewing.id}`, {
        marks,
        feedback: grade.feedback.trim(),
        status: "Graded",
        gradedBy: user.id,
        gradedAt: new Date().toISOString(),
      });
      setSubmissions((old) => old.map((item) => (item.id === reviewing.id ? response.data : item)));
      toast.success("Grade saved. The student can see it now.");
      setReviewing(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">TRAINER & ADMIN</span>
          <h2>Submissions Dashboard</h2>
          <p>Review student tasks, tests and assignments, then grade them.</p>
        </div>
        <ExportButtons filename="submissions" title="Student submissions" datasets={[submissionDataset(filtered)]} />
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <>
          <div className="kpi-grid">
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <div className={`kpi-card kpi-${tone}`} key={label}>
                <div className="kpi-icon"><Icon size={20} /></div>
                <div><strong><AnimatedNumber value={value} /></strong><span>{label}</span></div>
              </div>
            ))}
          </div>

          <div className="filter-bar">
            <label className="catalog-search">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, assessment or course..." />
            </label>

            <select className="filter-select" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Filter by course">
              <option value="all">All courses</option>
              {courses.map((course) => <option key={course.id} value={String(course.id)}>{course.title}</option>)}
            </select>

            <div className="chip-group" role="group" aria-label="Filter by type">
              {TYPES.map((item) => (
                <button key={item} type="button" className={`chip ${typeFilter === item ? "chip-active" : ""}`} onClick={() => setTypeFilter(item)}>{item}</button>
              ))}
            </div>

            <div className="chip-group" role="group" aria-label="Filter by status">
              {STATUSES.map((item) => (
                <button key={item} type="button" className={`chip ${statusFilter === item ? "chip-active" : ""}`} onClick={() => setStatusFilter(item)}>{item}</button>
              ))}
            </div>
          </div>

          <section className="panel">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Student</th><th>Assessment</th><th>Course</th><th>Submitted</th><th>Status</th><th>Marks</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="student-cell">
                          <div className="table-avatar">{initials(row.studentName)}</div>
                          <div><strong>{row.studentName}</strong><span>{row.studentEmail}</span></div>
                        </div>
                      </td>
                      <td>
                        <strong>{row.assessmentTitle}</strong>
                        <span className={`type-badge type-${row.type.toLowerCase()}`}>{row.type}</span>
                      </td>
                      <td>{row.courseTitle}</td>
                      <td>{formatDate(row.submittedAt)}</td>
                      <td><span className={`status-badge ${statusClass(row.status)}`}>{row.status}</span></td>
                      <td>{row.status === "Graded" ? `${row.marks} / ${row.maxMarks}` : `— / ${row.maxMarks}`}</td>
                      <td>
                        <button className="secondary-button small-button" onClick={() => openReview(row)}>
                          <Eye size={14} /> {row.status === "Graded" ? "View" : "Review"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan="7" className="empty-cell">No submissions found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {reviewing && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setReviewing(null); }}>
          <form className="modal-card review-card" onSubmit={saveGrade}>
            <div className="modal-header">
              <div>
                <h3>{reviewing.assessmentTitle}</h3>
                <p>{reviewing.studentName} · {reviewing.courseTitle} · {formatCode("SUB", reviewing.id)}</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setReviewing(null)}><X size={19} /></button>
            </div>

            <div className="review-block">
              <span>Student's answer</span>
              <p>{reviewing.content || "No written answer."}</p>
            </div>

            {reviewing.link && (
              <a className="review-link" href={reviewing.link} target="_blank" rel="noreferrer noopener">
                <ExternalLink size={15} /> Open submitted link
              </a>
            )}

            <div className="form-grid">
              <label className="form-field">
                Marks (out of {reviewing.maxMarks})
                <input type="number" min="0" max={reviewing.maxMarks} step="0.5" required value={grade.marks} onChange={(e) => setGrade({ ...grade, marks: e.target.value })} />
              </label>
              <div className="review-meta">
                <span>Submitted</span>
                <strong>{formatDate(reviewing.submittedAt)}</strong>
              </div>
            </div>

            <label className="form-field">
              Feedback for the student
              <textarea rows="3" value={grade.feedback} onChange={(e) => setGrade({ ...grade, feedback: e.target.value })} placeholder="What went well, what to improve..." />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setReviewing(null)}>Close</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : reviewing.status === "Graded" ? "Update grade" : "Save grade"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
