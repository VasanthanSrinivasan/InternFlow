import "./Dashboard.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness, Users, ClipboardCheck, GraduationCap,
  ArrowUpRight, Clock3, BookOpen, Award, CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";

import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import StatCard from "../../components/common/StatCard";
import PageState from "../../components/common/PageState";
import { formatDate, initials, statusClass } from "../../utils/format";

const colors = ["#5547e8", "#24a47c", "#f2a642", "#e56b8c"];

// Last 6 months, counted from the real applications.
function buildMonthlyData(applications) {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      month: date.toLocaleString("en-US", { month: "short" }),
      applications: 0,
    });
  }

  applications.forEach((application) => {
    const bucket = months.find((item) => item.key === String(application.appliedOn).slice(0, 7));
    if (bucket) bucket.applications += 1;
  });

  return months;
}

export default function Dashboard() {
  const { user, isStaff } = useAuth();

  const [openings, setOpenings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // READ -> admin sees everything, a student only sees their own applications and progress
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const own = isStaff ? {} : { userId: user.id };

        const [openingsRes, applicationsRes, enrollmentsRes, submissionsRes, progressRes] = await Promise.all([
          api.get("/openings"),
          api.get("/applications", { params: { ...own, _sort: "id", _order: "desc" } }),
          api.get("/enrollments", { params: own }),
          api.get("/submissions", { params: own }),
          api.get("/progress", { params: own }),
        ]);

        setOpenings(openingsRes.data);
        setApplications(applicationsRes.data);
        setEnrollments(enrollmentsRes.data);
        setSubmissions(submissionsRes.data);
        setProgress(progressRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isStaff, user.id]);

  // Chart data is rebuilt whenever the applications change
  useEffect(() => {
    const counts = {};
    applications.forEach((application) => {
      counts[application.status] = (counts[application.status] || 0) + 1;
    });

    setStatuses(Object.entries(counts).map(([name, value]) => ({ name, value })));
    setMonthlyData(buildMonthlyData(applications));
  }, [applications]);

  const lessonsDone = progress.reduce((total, row) => total + row.lessonIds.length, 0);

  const pendingEnrollments = enrollments.filter((item) => item.status === "Pending").length;
  const toGrade = submissions.filter((item) => item.status === "Submitted").length;

  const stats = isStaff
    ? [
        { title: "Active Openings", value: openings.filter((item) => item.status === "Open").length, icon: BriefcaseBusiness, color: "purple", change: "Available internships" },
        { title: "Applications", value: applications.length, icon: ClipboardCheck, color: "blue", change: "Student applications" },
        { title: "Course Enrollments", value: enrollments.length, icon: GraduationCap, color: "green", change: `${pendingEnrollments} waiting for approval` },
        { title: "Submissions", value: submissions.length, icon: Users, color: "orange", change: `${toGrade} waiting for grading` },
      ]
    : [
        { title: "Open Internships", value: openings.filter((item) => item.status === "Open").length, icon: BriefcaseBusiness, color: "purple", change: "You can apply now" },
        { title: "My Applications", value: applications.length, icon: ClipboardCheck, color: "blue", change: "Submitted by you" },
        { title: "Enrolled Courses", value: enrollments.filter((item) => item.status === "Approved").length, icon: Award, color: "green", change: `${enrollments.filter((item) => item.status === "Pending").length} waiting for approval` },
        { title: "Lessons Completed", value: lessonsDone, icon: CheckCircle2, color: "orange", change: `${progress.length} course(s) started` },
      ];

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div>
          <span className="welcome-eyebrow">{isStaff ? "ADMINISTRATION OVERVIEW" : "MY PROGRESS OVERVIEW"}</span>
          <h2>Welcome back, {user.name.split(" ")[0]}! 👋</h2>
          <p>
            {isStaff
              ? "Here's what's happening with your internships and student training."
              : "Here's how your applications and learning are going."}
          </p>
        </div>
        <div className="welcome-art">
          <BookOpen size={50} strokeWidth={1.3} />
        </div>
      </section>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
      <>
      <div className="dashboard-stats">
        {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>

      {isStaff && (pendingEnrollments > 0 || toGrade > 0) && (
        <section className="todo-banner">
          <strong>Needs your attention</strong>
          <div>
            {pendingEnrollments > 0 && (
              <Link to="/staff/enrollments">{pendingEnrollments} enrollment request(s) to approve <ArrowUpRight size={14} /></Link>
            )}
            {toGrade > 0 && (
              <Link to="/staff/submissions">{toGrade} submission(s) to grade <ArrowUpRight size={14} /></Link>
            )}
          </div>
        </section>
      )}

      <div className="dashboard-charts">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Application Overview</h3>
              <p>{isStaff ? "Applications received per month" : "Your applications per month"}</p>
            </div>
            <span className="chart-period">Last 6 months</span>
          </div>

          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="applicationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5547e8" stopOpacity={0.23} />
                    <stop offset="100%" stopColor="#5547e8" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf0f6" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#5547e8"
                  strokeWidth={3}
                  fill="url(#applicationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Application Status</h3>
              <p>Current application distribution</p>
            </div>
          </div>

          <div className="chart-area pie-chart-area">
            {statuses.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={91}
                    paddingAngle={4}
                  >
                    {statuses.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p>No applications available.</p>}
          </div>

          <div className="status-legend">
            {statuses.map((item, index) => (
              <div key={item.name}>
                <span>
                  <i style={{ background: colors[index % colors.length] }} />
                  {item.name}
                </span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h3>{isStaff ? "Recent Applications" : "My Recent Applications"}</h3>
            <p>{isStaff ? "Latest student application records" : "Your latest applications"}</p>
          </div>
          <Link to="/applications" className="text-link">
            View all <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Opening</th>
                <th>Applied On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.slice(0, 5).map((application) => {
                const opening = openings.find(
                  (item) => item.id === application.openingId
                );

                return (
                  <tr key={application.id}>
                    <td>
                      <div className="student-cell">
                        <div className="table-avatar">{initials(application.student)}</div>
                        <div>
                          <strong>{application.student}</strong>
                          <span>{application.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{opening?.title ?? "Opening unavailable"}</td>
                    <td>{formatDate(application.appliedOn)}</td>
                    <td>
                      <span className={`status-badge ${statusClass(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {applications.length === 0 && (
                <tr><td colSpan="4" className="empty-cell">No applications yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="dashboard-note">
          <Clock3 size={16} />
          <span>Live data loaded from json-server (data/db.json).</span>
        </div>
      </section>
      </>
      )}
    </div>
  );
}
