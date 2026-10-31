// Small helpers shared by many pages.

export function initials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

// 7 -> "INT-007"
export function formatCode(prefix, id) {
  return `${prefix}-${String(id).padStart(3, "0")}`;
}

// Local date as YYYY-MM-DD (toISOString() would use UTC and shift the day in India late at night).
export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// For ids stored INSIDE a document (modules / lessons). json-server makes the top-level ids itself.
export function createId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function statusClass(status = "") {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

export const ROLE_LABELS = { admin: "Administrator", trainer: "Trainer", student: "Student" };

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? "Student";
}
