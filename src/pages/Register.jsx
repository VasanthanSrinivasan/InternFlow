import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../context/useAuth";
import { getErrorMessage } from "../api/client";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  college: "",
  password: "",
  confirm: "",
};

function validate(form) {
  const errors = {};

  if (form.name.trim().length < 3) errors.name = "Enter your full name (min 3 letters).";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.phone && !/^\d{10}$/.test(form.phone.trim())) errors.phone = "Phone number must be 10 digits.";
  if (form.password.length < 6) errors.password = "Password must be at least 6 characters.";
  if (form.confirm !== form.password) errors.confirm = "Passwords do not match.";

  return errors;
}

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((old) => ({ ...old, [field]: value }));
    setErrors((old) => ({ ...old, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);

    try {
      const user = await register(form);
      toast.success(`Account created. Welcome, ${user.name.split(" ")[0]}!`);
      // <GuestRoute> redirects to Home once the user is logged in.
    } catch (err) {
      setServerError(getErrorMessage(err));
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
        <h1>Start your<br />internship journey.</h1>
        <p>Create a free student account to apply for openings, track attendance and learn from recorded classes.</p>
      </aside>

      <main className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h2>Create your account</h2>
          <p className="auth-subtitle">It only takes a minute.</p>

          {serverError && <div className="form-alert" role="alert">{serverError}</div>}

          <label className="form-field">
            Full name
            <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Vasanthan" autoComplete="name" />
            {errors.name && <small className="field-error">{errors.name}</small>}
          </label>

          <label className="form-field">
            Email address
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" autoComplete="email" />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>

          <div className="form-grid">
            <label className="form-field">
              Phone (optional)
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10 digit number" inputMode="numeric" maxLength={10} />
              {errors.phone && <small className="field-error">{errors.phone}</small>}
            </label>

            <label className="form-field">
              College (optional)
              <input value={form.college} onChange={(e) => update("college", e.target.value)} placeholder="Your college" />
            </label>
          </div>

          <div className="form-grid">
            <label className="form-field">
              Password
              <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" />
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>

            <label className="form-field">
              Confirm password
              <input type="password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
              {errors.confirm && <small className="field-error">{errors.confirm}</small>}
            </label>
          </div>

          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            <UserPlus size={17} /> {submitting ? "Creating account..." : "Create account"}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
