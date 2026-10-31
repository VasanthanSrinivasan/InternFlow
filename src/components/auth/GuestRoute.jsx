import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../context/useAuth";
import PageState from "../common/PageState";

// Login / Register pages: logged-in users are sent to the page they wanted (or Home).
export default function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageState fullPage loading />;
  if (user) return <Navigate to={location.state?.from ?? "/home"} replace />;

  return <Outlet />;
}
