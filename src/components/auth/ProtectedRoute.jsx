import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../context/useAuth";
import PageState from "../common/PageState";

// <ProtectedRoute />                        -> any logged-in user
// <ProtectedRoute roles={["admin","trainer"]} /> -> only those roles (others go to the dashboard)
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageState fullPage loading />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
