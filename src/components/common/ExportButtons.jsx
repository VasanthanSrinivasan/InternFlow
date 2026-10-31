import { useState } from "react";
import { FileText, FileSpreadsheet, FileDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../../context/useAuth";
import { downloadCSV, downloadExcel, downloadPDF } from "../../utils/exporters";

// <ExportButtons filename="enrollments" title="Enrollment report" datasets={[dataset]} />
// CSV can only hold ONE table, so it is disabled when more than one dataset is passed.
export default function ExportButtons({ filename, title, datasets, disabled = false }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState("");

  const empty = datasets.every((dataset) => dataset.rows.length === 0);

  async function run(format) {
    setBusy(format);

    try {
      if (format === "csv") downloadCSV(filename, datasets[0]);
      if (format === "excel") await downloadExcel(filename, datasets);
      if (format === "pdf") await downloadPDF(filename, title, datasets, user?.name);
      toast.success(`${format === "excel" ? "Excel" : format.toUpperCase()} file downloaded.`);
    } catch (err) {
      console.error(err);
      toast.error("Could not create the file. Please try again.");
    } finally {
      setBusy("");
    }
  }

  const formats = [
    { key: "csv", label: "CSV", icon: FileText, off: datasets.length > 1, tip: "CSV supports one table. Choose a single report." },
    { key: "excel", label: "Excel", icon: FileSpreadsheet, off: false },
    { key: "pdf", label: "PDF", icon: FileDown, off: false },
  ];

  return (
    <div className="export-group" role="group" aria-label="Download report">
      {formats.map(({ key, label, icon: Icon, off, tip }) => (
        <button
          key={key}
          type="button"
          className="export-button"
          disabled={disabled || empty || off || Boolean(busy)}
          title={off ? tip : `Download as ${label}`}
          onClick={() => run(key)}
        >
          {busy === key ? <Loader2 size={16} className="spinner-inline" /> : <Icon size={16} />}
          {label}
        </button>
      ))}
    </div>
  );
}
