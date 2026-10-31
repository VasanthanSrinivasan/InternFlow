import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, X, BriefcaseBusiness, Send, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { formatCode, statusClass, todayISO } from "../../utils/format";

const emptyForm = {
  title: "",
  company: "",
  location: "",
  type: "Remote",
  duration: "3 Months",
  stipend: 0,
  skills: "",
  status: "Open",
};

export default function Openings() {
  const { user, isStaff } = useAuth();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [myApplications, setMyApplications] = useState([]); // student only
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // READ -> GET /openings (and the student's own applications)
  useEffect(() => {
    const fetchOpenings = async () => {
      try {
        const requests = [api.get("/openings", { params: { _sort: "id", _order: "desc" } })];
        if (!isStaff) requests.push(api.get("/applications", { params: { userId: user.id } }));

        const [openingsRes, applicationsRes] = await Promise.all(requests);
        setItems(openingsRes.data);
        if (applicationsRes) setMyApplications(applicationsRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchOpenings();
  }, [isStaff, user.id]);

  // The top bar search sends us here with ?q=...
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  // SEARCH -> filter whenever the list or the search text changes
  useEffect(() => {
    const query = search.toLowerCase().trim();
    setFiltered(
      items.filter((item) =>
        `${item.title} ${item.company} ${item.location} ${item.skills.join(" ")}`
          .toLowerCase()
          .includes(query)
      )
    );
  }, [items, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm({ ...item, skills: item.skills.join(", ") });
    setModal(true);
  }

  // CREATE (POST) or UPDATE (PUT)
  async function submit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.company.trim()) {
      toast.error("Title and company are required.");
      return;
    }

    const record = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      type: form.type,
      duration: form.duration,
      status: form.status,
      stipend: Math.max(0, Number(form.stipend) || 0),
      skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
    };

    setSaving(true);

    try {
      if (editing) {
        const response = await api.put(`/openings/${editing}`, { ...record, id: editing });
        setItems((old) => old.map((item) => (item.id === editing ? response.data : item)));
        toast.success("Opening updated.");
      } else {
        const response = await api.post("/openings", record);
        setItems((old) => [response.data, ...old]);
        toast.success("Opening created.");
      }
      setModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // DELETE -> also removes the applications that belonged to this opening
  async function confirmDelete() {
    setSaving(true);

    try {
      await api.delete(`/openings/${deleteTarget.id}`, { params: { _dependent: "applications" } });
      setItems((old) => old.filter((item) => item.id !== deleteTarget.id));
      toast.success("Opening deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // Student applies -> POST /applications
  async function apply(opening) {
    try {
      const response = await api.post("/applications", {
        userId: user.id,
        openingId: opening.id,
        student: user.name,
        email: user.email,
        status: "Under Review",
        appliedOn: todayISO(),
      });
      setMyApplications((old) => [...old, response.data]);
      toast.success(`Applied for ${opening.title}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">INTERNSHIP MANAGEMENT</span>
          <h2>Internship Openings</h2>
          <p>{isStaff ? "Create and manage internship opportunities." : "Browse openings and apply in one click."}</p>
        </div>
        {isStaff && (
          <button className="primary-button" onClick={openCreate}>
            <Plus size={17} /> Add Opening
          </button>
        )}
      </div>

      <div className="management-toolbar">
        <label className="catalog-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, company, location or skill..."
          />
        </label>
        <span>{filtered.length} openings</span>
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Internship</th>
                  <th>Location</th>
                  <th>Duration</th>
                  <th>Stipend / Month</th>
                  <th>Status</th>
                  <th>{isStaff ? "Actions" : "Apply"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const applied = myApplications.some((application) => application.openingId === item.id);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="student-cell">
                          <div className="table-avatar"><BriefcaseBusiness size={17} /></div>
                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.company} · {formatCode("INT", item.id)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{item.location} · {item.type}</td>
                      <td>{item.duration}</td>
                      <td>₹{Number(item.stipend).toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span>
                      </td>
                      <td>
                        {isStaff ? (
                          <div className="table-actions">
                            <button className="icon-button" onClick={() => openEdit(item)} aria-label="Edit opening">
                              <Pencil size={16} />
                            </button>
                            <button className="icon-button danger-button" onClick={() => setDeleteTarget(item)} aria-label="Delete opening">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : applied ? (
                          <span className="applied-tag"><CheckCircle2 size={15} /> Applied</span>
                        ) : (
                          <button
                            className="primary-button small-button"
                            disabled={item.status !== "Open"}
                            onClick={() => apply(item)}
                          >
                            <Send size={14} /> Apply
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" className="empty-cell">No openings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this opening?"
        message={`"${deleteTarget?.title}" and all applications for it will be removed.`}
        busy={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal(false);
        }}>
          <form className="modal-card" onSubmit={submit}>
            <div className="modal-header">
              <div>
                <h3>{editing ? "Edit Opening" : "Create Opening"}</h3>
                <p>Enter the internship details below.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setModal(false)}>
                <X size={19} />
              </button>
            </div>

            <label className="form-field">
              Internship title
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="React Developer Intern" />
            </label>

            <label className="form-field">
              Company
              <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
            </label>

            <div className="form-grid">
              <label className="form-field">
                Location
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Chennai" />
              </label>

              <label className="form-field">
                Work mode
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>Remote</option>
                  <option>Hybrid</option>
                  <option>On-site</option>
                </select>
              </label>

              <label className="form-field">
                Duration
                <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                  <option>1 Month</option>
                  <option>3 Months</option>
                  <option>6 Months</option>
                  <option>12 Months</option>
                </select>
              </label>

              <label className="form-field">
                Monthly stipend (₹)
                <input type="number" min="0" value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} />
              </label>
            </div>

            <label className="form-field">
              Skills (comma separated)
              <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, JavaScript, CSS" />
            </label>

            <label className="form-field">
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Open</option>
                <option>Closed</option>
                <option>Draft</option>
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Create Opening"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
