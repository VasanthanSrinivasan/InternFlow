import axios from "axios";

// json-server runs on port 3500  ->  npm run server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3500",
  timeout: 8000,
});

// One place to turn any error into a message the user can understand.
export function getErrorMessage(err) {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      return `Server error ${err.response.status}: ${err.response.statusText || "request failed"}`;
    }
    return "Cannot reach the API server. Start it with: npm run server (port 3500).";
  }
  return err?.message || "Something went wrong.";
}

// DELETE /resource/id and also delete the rows that point to it (json-server _dependent).
// Example: deleteWithDependents("courses", 3, ["enrollments", "progress"])
export function deleteWithDependents(resource, id, dependents = []) {
  const query = new URLSearchParams();
  dependents.forEach((name) => query.append("_dependent", name));
  const queryString = query.toString();
  return api.delete(`/${resource}/${id}${queryString ? `?${queryString}` : ""}`);
}

export default api;
