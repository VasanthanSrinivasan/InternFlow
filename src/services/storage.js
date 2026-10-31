// Only the login SESSION lives in localStorage now.
// All real data (users, openings, ...) lives in data/db.json behind json-server.

const PREFIX = "internflow:";

export function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    return false;
  }
}

export function removeData(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
