import { useEffect, useState } from "react";
import { UserCheck, Clock, CheckCircle2, Trophy, Search, Check, X, Plus, Trash2, Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import AnimatedNumber from "../../components/common/AnimatedNumber";
import ConfirmModal from "../../components/common/ConfirmModal";
import ExportButtons from "../../components/common/ExportButtons";
import { buildEnrollmentRows, enrollmentDataset } from "../../utils/reportData";
import { formatCode, formatDate, initials, statusClass } from "../../utils/format";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];

export default function Enrollments() {
  const { user } = useAuth();

  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // values computed with useEffect (no useMemo)
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [courseSummary, setCourseSummary] = useState([]);

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ userId: "", courseId: "" });
  const [busy, setBusy] = useState(false);

  // READ
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [enrollmentsRes, studentsRes, coursesRes, progressRes] = await Promise.all([
          api.get("/enrollments", { params: { _sort: "id", _order: "desc" } }),
          api.get("/users", { params: { role: "student" } }),
          api.get("/courses"),
          api.get("/progress"),
        ]);
        setEnrollments(enrollmentsRes.data);
        setStudents(studentsRes.data);
        setCourses(coursesRes.data);
        setProgress(progressRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Join enrollments + students + courses + progress, and build the per-course summary
  useEffect(() => {
    const built = buildEnrollmentRows({ enrollments, users: students, courses, progress });
    setRows(built);

    setCourseSummary(
      courses.map((course) => {
        const mine = built.filter((row) => row.courseId === course.id);
        return {
          id: course.id,
          title: course.title,
          approved: mine.filter((row) => row.status === "Approved").length,
          pending: mine.filter((row) => row.status === "Pending").length,
          completed: mine.filter((row) => row.completionStatus === "Completed").length,
        };
      })
    );
  }, [enrollments, students, courses, progress]);

  // FILTER
  useEffect(() => {
    const query = search.toLowerCase().trim();

    setFiltered(
      rows.filter(
        (row) =>
          (statusFilter === "All" || row.status === statusFilter) &&
          (courseFilter === "all" || String(row.courseId) === courseFilter) &&
          `${row.studentName} ${row.studentEmail} ${row.courseTitle}`.toLowerCase().includes(query)
      )
    );
  }, [rows, search, courseFilter, statusFilter]);

  const stats = [
    { label: "Total enrollments", value: rows.length, icon: UserCheck, tone: "blue" },
    { label: "Waiting for approval", value: rows.filter((r) => r.status === "Pending").length, icon: Clock, tone: "amber" },
    { label: "Approved learners", value: rows.filter((r) => r.status === "Approved").length, icon: CheckCircle2, tone: "green" },
    { label: "Courses completed", value: rows.filter((r) => r.completionStatus === "Completed").length, icon: Trophy, tone: "purple" },
  ];

  // UPDATE -> PATCH status (approve / reject / revoke)
  async function review(row, status) {
    try {
      const response = await api.patch(`/enrollments/${row.id}`, {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
      });
      setEnrollments((old) => old.map((item) => (item.id === row.id ? response.data : item)));
      toast.success(
        status === "Approved"
          ? `${row.studentName} can now learn ${row.courseTitle}.`
          : status === "Rejected"
          ? "Enrollment rejected."
          : "Enrollment updated."
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // CREATE -> staff enrolls a student directly (already approved)
  async function enrollStudent(event) {
    event.preventDefault();
    const userId = Number(enrollForm.userId);
    const courseId = Number(enrollForm.courseId);
    const existing = enrollments.find((e) => e.userId === userId && e.courseId === courseId);

    setBusy(true);

    try {
      const approval = { status: "Approved", reviewedBy: user.id, reviewedAt: new Date().toISOString() };

      if (existing) {
        const response = await api.patch(`/enrollments/${existing.id}`, approval);
        setEnrollments((old) => old.map((item) => (item.id === existing.id ? response.data : item)));
      } else {
        const response = await api.post("/enrollments", {
          userId,
          courseId,
          requestedAt: new Date().toISOString(),
          ...approval,
        });
        setEnrollments((old) => [response.data, ...old]);
      }
      toast.success("Student enrolled and approved.");
      setEnrollModal(false);
      setEnrollForm({ userId: "", courseId: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // DELETE
  async function confirmDelete() {
    setBusy(true);

    try {
      await api.delete(`/enrollments/${deleteTarget.id}`);
      setEnrollments((old) => old.filter((item) => item.id !== deleteTarget.id));
      toast.success("Enrollment removed.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">TRAINER & ADMIN</span>
          <h2>Enrollment Dashboard</h2>
          <p>See who enrolled in which course, approve requests and track completion.</p>
        </div>
        <div className="header-buttons">
          <ExportButtons
            filename="enrollments-learning"
            title="Enrollments and learning progress"
            datasets={[enrollmentDataset(filtered)]}
          />
          <button className="primary-button" onClick={() => setEnrollModal(true)}>
            <Plus size={17} /> Enroll student
          </button>
        </div>
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <>
          <div className="kpi-grid">
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <div className={`kpi-card kpi-${tone}`} key={label}>
                <div className="kpi-icon"><Icon size={20} /></div>
                <div>
                  <strong><AnimatedNumber value={value} /></strong>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Course-wise summary</h3>
                <p>Approved learners, pending requests and completions per course</p>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table compact-table">
                <thead>
                  <tr><th>Course</th><th>Approved</th><th>Pending</th><th>Completed</th></tr>
                </thead>
                <tbody>
                  {courseSummary.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.title}</strong></td>
                      <td>{item.approved}</td>
                      <td>{item.pending > 0 ? <span className="status-badge status-pending">{item.pending}</span> : 0}</td>
                      <td>{item.completed}</td>
                    </tr>
                  ))}
                  {courseSummary.length === 0 && <tr><td colSpan="4" className="empty-cell">No courses yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <div className="filter-bar">
            <label className="catalog-search">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, email or course..." />
            </label>

            <select className="filter-select" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Filter by course">
              <option value="all">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>{course.title}</option>
              ))}
            </select>

            <div className="chip-group" role="group" aria-label="Filter by status">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${statusFilter === item ? "chip-active" : ""}`}
                  onClick={() => setStatusFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <section className="panel">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Requested</th>
                    <th>Enrollment</th>
                    <th>Progress</th>
                    <th>Completion</th>
                    <th>Actions</th>
                  </tr>
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
                        <strong>{row.courseTitle}</strong>
                        <span className="cell-sub">{formatCode("ENR", row.id)} · {row.category}</span>
                      </td>
                      <td>{formatDate(row.requestedAt)}</td>
                      <td>
                        <span className={`status-badge ${statusClass(row.status)}`}>{row.status}</span>
                        {row.reviewerName && <span className="cell-sub">by {row.reviewerName}</span>}
                      </td>
                      <td>
                        {row.status === "Approved" ? (
                          <div className="mini-progress">
                            <div className="progress-track"><div style={{ width: `${row.percent}%` }} /></div>
                            <span>{row.done}/{row.total} lessons · {row.percent}%</span>
                          </div>
                        ) : (
                          <span className="cell-sub">Not started learning</span>
                        )}
                      </td>
                      <td>
                        {row.status === "Approved" ? (
                          <span className={`status-badge ${statusClass(row.completionStatus)}`}>{row.completionStatus}</span>
                        ) : "—"}
                      </td>
                      <td>
                        <div className="table-actions">
                          {row.status !== "Approved" && (
                            <button className="icon-button approve-button" onClick={() => review(row, "Approved")} aria-label={`Approve ${row.studentName} for ${row.courseTitle}`} title="Approve">
                              <Check size={16} />
                            </button>
                          )}
                          {row.status === "Pending" && (
                            <button className="icon-button danger-button" onClick={() => review(row, "Rejected")} aria-label={`Reject ${row.studentName} for ${row.courseTitle}`} title="Reject">
                              <X size={16} />
                            </button>
                          )}
                          {row.status === "Approved" && (
                            <button className="icon-button" onClick={() => review(row, "Rejected")} aria-label={`Revoke ${row.studentName} from ${row.courseTitle}`} title="Revoke access">
                              <Undo2 size={16} />
                            </button>
                          )}
                          <button className="icon-button danger-button" onClick={() => setDeleteTarget(row)} aria-label={`Delete enrollment of ${row.studentName} in ${row.courseTitle}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="7" className="empty-cell">No enrollments match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this enrollment?"
        message={`${deleteTarget?.studentName}'s enrollment in "${deleteTarget?.courseTitle}" will be removed.`}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {enrollModal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEnrollModal(false); }}>
          <form className="modal-card" onSubmit={enrollStudent}>
            <div className="modal-header">
              <div>
                <h3>Enroll a student</h3>
                <p>The enrollment is approved immediately.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setEnrollModal(false)}><X size={19} /></button>
            </div>

            <label className="form-field">
              Student
              <select required value={enrollForm.userId} onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })}>
                <option value="">Select student</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
              </select>
            </label>

            <label className="form-field">
              Course
              <select required value={enrollForm.courseId} onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}>
                <option value="">Select course</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setEnrollModal(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving..." : "Enroll & approve"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
