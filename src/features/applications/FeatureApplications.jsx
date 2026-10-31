import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { formatCode, formatDate, initials, statusClass } from "../../utils/format";

const applicationStatuses = ["Under Review", "Shortlisted", "Approved", "Rejected"];

export default function Applications() {
  const { user, isStaff } = useAuth();

  const [items, setItems] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  // READ -> admin gets everything, a student only gets their own rows (?userId=)
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const [applicationsRes, openingsRes] = await Promise.all([
          api.get("/applications", {
            params: { ...(isStaff ? {} : { userId: user.id }), _sort: "id", _order: "desc" },
          }),
          api.get("/openings"),
        ]);
        setItems(applicationsRes.data);
        setOpenings(openingsRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [isStaff, user.id]);

  useEffect(() => {
    const query = search.toLowerCase().trim();
    setFiltered(
      items.filter((item) =>
        `${item.student} ${item.email} ${formatCode("APP", item.id)}`.toLowerCase().includes(query)
      )
    );
  }, [items, search]);

  // UPDATE -> PATCH only the field that changed
  async function updateStatus(id, status) {
    try {
      const response = await api.patch(`/applications/${id}`, { status });
      setItems((old) => old.map((item) => (item.id === id ? response.data : item)));
      toast.success("Application status updated.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // DELETE
  async function confirmDelete() {
    setBusy(true);

    try {
      await api.delete(`/applications/${deleteTarget.id}`);
      setItems((old) => old.filter((item) => item.id !== deleteTarget.id));
      toast.success(isStaff ? "Application deleted." : "Application withdrawn.");
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
          <span className="eyebrow">{isStaff ? "STUDENT RECRUITMENT" : "MY INTERNSHIPS"}</span>
          <h2>{isStaff ? "Applications" : "My Applications"}</h2>
          <p>
            {isStaff
              ? "Review student applications and update decisions."
              : "Track the status of every internship you applied for."}
          </p>
        </div>
        <div className="page-count-card">
          <ClipboardList size={20} />
          <strong>{items.length}</strong>
          <span>{isStaff ? "Total applications" : "Your applications"}</span>
        </div>
      </div>

      <div className="management-toolbar">
        <label className="catalog-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or application ID..."
          />
        </label>
        <span>{filtered.length} records</span>
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Internship</th>
                  <th>Applied On</th>
                  <th>{isStaff ? "Decision" : "Status"}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const opening = openings.find((o) => o.id === item.openingId);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="student-cell">
                          <div className="table-avatar">{initials(item.student)}</div>
                          <div>
                            <strong>{item.student}</strong>
                            <span>{item.email} · {formatCode("APP", item.id)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{opening ? `${opening.title} · ${opening.company}` : "Opening unavailable"}</td>
                      <td>{formatDate(item.appliedOn)}</td>
                      <td>
                        {isStaff ? (
                          <select
                            className="status-select"
                            value={item.status}
                            onChange={(e) => updateStatus(item.id, e.target.value)}
                          >
                            {applicationStatuses.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span>
                        )}
                      </td>
                      <td>
                        <button className="secondary-button small-button" onClick={() => setDeleteTarget(item)}>
                          {isStaff ? "Delete" : "Withdraw"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      No applications found.{" "}
                      {!isStaff && <Link to="/openings">Browse internship openings</Link>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={isStaff ? "Delete this application?" : "Withdraw this application?"}
        message="This action cannot be undone."
        confirmText={isStaff ? "Delete" : "Withdraw"}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
