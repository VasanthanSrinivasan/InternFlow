import { useEffect, useState } from "react";
import api from "../api/client";
import { hashPassword } from "../utils/hash";
import { loadData, saveData, removeData } from "../services/storage";
import AuthContext from "./authContext";

const SESSION_KEY = "session";

// Never keep the password hash in React state.
function toSafeUser(record) {
  const safe = { ...record };
  delete safe.password;
  return safe;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only "loading" if there is a saved session we still need to verify.
  const [loading, setLoading] = useState(() => loadData(SESSION_KEY, null) !== null);

  // Restore the logged-in user after a page refresh.
  useEffect(() => {
    const savedId = loadData(SESSION_KEY, null);
    if (savedId === null) return;

    const restoreSession = async () => {
      try {
        const response = await api.get(`/users/${savedId}`);
        setUser(toSafeUser(response.data));
      } catch (err) {
        // 404 = that user was deleted. Network error = keep session, user can retry.
        if (err.response?.status === 404) removeData(SESSION_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const response = await api.get("/users", { params: { email: cleanEmail } });
    const found = response.data[0];

    if (!found || found.password !== hashPassword(cleanEmail, password)) {
      throw new Error("Invalid email or password.");
    }

    saveData(SESSION_KEY, found.id);
    setUser(toSafeUser(found));
    return toSafeUser(found);
  };

  const register = async ({ name, email, phone, college, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    const existing = await api.get("/users", { params: { email: cleanEmail } });
    if (existing.data.length > 0) {
      throw new Error("An account with this email already exists.");
    }

    const response = await api.post("/users", {
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(cleanEmail, password),
      role: "student", // public sign-up is always a student
      phone: phone.trim(),
      college: college.trim(),
      createdAt: new Date().toISOString(),
    });

    saveData(SESSION_KEY, response.data.id);
    setUser(toSafeUser(response.data));
    return toSafeUser(response.data);
  };

  const updateProfile = async (changes) => {
    const body = { ...changes };

    if (body.newPassword) {
      body.password = hashPassword(user.email, body.newPassword);
    }
    delete body.newPassword;

    const response = await api.patch(`/users/${user.id}`, body);
    setUser(toSafeUser(response.data));
    return toSafeUser(response.data);
  };

  const logout = () => {
    removeData(SESSION_KEY);
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAdmin: user?.role === "admin",
    isTrainer: user?.role === "trainer",
    // staff = admin or trainer (both can manage courses, enrollments, submissions, reports)
    isStaff: user?.role === "admin" || user?.role === "trainer",
    login,
    register,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
