import './Users.css';
import { useEffect, useState } from "react";
import { Search, Trash2, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { deleteWithDependents, getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { hashPassword } from "../../utils/hash";
import { formatCode, formatDate, initials, roleLabel } from "../../utils/format";

const ROLES = ["student", "trainer", "admin"];
const blank = { name: "", email: "", password: "", role: "trainer" };

// Admin only: manage accounts and create trainers.
export default function Users() {
  const { user: me } = useAuth();

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // READ
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/users", { params: { _sort: "id", _order: "asc" } });
        setUsers(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const query = search.toLowerCase().trim();
    setFiltered(
      users.filter(
        (item) =>
          (roleFilter === "all" || item.role === roleFilter) &&
          `${item.name} ${item.email} ${item.college ?? ""}`.toLowerCase().includes(query)
      )
    );
  }, [users, search, roleFilter]);

  // CREATE
  async function createUser(event) {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);

    try {
      const existing = await api.get("/users", { params: { email } });
      if (existing.data.length > 0) {
        toast.error("An account with this email already exists.");
        return;
      }

      const response = await api.post("/users", {
        name: form.name.trim(),
        email,
        password: hashPassword(email, form.password),
        role: form.role,
        phone: "",
        college: form.role === "student" ? "" : "InternFlow Academy",
        createdAt: new Date().toISOString(),
      });
      setUsers((old) => [...old, response.data]);
      toast.success(`${roleLabel(form.role)} account created.`);
      setModal(false);
      setForm(blank);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // UPDATE -> change role
  async function changeRole(target, role) {
    try {
      const response = await api.patch(`/users/${target.id}`, { role });
      setUsers((old) => old.map((item) => (item.id === target.id ? response.data : item)));
      toast.success(`${target.name} is now a ${roleLabel(role).toLowerCase()}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // DELETE (with everything that belongs to the user)
  async function confirmDelete() {
    setSaving(true);

    try {
      await deleteWithDependents("users", deleteTarget.id, [
        "applications", "attendance", "evaluations", "progress", "enrollments", "submissions",
      ]);
      setUsers((old) => old.filter((item) => item.id !== deleteTarget.id));
      toast.success("Account deleted.");
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
          <span className="eyebrow">ADMINISTRATION</span>
          <h2>Users & Roles</h2>
          <p>Create trainers, change roles and remove accounts.</p>
        </div>
        <button className="primary-button" onClick={() => setModal(true)}>
          <UserPlus size={17} /> Add user
        </button>
      </div>

      <div className="filter-bar">
        <label className="catalog-search">
          <Search size={17} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or college..." />
        </label>
        <div className="chip-group" role="group" aria-label="Filter by role">
          {["all", ...ROLES].map((item) => (
            <button key={item} type="button" className={`chip ${roleFilter === item ? "chip-active" : ""}`} onClick={() => setRoleFilter(item)}>
              {item === "all" ? "All" : roleLabel(item)}
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
                <tr><th>User</th><th>College / Org</th><th>Joined</th><th>Role</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="student-cell">
                        <div className="table-avatar">{initials(item.name)}</div>
                        <div><strong>{item.name}</strong><span>{item.email} · {formatCode("USR", item.id)}</span></div>
                      </div>
                    </td>
                    <td>{item.college || "—"}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <select
                        className="status-select"
                        value={item.role}
                        disabled={item.id === me.id}
                        onChange={(e) => changeRole(item, e.target.value)}
                        aria-label={`Role for ${item.name}`}
                      >
                        {ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                      </select>
                    </td>
                    <td>
                      <button
                        className="icon-button danger-button"
                        disabled={item.id === me.id}
                        title={item.id === me.id ? "You cannot delete your own account" : "Delete account"}
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="5" className="empty-cell">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this account?"
        message={`${deleteTarget?.name} and all their applications, enrollments, progress and submissions will be removed.`}
        busy={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}>
          <form className="modal-card" onSubmit={createUser}>
            <div className="modal-header">
              <div><h3>Add user</h3><p>Share the email and password with the person.</p></div>
              <button type="button" className="icon-button" onClick={() => setModal(false)}><X size={19} /></button>
            </div>

            <label className="form-field">Full name<input required minLength={3} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="form-field">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <div className="form-grid">
              <label className="form-field">Temporary password<input required type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" /></label>
              <label className="form-field">Role
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? "Creating..." : "Create account"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
