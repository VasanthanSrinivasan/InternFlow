import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../context/useAuth";
import { getErrorMessage } from "../api/client";
import "./Login.css";

const demoAccounts = [
  { label: "Admin", email: "admin@internflow.com", password: "Admin@123" },
  { label: "Trainer", email: "ravi@internflow.com", password: "Trainer@123" },
  { label: "Student", email: "arun@example.com", password: "Student@123" },
];

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      // <GuestRoute> now sees the logged-in user and redirects to Home.
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="auth-brand-logo">
          <GraduationCap size={30} />
          <strong>InternFlow</strong>
        </div>
        <h1>Find internships.<br />Learn skills.<br />Grow your career.</h1>
        <p>One portal for openings, applications, attendance, evaluations and recorded classes.</p>
      </aside>

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Log in to continue to your workspace.</p>

          {error && <div className="form-alert" role="alert">{error}</div>}

          <label className="form-field">
            Email address
            <div className="input-with-icon">
              <Mail size={17} />
              <input
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="form-field">
            Password
            <div className="input-with-icon">
              <Lock size={17} />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <button className="primary-button auth-submit" type="submit" disabled={submitting || !form.email || !form.password}>
            <LogIn size={17} /> {submitting ? "Logging in..." : "Log in"}
          </button>

          <p className="auth-switch">
            New to InternFlow? <Link to="/register">Create an account</Link>
          </p>

          <div className="demo-box">
            <span>Demo accounts (click to fill)</span>
            <div>
              {demoAccounts.map((account) => (
                <button
                  type="button"
                  key={account.label}
                  className="secondary-button small-button"
                  onClick={() => setForm({ email: account.email, password: account.password })}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
