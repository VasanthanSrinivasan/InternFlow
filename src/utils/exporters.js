// Download helpers for CSV, Excel (.xlsx) and PDF.
// A "dataset" is:  { name: "Sheet name", columns: ["A", "B"], rows: [[1, 2], [3, 4]] }
// Excel and PDF libraries are loaded only when needed (keeps the first page load fast).

export function stamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// A cell starting with = + - @ would run as a formula when the CSV is opened in Excel.
function safeCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  const text = String(value);
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function sheetName(name, used) {
  let clean = String(name).replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() || "Sheet";
  let n = 2;
  while (used.has(clean.toLowerCase())) {
    clean = `${clean.slice(0, 28)} ${n++}`;
  }
  used.add(clean.toLowerCase());
  return clean;
}

export function datasetToCSV(dataset) {
  const escape = (value) => `"${String(safeCell(value)).replaceAll('"', '""')}"`;
  return [dataset.columns, ...dataset.rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

export function downloadCSV(filename, dataset) {
  const blob = new Blob(["\uFEFF" + datasetToCSV(dataset)], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}-${stamp()}.csv`);
}

export async function buildExcelBlob(datasets) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const used = new Set();

  datasets.forEach((dataset) => {
    const sheet = XLSX.utils.aoa_to_sheet([dataset.columns, ...dataset.rows]);
    // Column widths from the longest value (max 45 characters)
    sheet["!cols"] = dataset.columns.map((column, index) => {
      const longest = dataset.rows.reduce(
        (max, row) => Math.max(max, String(row[index] ?? "").length),
        String(column).length
      );
      return { wch: Math.min(45, longest + 2) };
    });
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName(dataset.name, used));
  });

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function downloadExcel(filename, datasets) {
  triggerDownload(await buildExcelBlob(datasets), `${filename}-${stamp()}.xlsx`);
}

export async function buildPdfBlob(title, datasets, generatedBy = "") {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  datasets.forEach((dataset, index) => {
    if (index > 0) doc.addPage();

    // Header band
    doc.setFillColor(99, 91, 223);
    doc.rect(0, 0, pageWidth, 54, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`InternFlow  |  ${title}`, 32, 33);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${dataset.name}  -  ${dataset.rows.length} record(s)  -  ${new Date().toLocaleString("en-IN")}${generatedBy ? `  -  by ${generatedBy}` : ""}`,
      pageWidth - 32,
      33,
      { align: "right" }
    );

    autoTable(doc, {
      startY: 70,
      head: [dataset.columns],
      body: dataset.rows.map((row) => row.map((value) => (value === null || value === undefined ? "" : String(value)))),
      styles: { fontSize: 7.5, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [43, 39, 90], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 247, 252] },
      margin: { left: 24, right: 24, bottom: 34 },
      didDrawPage: () => {
        const page = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Page ${page}`, pageWidth - 24, doc.internal.pageSize.getHeight() - 14, { align: "right" });
      },
    });
  });

  return doc.output("blob");
}

export async function downloadPDF(filename, title, datasets, generatedBy = "") {
  triggerDownload(await buildPdfBlob(title, datasets, generatedBy), `${filename}-${stamp()}.pdf`);
}
