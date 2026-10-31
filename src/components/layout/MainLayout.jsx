import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// Cards that get the soft "spotlight" that follows the mouse (see theme.css)
const SPOTLIGHT = ".panel, .kpi-card, .stat-card, .course-card, .mentor-card, .report-card, .task-card, .evaluation-card";

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer with the Escape key.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // Mouse spotlight: writes --mx / --my on the card under the pointer.
  useEffect(() => {
    let frame = 0;

    const onMove = (event) => {
      if (event.pointerType === "touch") return;
      const card = event.target.closest?.(SPOTLIGHT);
      if (!card) return;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - box.left}px`);
        card.style.setProperty("--my", `${event.clientY - box.top}px`);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="app-container">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        {/* key = pathname, so the entrance animation replays on every page change */}
        <div className="route-view" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
