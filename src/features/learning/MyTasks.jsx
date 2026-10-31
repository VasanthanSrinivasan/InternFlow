import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, ClipboardCheck, FileText, X, Send, ExternalLink, CalendarClock, Lock } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import AnimatedNumber from "../../components/common/AnimatedNumber";
import { formatDate, statusClass, todayISO } from "../../utils/format";

import "./MyTasks.css";

const TYPES = ["All", "Task", "Test", "Assignment"];
const STATUSES = ["All", "Pending", "Submitted", "Graded"];
const TYPE_ICONS = { Task: ListChecks, Test: ClipboardCheck, Assignment: FileText };

export default function MyTasks() {
  const { user } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [items, setItems] = useState([]); // assessment + my submission, built in an effect
  const [filtered, setFiltered] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [active, setActive] = useState(null); // item being submitted
  const [form, setForm] = useState({ content: "", link: "" });
  const [saving, setSaving] = useState(false);

  // READ -> only courses where my enrollment is Approved
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const [enrollmentsRes, assessmentsRes, coursesRes, submissionsRes] = await Promise.all([
          api.get("/enrollments", { params: { userId: user.id, status: "Approved" } }),
          api.get("/assessments", { params: { _sort: "dueDate", _order: "asc" } }),
          api.get("/courses"),
          api.get("/submissions", { params: { userId: user.id } }),
        ]);

        const approvedCourseIds = enrollmentsRes.data.map((enrollment) => enrollment.courseId);
        setAssessments(assessmentsRes.data.filter((item) => approvedCourseIds.includes(item.courseId)));
        setCourses(coursesRes.data);
        setMySubmissions(submissionsRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user.id]);

  // join assessment + my submission
  useEffect(() => {
    setItems(
      assessments.map((assessment) => {
        const submission = mySubmissions.find((s) => s.assessmentId === assessment.id) ?? null;
        return {
          ...assessment,
          courseTitle: courses.find((c) => c.id === assessment.courseId)?.title ?? "Course",
          submission,
          state: submission ? submission.status : "Pending",
          overdue: Boolean(assessment.dueDate) && assessment.dueDate < todayISO() && !submission,
        };
      })
    );
  }, [assessments, mySubmissions, courses]);

  useEffect(() => {
    setFiltered(
      items.filter(
        (item) =>
          (typeFilter === "All" || item.type === typeFilter) &&
          (statusFilter === "All" || item.state === statusFilter)
      )
    );
  }, [items, typeFilter, statusFilter]);

  function openSubmit(item) {
    setActive(item);
    setForm({ content: item.submission?.content ?? "", link: item.submission?.link ?? "" });
  }

  // CREATE (first time) or UPDATE (edit before it is graded)
  async function submit(event) {
    event.preventDefault();

    const link = form.link.trim();
    if (link && !/^https?:\/\//i.test(link)) {
      toast.error("The link must start with http:// or https://");
      return;
    }

    const body = {
      content: form.content.trim(),
      link,
      submittedAt: new Date().toISOString(),
      status: "Submitted",
    };

    setSaving(true);

    try {
      if (active.submission) {
        const response = await api.patch(`/submissions/${active.submission.id}`, body);
        setMySubmissions((old) => old.map((s) => (s.id === active.submission.id ? response.data : s)));
        toast.success("Submission updated.");
      } else {
        const response = await api.post("/submissions", {
          ...body,
          assessmentId: active.id,
          courseId: active.courseId,
          userId: user.id,
          marks: null,
          feedback: "",
          gradedBy: null,
          gradedAt: null,
        });
        setMySubmissions((old) => [...old, response.data]);
        toast.success(`${active.type} submitted. Your trainer will review it.`);
      }
      setActive(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const counts = {
    pending: items.filter((i) => i.state === "Pending").length,
    submitted: items.filter((i) => i.state === "Submitted").length,
    graded: items.filter((i) => i.state === "Graded").length,
  };

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">STUDENT WORKSPACE</span>
          <h2>My Tasks, Tests & Assignments</h2>
          <p>Work set by your trainers for the courses you are enrolled in.</p>
        </div>
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <>
          <div className="kpi-grid kpi-grid-3">
            <div className="kpi-card kpi-amber"><div className="kpi-icon"><CalendarClock size={20} /></div><div><strong><AnimatedNumber value={counts.pending} /></strong><span>To do</span></div></div>
            <div className="kpi-card kpi-blue"><div className="kpi-icon"><Send size={20} /></div><div><strong><AnimatedNumber value={counts.submitted} /></strong><span>Waiting for grading</span></div></div>
            <div className="kpi-card kpi-green"><div className="kpi-icon"><ClipboardCheck size={20} /></div><div><strong><AnimatedNumber value={counts.graded} /></strong><span>Graded</span></div></div>
          </div>

          <div className="filter-bar">
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

          {items.length === 0 ? (
            <div className="catalog-empty">
              <Lock size={34} />
              <h3>No tasks yet</h3>
              <p>Tasks appear here once a trainer approves your course enrollment.</p>
              <Link to="/learning/courses" className="primary-button">Browse courses</Link>
            </div>
          ) : (
            <div className="task-list">
              {filtered.map((item) => {
                const Icon = TYPE_ICONS[item.type] ?? FileText;
                const graded = item.state === "Graded";

                return (
                  <article className="task-card" key={item.id}>
                    <div className="task-icon"><Icon size={22} /></div>

                    <div className="task-main">
                      <div className="task-title-row">
                        <h3>{item.title}</h3>
                        <span className={`type-badge type-${item.type.toLowerCase()}`}>{item.type}</span>
                        <span className={`status-badge ${statusClass(item.state)}`}>{item.state}</span>
                        {item.overdue && <span className="status-badge status-rejected">Overdue</span>}
                      </div>
                      <p>{item.description}</p>
                      <div className="task-meta">
                        <span>{item.courseTitle}</span>
                        <span>Due: {item.dueDate ? formatDate(item.dueDate) : "No deadline"}</span>
                        <span>Max marks: {item.maxMarks}</span>
                      </div>

                      {graded && (
                        <div className="task-grade">
                          <strong>{item.submission.marks} / {item.maxMarks}</strong>
                          <span>{item.submission.feedback || "No feedback written."}</span>
                        </div>
                      )}
                      {item.submission?.link && (
                        <a className="review-link" href={item.submission.link} target="_blank" rel="noreferrer noopener">
                          <ExternalLink size={14} /> Your submitted link
                        </a>
                      )}
                    </div>

                    <div className="task-action">
                      {graded ? (
                        <span className="muted-note">Graded — closed</span>
                      ) : (
                        <button className="primary-button small-button" onClick={() => openSubmit(item)}>
                          {item.submission ? "Edit submission" : "Submit work"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
              {filtered.length === 0 && <div className="panel empty-cell">No items match this filter.</div>}
            </div>
          )}
        </>
      )}

      {active && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }}>
          <form className="modal-card" onSubmit={submit}>
            <div className="modal-header">
              <div>
                <h3>{active.title}</h3>
                <p>{active.type} · {active.courseTitle} · {active.maxMarks} marks</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setActive(null)}><X size={19} /></button>
            </div>

            <div className="review-block">
              <span>Instructions</span>
              <p>{active.description}</p>
            </div>

            <label className="form-field">
              Your answer
              <textarea required rows="5" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Type your answer or describe your work..." />
            </label>

            <label className="form-field">
              Link to your work (optional)
              <input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://github.com/you/project" />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setActive(null)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}><Send size={16} /> {saving ? "Submitting..." : "Submit"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
