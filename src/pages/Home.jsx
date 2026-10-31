import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BriefcaseBusiness, BookOpen, Mail, Phone, School, CalendarDays, ShieldCheck } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../context/useAuth";
import PageState from "../components/common/PageState";
import { formatCode, formatDate, initials, roleLabel, statusClass } from "../utils/format";

import "./Home.css";

export default function Home() {
  const { user, isStaff } = useAuth();
  const [openings, setOpenings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Staff (admin / trainer) see every application, a student sees only their own.
  useEffect(() => {
    const loadHome = async () => {
      try {
        const [openingsRes, applicationsRes] = await Promise.all([
          api.get("/openings", { params: { status: "Open", _sort: "id", _order: "desc", _limit: 3 } }),
          api.get("/applications", {
            params: { ...(isStaff ? {} : { userId: user.id }), _sort: "id", _order: "desc", _limit: 4 },
          }),
        ]);
        setOpenings(openingsRes.data);
        setApplications(applicationsRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadHome();
  }, [user.id, isStaff]);

  const details = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone || "Not added" },
    { icon: School, label: "College", value: user.college || "Not added" },
    { icon: ShieldCheck, label: "Role", value: roleLabel(user.role) },
    { icon: CalendarDays, label: "Member since", value: formatDate(user.createdAt) },
  ];

  return (
    <div className="home-page">
      <section className="welcome-banner">
        <div>
          <span className="welcome-eyebrow">{isStaff ? "ADMINISTRATION HOME" : "STUDENT HOME"}</span>
          <h2>Hello, {user.name.split(" ")[0]}! 👋</h2>
          <p>
            {isStaff
              ? "Manage openings, review applications and keep every intern on track."
              : "Find an internship, track your applications and keep learning every day."}
          </p>
          <div className="home-actions">
            <Link className="hero-button" to="/openings">Browse openings ↗</Link>
            <Link className="hero-button hero-button-ghost" to="/dashboard">Open dashboard</Link>
          </div>
        </div>
        <div className="welcome-art">
          <BookOpen size={50} strokeWidth={1.3} />
        </div>
      </section>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <div className="home-grid">
          <section className="panel profile-card">
            <div className="profile-card-head">
              <div className="profile-avatar profile-avatar-lg">{initials(user.name)}</div>
              <div>
                <h3>{user.name}</h3>
                <span className={`status-badge ${isStaff ? "status-shortlisted" : "status-open"}`}>
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>

            <ul className="detail-list">
              {details.map(({ icon: Icon, label, value }) => (
                <li key={label}>
                  <Icon size={16} />
                  <span>{label}</span>
                  <strong>{value}</strong>
                </li>
              ))}
            </ul>

            <Link to="/profile" className="secondary-button">Edit profile</Link>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Latest openings</h3>
                <p>Newest internships that are open for applications</p>
              </div>
              <Link to="/openings" className="text-link">View all <ArrowUpRight size={15} /></Link>
            </div>

            <ul className="mini-list">
              {openings.map((item) => (
                <li key={item.id}>
                  <div className="table-avatar"><BriefcaseBusiness size={17} /></div>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.company} · {item.location} · {item.type}</span>
                  </div>
                  <em>₹{Number(item.stipend).toLocaleString("en-IN")}</em>
                </li>
              ))}
              {openings.length === 0 && <li className="empty-cell">No open internships right now.</li>}
            </ul>
          </section>

          <section className="panel home-wide">
            <div className="panel-heading">
              <div>
                <h3>{isStaff ? "Recent applications" : "My recent applications"}</h3>
                <p>{isStaff ? "Latest records from all students" : "Your latest internship applications"}</p>
              </div>
              <Link to="/applications" className="text-link">View all <ArrowUpRight size={15} /></Link>
            </div>

            <ul className="mini-list">
              {applications.map((item) => (
                <li key={item.id}>
                  <div className="table-avatar">{initials(item.student)}</div>
                  <div>
                    <strong>{item.student}</strong>
                    <span>{formatCode("APP", item.id)} · Applied {formatDate(item.appliedOn)}</span>
                  </div>
                  <span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span>
                </li>
              ))}
              {applications.length === 0 && (
                <li className="empty-cell">
                  No applications yet. <Link to="/openings">Apply to an internship</Link>
                </li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
