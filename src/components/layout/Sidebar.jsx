import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  BriefcaseBusiness,
  ClipboardList,
  Users,
  CalendarCheck,
  Star,
  BookOpen,
  GraduationCap,
  PanelLeftClose,
  UserCircle,
  LogOut,
  ListChecks,
  UserCheck,
  FileCheck2,
  Inbox,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../../context/useAuth";
import { initials, roleLabel } from "../../utils/format";

export default function Sidebar({ open, onNavigate }) {
  const { user, isAdmin, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  const groups = [
    {
      title: "WORKSPACE",
      items: [
        { label: "Home", path: "/home", icon: Home },
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Internship Openings", path: "/openings", icon: BriefcaseBusiness },
        { label: isStaff ? "Applications" : "My Applications", path: "/applications", icon: ClipboardList },
        { label: "Mentors", path: "/mentors", icon: Users },
        { label: "Attendance", path: "/attendance", icon: CalendarCheck },
        { label: isStaff ? "Evaluations" : "My Evaluations", path: "/evaluations", icon: Star },
      ],
    },
    {
      title: "LEARNING",
      items: [
        { label: "Course Library", path: "/learning/courses", icon: BookOpen },
        ...(isStaff
          ? []
          : [
              { label: "My Learning", path: "/learning/my-learning", icon: GraduationCap },
              { label: "My Tasks", path: "/learning/tasks", icon: ListChecks },
            ]),
      ],
    },
    // Only admin + trainer see this whole group
    ...(isStaff
      ? [
          {
            title: "TRAINER & ADMIN",
            items: [
              { label: "Course Studio", path: "/learning/studio", icon: PanelLeftClose },
              { label: "Enrollments", path: "/staff/enrollments", icon: UserCheck },
              { label: "Assessments", path: "/staff/assessments", icon: FileCheck2 },
              { label: "Submissions", path: "/staff/submissions", icon: Inbox },
              { label: "Reports", path: "/staff/reports", icon: BarChart3 },
              ...(isAdmin ? [{ label: "Users", path: "/staff/users", icon: ShieldCheck }] : []),
            ],
          },
        ]
      : []),
    {
      title: "ACCOUNT",
      items: [{ label: "My Profile", path: "/profile", icon: UserCircle }],
    },
  ];

  function handleLogout() {
    onNavigate?.();
    logout();
    toast.success("You have been logged out.");
    navigate("/login", { replace: true });
  }

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <NavLink to="/home" className="brand" onClick={onNavigate}>
        <div className="brand-mark">
          <GraduationCap size={24} />
        </div>
        <div>
          <strong>InternFlow</strong>
          <span>CAREER & LEARNING</span>
        </div>
      </NavLink>

      <NavLink to="/profile" className="sidebar-profile" onClick={onNavigate}>
        <div className="profile-avatar">{initials(user?.name)}</div>
        <div>
          <strong>{user?.name}</strong>
          <span>{roleLabel(user?.role)}</span>
        </div>
      </NavLink>

      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div className="nav-group" key={group.title}>
            <span className="nav-group-title">{group.title}</span>

            {group.items.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onNavigate}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={18} strokeWidth={1.8} />
        <span>Logout</span>
      </button>

      <div className="sidebar-footer">
        <span className="online-indicator" />
        <div>
          <strong>Signed in</strong>
          <span>{user?.email}</span>
        </div>
      </div>
    </aside>
  );
}
