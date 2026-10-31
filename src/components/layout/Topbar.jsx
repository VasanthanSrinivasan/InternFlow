import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Menu, X, ChevronDown, UserCircle, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../../context/useAuth";
import { initials, roleLabel } from "../../utils/format";


const titles = {
  "/home": "Home",
  "/dashboard": "Dashboard",
  "/openings": "Internship Openings",
  "/applications": "Applications",
  "/mentors": "Mentors",
  "/attendance": "Attendance",
  "/evaluations": "Evaluations",
  "/learning/courses": "Course Library",
  "/learning/my-learning": "My Learning",
  "/learning/studio": "Course Studio",
  "/learning/tasks": "My Tasks",
  "/staff/enrollments": "Enrollments",
  "/staff/assessments": "Assessments",
  "/staff/submissions": "Submissions",
  "/staff/reports": "Reports",
  "/staff/users": "Users",
  "/profile": "My Profile",
};

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const title =
    titles[location.pathname] ??
    (location.pathname.startsWith("/learning/courses/") ? "Recorded Classes" : "InternFlow");

  // Close the user dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (!menuOpen) return;

    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  function handleSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/openings?q=${encodeURIComponent(query)}` : "/openings");
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
    toast.success("You have been logged out.");
    navigate("/login", { replace: true });
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={21} />
        </button>

        <div>
          <div className="topbar-breadcrumb">
            InternFlow <span>/</span> {title}
          </div>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <form className="topbar-search" onSubmit={handleSearch} role="search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search internships..."
            aria-label="Search internships"
          />
          {search && (
            <button type="button" className="icon-button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </form>

        <Link
          to="/applications"
          className="icon-button notification-button"
          aria-label="Applications"
          title="Applications"
        >
          <Bell size={19} />
        </Link>

        <div className="topbar-user-wrap" ref={menuRef}>
          <button
            className="topbar-user"
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="profile-avatar">{initials(user?.name)}</div>
            <div className="topbar-user-text">
              <strong>{user?.name}</strong>
              <span>{roleLabel(user?.role)}</span>
            </div>
            <ChevronDown size={15} />
          </button>

          {menuOpen && (
            <div className="user-dropdown" role="menu">
              <div className="user-dropdown-head">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <Link to="/profile" role="menuitem" onClick={() => setMenuOpen(false)}>
                <UserCircle size={16} /> My Profile
              </Link>
              <button type="button" role="menuitem" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
