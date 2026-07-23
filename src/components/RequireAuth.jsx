import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// Route guard. While AuthContext is checking the session, render a small
// placeholder so we don't flash the login page for signed-in users on reload.
// If unauthenticated, redirect to /login and remember where they were headed
// so LoginPage can bounce them back after signing in.
export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink-soft">
        Checking your session…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
