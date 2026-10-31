import "./Attendance.css";
import { useEffect, useState } from "react";
import { CalendarCheck, Download, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import { formatDate, initials, statusClass, todayISO } from "../../utils/format";

function countStatuses(records) {
  return {
    Present: records.filter((item) => item.status === "Present").length,
    Absent: records.filter((item) => item.status === "Absent").length,
    Leave: records.filter((item) => item.status === "Leave").length,
  };
}

function SummaryCards({ counts }) {
  return (
    <div className="attendance-summary">
      {Object.entries(counts).map(([name, count]) => (
        <div className="panel attendance-stat" key={name}>
          <span>{name}</span>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- ADMIN: daily register ---------------------------- */

function AdminAttendance() {
  const [students, setStudents] = useState([]);
  const [daily, setDaily] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Students are loaded once.
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get("/users", { params: { role: "student" } });
        setStudents(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    fetchStudents();
  }, []);

  // Attendance is loaded again every time the date changes.
  useEffect(() => {
    let ignore = false; // protects against a slow old request overwriting a newer one

    const fetchDaily = async () => {
      try {
        const response = await api.get("/attendance", { params: { date } });
        if (!ignore) {
          setDaily(response.data);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      }
    };

    fetchDaily();
    return () => {
      ignore = true;
    };
  }, [date]);

  const counts = countStatuses(daily);

  // CREATE (POST) the first time, UPDATE (PATCH) afterwards
  async function setStatus(student, status) {
    const existing = daily.find((item) => item.userId === student.id);

    try {
      if (existing) {
        const response = await api.patch(`/attendance/${existing.id}`, { status });
        setDaily((old) => old.map((item) => (item.id === existing.id ? response.data : item)));
      } else {
        const response = await api.post("/attendance", { userId: student.id, date, status });
        setDaily((old) => [...old, response.data]);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function markAllPresent() {
    const unmarked = students.filter((student) => !daily.some((item) => item.userId === student.id));

    if (unmarked.length === 0) {
      toast("Everyone is already marked for this date.");
      return;
    }

    try {
      const responses = await Promise.all(
        unmarked.map((student) => api.post("/attendance", { userId: student.id, date, status: "Present" }))
      );
      setDaily((old) => [...old, ...responses.map((response) => response.data)]);
      toast.success(`${unmarked.length} student(s) marked present.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function exportCsv() {
    const rows = [
      ["Student", "Date", "Status"],
      ...daily.map((item) => [
        students.find((student) => student.id === item.userId)?.name ?? `User ${item.userId}`,
        item.date,
        item.status,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Attendance report exported.");
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">INTERN TRACKING</span>
          <h2>Attendance</h2>
          <p>Record daily attendance and export reports.</p>
        </div>
        <div className="header-buttons">
          <button className="secondary-button" onClick={markAllPresent}>
            <CheckCheck size={17} /> Mark all present
          </button>
          <button className="primary-button" onClick={exportCsv}>
            <Download size={17} /> Export CSV
          </button>
        </div>
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <>
          <SummaryCards counts={counts} />

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3><CalendarCheck size={19} /> Daily attendance register</h3>
                <p>Select a date and update each student's attendance.</p>
              </div>
              <input className="date-control" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Student</th><th>Date</th><th>Attendance</th></tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const record = daily.find((item) => item.userId === student.id);

                    return (
                      <tr key={student.id}>
                        <td>
                          <div className="student-cell">
                            <div className="table-avatar">{initials(student.name)}</div>
                            <div><strong>{student.name}</strong><span>{student.email}</span></div>
                          </div>
                        </td>
                        <td>{formatDate(date)}</td>
                        <td>
                          <select
                            className="status-select"
                            value={record?.status ?? ""}
                            onChange={(e) => setStatus(student, e.target.value)}
                            aria-label={`Attendance for ${student.name}`}
                          >
                            <option value="" disabled>Select status</option>
                            <option>Present</option>
                            <option>Absent</option>
                            <option>Leave</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr><td colSpan="3" className="empty-cell">No students registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------------------------- STUDENT: own history ---------------------------- */

function StudentAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMine = async () => {
      try {
        const response = await api.get("/attendance", {
          params: { userId: user.id, _sort: "date", _order: "desc" },
        });
        setRecords(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchMine();
  }, [user.id]);

  const counts = countStatuses(records);
  const percent = records.length ? Math.round((counts.Present / records.length) * 100) : 0;

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">INTERN TRACKING</span>
          <h2>My Attendance</h2>
          <p>Your attendance is recorded by the administrator.</p>
        </div>
        <div className="page-count-card">
          <CalendarCheck size={20} />
          <strong>{percent}%</strong>
          <span>Attendance rate</span>
        </div>
      </div>

      <PageState loading={loading} error={error} />

      {!loading && !error && (
        <>
          <SummaryCards counts={counts} />

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Attendance history</h3>
                <p>{records.length} day(s) recorded</p>
              </div>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {records.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.date)}</td>
                      <td><span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span></td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan="2" className="empty-cell">No attendance recorded for you yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function Attendance() {
  const { isStaff } = useAuth();
  return isStaff ? <AdminAttendance /> : <StudentAttendance />;
}
