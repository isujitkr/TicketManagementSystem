import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import { FullPageLoader } from './Feedback';

/**
 * NOTE: these guards only shape the UI. Real protection lives on the server, which
 * re-validates the cookie and the role on every API request.
 */

// Requires a logged-in user; renders the app shell (navbar + page container).
export function ProtectedRoute() {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!user && !initialized) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

// Requires one of the given roles, otherwise bounce to the role's home page.
export function RoleRoute({ roles }) {
  const user = useSelector((s) => s.auth.user);
  return roles.includes(user?.role) ? <Outlet /> : <Navigate to="/" replace />;
}

// Login / register pages: signed-in users are redirected away.
export function GuestRoute({ children }) {
  const user = useSelector((s) => s.auth.user);
  const location = useLocation();
  if (user) return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  return children;
}
