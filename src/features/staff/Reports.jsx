import "./Reports.css";

import { useEffect, useState } from "react";
import {
  BarChart3, Users, BookOpen, UserCheck, Inbox, BriefcaseBusiness, ClipboardList,
  CalendarCheck, Star, UserSquare2, ShieldCheck, Layers,
} from "lucide-react";
import api, { getErrorMessage } from "../../api/client";
import useAuth from "../../context/useAuth";
import PageState from "../../components/common/PageState";
import ExportButtons from "../../components/common/ExportButtons";
import { buildDatasets } from "../../utils/reportData";

const COLLECTIONS = [
  "users", "openings", "applications", "mentors", "attendance",
  "evaluations", "courses", "enrollments", "progress", "assessments", "submissions",
];

const REPORTS = [
  { key: "enrollments", label: "Enrollments & Learning", icon: UserCheck, text: "Student, course, approval status, lessons done and completion status." },
  { key: "submissions", label: "Submissions", icon: Inbox, text: "Tasks, tests and assignments with answers, marks and feedback." },
  { key: "students", label: "Students", icon: Users, text: "Student contact details with applications and course counts." },
  { key: "courses", label: "Courses", icon: BookOpen, text: "Catalog with lesson counts, learners and completions." },
  { key: "openings", label: "Internship Openings", icon: BriefcaseBusiness, text: "Openings with stipend, skills and number of applications." },
  { key: "applications", label: "Applications", icon: ClipboardList, text: "Every internship application and its decision." },
  { key: "attendance", label: "Attendance", icon: CalendarCheck, text: "Daily attendance records for all students." },
  { key: "evaluations", label: "Evaluations", icon: Star, text: "Mentor scores and written feedback." },
  { key: "mentors", label: "Mentors", icon: UserSquare2, text: "Mentor directory with skills and workload." },
];

export default function Reports() {
  const { user, isAdmin } = useAuth();

  const [datasets, setDatasets] = useState(null);
  const [selected, setSelected] = useState("enrollments");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // READ every collection once, then build the datasets in an effect
  const [raw, setRaw] = useState(null);

  useEffect(() => {
    const fetchEverything = async () => {
      try {
        const responses = await Promise.all(COLLECTIONS.map((name) => api.get(`/${name}`)));
        const data = {};
        COLLECTIONS.forEach((name, index) => {
          data[name] = responses[index].data;
        });
        setRaw(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchEverything();
  }, []);

  useEffect(() => {
    if (raw) setDatasets(buildDatasets(raw));
  }, [raw]);

  const activeReport = REPORTS.find((report) => report.key === selected);
  const dataset = datasets?.[selected];
  const allDatasets = datasets ? REPORTS.map((report) => datasets[report.key]) : [];

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">TRAINER & ADMIN</span>
          <h2>Reports Center</h2>
          <p>Download any report as CSV, Excel or PDF. Passwords are never included.</p>
        </div>
        <div className="role-pill"><ShieldCheck size={15} /> Signed in as {isAdmin ? "Admin" : "Trainer"}: {user.name}</div>
      </div>

      <PageState loading={loading} error={error} />

      {datasets && (
        <>
          <section className="panel export-all">
            <div>
              <h3><Layers size={19} /> Complete data workbook</h3>
              <p>All {REPORTS.length} reports together: one Excel sheet or one PDF section per report.</p>
            </div>
            <ExportButtons filename="internflow-all-reports" title="Complete data report" datasets={allDatasets} />
          </section>

          <div className="report-grid">
            {REPORTS.map(({ key, label, icon: Icon, text }) => (
              <button
                key={key}
                type="button"
                className={`report-card ${selected === key ? "report-card-active" : ""}`}
                onClick={() => setSelected(key)}
                aria-pressed={selected === key}
              >
                <div className="report-icon"><Icon size={20} /></div>
                <strong>{label}</strong>
                <span>{text}</span>
                <em>{datasets[key].rows.length} records</em>
              </button>
            ))}
          </div>

          {dataset && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3><BarChart3 size={19} /> {activeReport.label}</h3>
                  <p>{dataset.rows.length} records · {dataset.columns.length} columns · preview of the first 8 rows</p>
                </div>
                <ExportButtons filename={`internflow-${selected}`} title={activeReport.label} datasets={[dataset]} />
              </div>

              <div className="table-scroll">
                <table className="data-table preview-table">
                  <thead>
                    <tr>{dataset.columns.map((column) => <th key={column}>{column}</th>)}</tr>
                  </thead>
                  <tbody>
                    {dataset.rows.slice(0, 8).map((row, index) => (
                      <tr key={index}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{String(cell ?? "").slice(0, 60)}</td>
                        ))}
                      </tr>
                    ))}
                    {dataset.rows.length === 0 && (
                      <tr><td colSpan={dataset.columns.length} className="empty-cell">No data to export yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
