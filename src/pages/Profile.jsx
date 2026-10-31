import { useState } from "react";
import { Save, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/client";
import useAuth from "../context/useAuth";
import { hashPassword } from "../utils/hash";
import { formatCode, formatDate, initials, roleLabel } from "../utils/format";


export default function Profile() {
  const { user, isStaff, updateProfile } = useAuth();

  const [profile, setProfile] = useState({
    name: user.name,
    phone: user.phone ?? "",
    college: user.college ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // UPDATE (CRUD) -> PATCH /users/:id
  async function saveProfile(event) {
    event.preventDefault();

    if (profile.name.trim().length < 3) {
      toast.error("Name must be at least 3 letters.");
      return;
    }
    if (profile.phone && !/^\d{10}$/.test(profile.phone.trim())) {
      toast.error("Phone number must be 10 digits.");
      return;
    }

    setSavingProfile(true);

    try {
      await updateProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        college: profile.college.trim(),
      });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError("");

    if (passwords.next.length < 6) return setPasswordError("New password must be at least 6 characters.");
    if (passwords.next !== passwords.confirm) return setPasswordError("New passwords do not match.");

    setSavingPassword(true);

    try {
      // Verify the current password against the stored hash first.
      const response = await api.get(`/users/${user.id}`);
      if (response.data.password !== hashPassword(user.email, passwords.current)) {
        setPasswordError("Current password is incorrect.");
        return;
      }

      await updateProfile({ newPassword: passwords.next });
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Password changed.");
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h2>My Profile</h2>
          <p>View and update your personal details.</p>
        </div>
      </div>

      <div className="profile-layout">
        <section className="panel profile-summary">
          <div className="profile-avatar profile-avatar-lg">{initials(user.name)}</div>
          <h3>{user.name}</h3>
          <span className={`status-badge ${isStaff ? "status-shortlisted" : "status-open"}`}>
            {roleLabel(user.role)}
          </span>

          <ul className="detail-list">
            <li><span>User ID</span><strong>{formatCode("USR", user.id)}</strong></li>
            <li><span>Email</span><strong>{user.email}</strong></li>
            <li><span>Member since</span><strong>{formatDate(user.createdAt)}</strong></li>
          </ul>
        </section>

        <div className="profile-forms">
          <form className="panel" onSubmit={saveProfile}>
            <div className="panel-heading">
              <div>
                <h3>Personal details</h3>
                <p>Your email cannot be changed.</p>
              </div>
            </div>

            <div className="form-grid">
              <label className="form-field">
                Full name
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
              </label>
              <label className="form-field">
                Email
                <input value={user.email} disabled />
              </label>
              <label className="form-field">
                Phone
                <input value={profile.phone} maxLength={10} inputMode="numeric" onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </label>
              <label className="form-field">
                College
                <input value={profile.college} onChange={(e) => setProfile({ ...profile, college: e.target.value })} />
              </label>
            </div>

            <div className="modal-actions">
              <button type="submit" className="primary-button" disabled={savingProfile}>
                <Save size={16} /> {savingProfile ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>

          <form className="panel" onSubmit={changePassword}>
            <div className="panel-heading">
              <div>
                <h3>Change password</h3>
                <p>Use at least 6 characters.</p>
              </div>
            </div>

            {passwordError && <div className="form-alert" role="alert">{passwordError}</div>}

            <div className="form-grid">
              <label className="form-field">
                Current password
                <input type="password" autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
              </label>
              <span />
              <label className="form-field">
                New password
                <input type="password" autoComplete="new-password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required />
              </label>
              <label className="form-field">
                Confirm new password
                <input type="password" autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
              </label>
            </div>

            <div className="modal-actions">
              <button type="submit" className="secondary-button" disabled={savingPassword}>
                <KeyRound size={16} /> {savingPassword ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
