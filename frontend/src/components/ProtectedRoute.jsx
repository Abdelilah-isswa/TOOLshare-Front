import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../utils/format';

// Private routes: anonymous visitors go to /login and come back to the page they asked for.
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Role routes: a logged-in user in the wrong space is sent to the "forbidden" page.
export function RoleRoute({ roles }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

// Login / register / install are for visitors only.
export function PublicOnlyRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return <Outlet />;
}

export function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? ROLE_HOME[user.role] || '/forbidden' : '/login'} replace />;
}
