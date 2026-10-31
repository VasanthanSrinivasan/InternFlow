import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, ListChecks, ClipboardCheck, FileText } from "lucide-react";
import toast from "react-hot-toast";
import api, { deleteWithDependents, getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { formatDate } from "../../utils/format";

const TYPES = ["Task", "Test", "Assignment"];
const TYPE_ICONS = { Task: ListChecks, Test: ClipboardCheck, Assignment: FileText };

const blank = { courseId: "", type: "Task", title: "", description: "", dueDate: "", maxMarks: 10 };

export default function Assessments() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // READ
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [assessmentsRes, coursesRes, submissionsRes] = await Promise.all([
          api.get("/assessments", { params: { _sort: "id", _order: "desc" } }),
          api.get("/courses"),
          api.get("/submissions"),
        ]);
        setItems(assessmentsRes.data);
        setCourses(coursesRes.data);
        setSubmissions(submissionsRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // SEARCH + TYPE filter
  useEffect(() => {
    const query = search.toLowerCase().trim();

    setFiltered(
      items.filter(
        (item) =>
          (typeFilter === "All" || item.type === typeFilter) &&
          `${item.title} ${item.description}`.toLowerCase().includes(query)
      )
    );
  }, [items, search, typeFilter]);

  const courseName = (id) => courses.find((course) => course.id === id)?.title ?? "Course removed";

  function openCreate() {
    setEditing(null);
    setForm(blank);
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm({ ...item, courseId: String(item.courseId) });
    setModal(true);
  }

  // CREATE (POST) or UPDATE (PUT)
  async function submit(event) {
    event.preventDefault();

    const record = {
      courseId: Number(form.courseId),
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
      maxMarks: Math.max(1, Number(form.maxMarks) || 1),
      createdBy: editing ? form.createdBy : user.id,
    };

    setSaving(true);

    try {
      if (editing) {
        const response = await api.put(`/assessments/${editing}`, { ...record, id: editing });
        setItems((old) => old.map((item) => (item.id === editing ? response.data : item)));
        toast.success("Updated successfully.");
      } else {
        const response = await api.post("/assessments", record);
        setItems((old) => [response.data, ...old]);
        toast.success(`${record.type} created. Enrolled students can see it now.`);
      }
      setModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // DELETE (also removes the submissions that belong to it)
  async function confirmDelete() {
    setSaving(true);

    try {
      await deleteWithDependents("assessments", deleteTarget.id, ["submissions"]);
      setItems((old) => old.filter((item) => item.id !== deleteTarget.id));
      setSubmissions((old) => old.filter((item) => item.assessmentId !== deleteTarget.id));
      toast.success("Deleted.");
      setDeleteTarget(null);
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
          <h2>Tasks, Tests & Assignments</h2>
          <p>Create work for your courses. Only approved students will see it.</p>
        </div>
        <button className="primary-button" onClick={openCreate} disabled={courses.length === 0}>
          <Plus size={17} /> New assessment
        </button>
      </div>

      <div className="filter-bar">
        <label className="catalog-search">
          <Search size={17} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or instructions..." />
        </label>
        <div className="chip-group" role="group" aria-label="Filter by type">
          {["All", ...TYPES].map((item) => (
            <button key={item} type="button" className={`chip ${typeFilter === item ? "chip-active" : ""}`} onClick={() => setTypeFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Course</th><th>Type</th><th>Due</th><th>Max marks</th><th>Submissions</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const Icon = TYPE_ICONS[item.type] ?? FileText;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="student-cell">
                          <div className="table-avatar"><Icon size={17} /></div>
                          <div><strong>{item.title}</strong><span>{item.description.slice(0, 60)}{item.description.length > 60 ? "..." : ""}</span></div>
                        </div>
                      </td>
                      <td>{courseName(item.courseId)}</td>
                      <td><span className={`type-badge type-${item.type.toLowerCase()}`}>{item.type}</span></td>
                      <td>{item.dueDate ? formatDate(item.dueDate) : "No deadline"}</td>
                      <td>{item.maxMarks}</td>
                      <td>{submissions.filter((s) => s.assessmentId === item.id).length}</td>
                      <td>
                        <div className="table-actions">
                          <button className="icon-button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`}><Pencil size={16} /></button>
                          <button className="icon-button danger-button" onClick={() => setDeleteTarget(item)} aria-label={`Delete ${item.title}`}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan="7" className="empty-cell">Nothing here yet. Create your first task, test or assignment.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this assessment?"
        message={`"${deleteTarget?.title}" and all student submissions for it will be removed.`}
        busy={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}>
          <form className="modal-card" onSubmit={submit}>
            <div className="modal-header">
              <div>
                <h3>{editing ? "Edit assessment" : "New assessment"}</h3>
                <p>Students answer with text and an optional link (GitHub, Drive, Figma...).</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setModal(false)}><X size={19} /></button>
            </div>

            <label className="form-field">
              Course
              <select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">Select course</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
            </label>

            <div className="form-grid">
              <label className="form-field">
                Type
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="form-field">
                Maximum marks
                <input type="number" min="1" required value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
              </label>
            </div>

            <label className="form-field">
              Title
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build a todo app" />
            </label>

            <label className="form-field">
              Instructions / questions
              <textarea required rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>

            <label className="form-field">
              Due date (optional)
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
