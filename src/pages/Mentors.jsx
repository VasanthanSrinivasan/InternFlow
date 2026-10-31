import "./Mentors.css";
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Users,
  Mail,
  Pencil,
  Trash2,
  X,
  BriefcaseBusiness,
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../context/useAuth";
import PageState from "../components/common/PageState";
import ConfirmModal from "../components/common/ConfirmModal";

export default function Mentors() {
  const { isStaff } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    skills: "",
    students: "0",
    experience: "",
    status: "Available",
  });

  // READ -> GET /mentors
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await api.get("/mentors", { params: { _sort: "id", _order: "desc" } });
        setMentors(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  // SEARCH
  useEffect(() => {
    const query = search.toLowerCase().trim();

    setFilteredMentors(
      mentors.filter((mentor) =>
        [mentor.name, mentor.role, mentor.email, mentor.skills.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [mentors, search]);

  function openAddModal() {
    setEditingId(null);
    setForm({
      name: "",
      role: "",
      email: "",
      skills: "",
      students: "0",
      experience: "",
      status: "Available",
    });
    setShowModal(true);
  }

  function openEditModal(mentor) {
    setEditingId(mentor.id);
    setForm({
      ...mentor,
      skills: mentor.skills.join(", "),
      students: String(mentor.students),
    });
    setShowModal(true);
  }

  // CREATE (POST) or UPDATE (PUT)
  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.role.trim() || !form.email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const mentorData = {
      name: form.name.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      experience: form.experience,
      status: form.status,
      skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      students: Math.max(0, Number(form.students) || 0),
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        const response = await api.put(`/mentors/${editingId}`, { ...mentorData, id: editingId });
        setMentors((previous) => previous.map((mentor) => (mentor.id === editingId ? response.data : mentor)));
        toast.success("Mentor updated successfully.");
      } else {
        const response = await api.post("/mentors", mentorData);
        setMentors((previous) => [response.data, ...previous]);
        toast.success("Mentor added successfully.");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // DELETE -> also removes evaluations written by this mentor
  async function confirmDelete() {
    setSaving(true);

    try {
      await api.delete(`/mentors/${deleteTarget.id}`, { params: { _dependent: "evaluations" } });
      setMentors((previous) => previous.filter((mentor) => mentor.id !== deleteTarget.id));
      toast.success("Mentor deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Mentor Management</h1>
          <p className="page-subtitle">
            Manage mentors, expertise, availability and student assignments.
          </p>
        </div>

        {isStaff && (
          <button className="primary-btn" onClick={openAddModal}>
            <Plus size={18} />
            Add Mentor
          </button>
        )}
      </header>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
      <>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Mentors</span>
          <h2 className="stat-value">{mentors.length}</h2>
          <span className="stat-note">Registered mentors</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Available</span>
          <h2 className="stat-value">
            {mentors.filter((m) => m.status === "Available").length}
          </h2>
          <span className="stat-note">Ready for assignments</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Busy</span>
          <h2 className="stat-value">
            {mentors.filter((m) => m.status === "Busy").length}
          </h2>
          <span className="stat-note">Currently assigned</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Students Assigned</span>
          <h2 className="stat-value">
            {mentors.reduce((total, m) => total + m.students, 0)}
          </h2>
          <span className="stat-note">Across all mentors</span>
        </div>
      </div>

      <section className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="search"
              placeholder="Search mentors, roles or skills..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search mentors"
            />
          </div>

          <span className="stat-note">
            {filteredMentors.length} mentor(s) found
          </span>
        </div>

        {filteredMentors.length === 0 ? (
          <div className="empty-state">
            <Users size={38} />
            <h3>No mentors found</h3>
            <p>Try another search or add a new mentor.</p>
          </div>
        ) : (
          <div className="mentor-grid">
            {filteredMentors.map((mentor) => (
              <article className="mentor-card" key={mentor.id}>
                <div className="mentor-top">
                  <div className="mentor-avatar">
                    {mentor.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="mentor-info">
                    <h3 className="mentor-name">{mentor.name}</h3>
                    <p className="mentor-role">{mentor.role}</p>
                  </div>

                  <span
                    className={`status-badge ${
                      mentor.status === "Available"
                        ? "status-available"
                        : "status-busy"
                    }`}
                  >
                    {mentor.status}
                  </span>
                </div>

                <p className="mentor-description">
                  Experienced professional supporting students with practical
                  skills, project guidance and career development.
                </p>

                <div className="skill-list">
                  {mentor.skills.map((skill) => (
                    <span className="skill-tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mentor-metrics">
                  <div className="metric-item">
                    <strong className="metric-value">
                      {mentor.students}
                    </strong>
                    <span className="metric-label">Students</span>
                  </div>

                  <div className="metric-item">
                    <strong className="metric-value">
                      {mentor.experience || "—"}
                    </strong>
                    <span className="metric-label">Experience</span>
                  </div>

                  <div className="metric-item">
                    <strong className="metric-value">
                      <BriefcaseBusiness
                        size={17}
                        style={{ display: "inline" }}
                      />
                    </strong>
                    <span className="metric-label">Mentor</span>
                  </div>
                </div>

                <div className="mentor-footer">
                  <span className="mentor-email" title={mentor.email}>
                    <Mail
                      size={13}
                      style={{
                        display: "inline",
                        verticalAlign: "middle",
                        marginRight: 5,
                      }}
                    />
                    {mentor.email}
                  </span>

                  {isStaff && (
                  <div className="mentor-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Edit mentor"
                      aria-label={`Edit ${mentor.name}`}
                      onClick={() => openEditModal(mentor)}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="icon-btn"
                      title="Delete mentor"
                      aria-label={`Delete ${mentor.name}`}
                      onClick={() => setDeleteTarget(mentor)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      </>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this mentor?"
        message={`${deleteTarget?.name} and the evaluations they wrote will be removed.`}
        busy={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-modal-title"
          >
            <div className="modal-header">
              <h2 className="modal-title" id="mentor-modal-title">
                {editingId !== null ? "Edit Mentor" : "Add New Mentor"}
              </h2>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="mentor-name">
                  Full Name *
                </label>
                <input
                  id="mentor-name"
                  className="form-input"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                  placeholder="Enter mentor name"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mentor-role">
                  Professional Role *
                </label>
                <input
                  id="mentor-role"
                  className="form-input"
                  value={form.role}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value })
                  }
                  required
                  placeholder="e.g. Senior React Developer"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mentor-email">
                  Email Address *
                </label>
                <input
                  id="mentor-email"
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  required
                  placeholder="mentor@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mentor-skills">
                  Skills
                </label>
                <input
                  id="mentor-skills"
                  className="form-input"
                  value={form.skills}
                  onChange={(event) =>
                    setForm({ ...form, skills: event.target.value })
                  }
                  placeholder="React, JavaScript, Node.js"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mentor-experience">
                  Experience
                </label>
                <input
                  id="mentor-experience"
                  className="form-input"
                  value={form.experience}
                  onChange={(event) =>
                    setForm({ ...form, experience: event.target.value })
                  }
                  placeholder="e.g. 5 years"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mentor-students">
                  Assigned Students
                </label>
                <input
                  id="mentor-students"
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.students}
                  onChange={(event) =>
                    setForm({ ...form, students: event.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mentor-status">
                  Availability
                </label>
                <select
                  id="mentor-status"
                  className="form-select"
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                >
                  <option>Available</option>
                  <option>Busy</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Mentor"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
