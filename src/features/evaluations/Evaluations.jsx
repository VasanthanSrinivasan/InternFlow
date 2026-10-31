import "./Evaluations.css";

import { useEffect, useState } from "react";
import { Plus, Star, Trash2, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import ConfirmModal from "../../components/common/ConfirmModal";

const blank = {
  userId: "",
  mentorId: "",
  technical: 8,
  communication: 8,
  teamwork: 8,
  feedback: "",
};

export default function Evaluations() {
  const { user, isStaff } = useAuth();

  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // READ -> evaluations + mentors + students
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [evaluationsRes, mentorsRes, studentsRes] = await Promise.all([
          api.get("/evaluations", {
            params: { ...(isStaff ? {} : { userId: user.id }), _sort: "id", _order: "desc" },
          }),
          api.get("/mentors"),
          isStaff ? api.get("/users", { params: { role: "student" } }) : Promise.resolve({ data: [user] }),
        ]);
        setItems(evaluationsRes.data);
        setMentors(mentorsRes.data);
        setStudents(studentsRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isStaff, user]);

  function openCreate() {
    setEditing(null);
    setForm(blank);
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm({ ...item, userId: String(item.userId), mentorId: String(item.mentorId) });
    setModal(true);
  }

  // CREATE (POST) or UPDATE (PUT)
  async function submit(event) {
    event.preventDefault();

    const record = {
      userId: Number(form.userId),
      mentorId: Number(form.mentorId),
      technical: Number(form.technical),
      communication: Number(form.communication),
      teamwork: Number(form.teamwork),
      feedback: form.feedback.trim(),
      createdAt: editing ? form.createdAt : new Date().toISOString(),
    };

    setSaving(true);

    try {
      if (editing) {
        const response = await api.put(`/evaluations/${editing}`, { ...record, id: editing });
        setItems((old) => old.map((item) => (item.id === editing ? response.data : item)));
        toast.success("Evaluation updated.");
      } else {
        const response = await api.post("/evaluations", record);
        setItems((old) => [response.data, ...old]);
        toast.success("Evaluation saved.");
      }
      setModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // DELETE
  async function confirmDelete() {
    setSaving(true);

    try {
      await api.delete(`/evaluations/${deleteTarget.id}`);
      setItems((old) => old.filter((item) => item.id !== deleteTarget.id));
      toast.success("Evaluation deleted.");
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
          <span className="eyebrow">PERFORMANCE MANAGEMENT</span>
          <h2>{isStaff ? "Evaluations" : "My Evaluations"}</h2>
          <p>
            {isStaff
              ? "Review intern performance and record mentor feedback."
              : "See the feedback your mentors have shared with you."}
          </p>
        </div>
        {isStaff && (
          <button className="primary-button" onClick={openCreate}>
            <Plus size={17} /> New Evaluation
          </button>
        )}
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <div className="evaluation-grid">
          {items.map((item) => {
            const average = ((item.technical + item.communication + item.teamwork) / 3).toFixed(1);
            const studentName = students.find((s) => s.id === item.userId)?.name ?? "Unknown student";
            const mentorName = mentors.find((m) => m.id === item.mentorId)?.name ?? "Unknown mentor";

            return (
              <article className="panel evaluation-card" key={item.id}>
                <div className="evaluation-card-heading">
                  <div className="table-avatar"><Star size={19} /></div>
                  {isStaff && (
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => openEdit(item)} aria-label="Edit evaluation">
                        <Pencil size={16} />
                      </button>
                      <button className="icon-button danger-button" onClick={() => setDeleteTarget(item)} aria-label="Delete evaluation">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <h3>{studentName}</h3>
                <p className="evaluation-mentor">Mentor: {mentorName}</p>

                <div className="evaluation-average">
                  <strong>{average}</strong>
                  <span>/ 10 average score</span>
                </div>

                {[
                  ["Technical Skills", item.technical],
                  ["Communication", item.communication],
                  ["Teamwork", item.teamwork],
                ].map(([label, score]) => (
                  <div className="score-row" key={label}>
                    <span>{label}</span>
                    <strong>{score}/10</strong>
                    <div className="progress-track">
                      <div style={{ width: `${score * 10}%` }} />
                    </div>
                  </div>
                ))}

                <blockquote className="evaluation-feedback">
                  {item.feedback || "No written feedback provided."}
                </blockquote>
              </article>
            );
          })}
          {!items.length && <div className="panel empty-cell">No evaluations recorded yet.</div>}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this evaluation?"
        message="This action cannot be undone."
        busy={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {modal && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={submit}>
            <div className="modal-header">
              <div>
                <h3>{editing ? "Edit Evaluation" : "New Evaluation"}</h3>
                <p>Score the intern on a scale of 1–10.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setModal(false)}>
                <X size={18} />
              </button>
            </div>

            <label className="form-field">
              Student
              <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              Mentor
              <select required value={form.mentorId} onChange={(e) => setForm({ ...form, mentorId: e.target.value })}>
                <option value="">Select mentor</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>{mentor.name}</option>
                ))}
              </select>
            </label>

            {[
              ["technical", "Technical Skills"],
              ["communication", "Communication"],
              ["teamwork", "Teamwork"],
            ].map(([key, label]) => (
              <label className="form-field" key={key}>
                {label}: {form[key]}/10
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                />
              </label>
            ))}

            <label className="form-field">
              Feedback
              <textarea rows="3" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="Provide constructive feedback..." />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Save Evaluation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
