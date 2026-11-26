import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/format';
import Button from '../components/ui/Button';

const NAV = {
  user: [
    { to: '/client/stores', label: 'Magasins' },
    { to: '/client/reservations', label: 'Mes réservations' },
  ],
  manager: [
    { to: '/manager', label: 'Tableau de bord', end: true },
    { to: '/manager/equipment', label: 'Matériel' },
    { to: '/manager/reservations', label: 'Réservations' },
  ],
  admin: [
    { to: '/admin/stores', label: 'Magasins' },
    { to: '/admin/users', label: 'Utilisateurs' },
    { to: '/admin/reservations', label: 'Réservations' },
  ],
};

// Layout shared by the three spaces: only the navigation changes with the role.
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <header className="topbar">
        <span className="brand">ToolShare</span>
        <nav aria-label="Navigation principale">
          {(NAV[user.role] || []).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          <span>
            {user.name} <small>{ROLE_LABELS[user.role]}</small>
          </span>
          <Button variant="ghost" onClick={handleLogout}>
            Déconnexion
          </Button>
        </div>
      </header>
      <main id="main" className="content">
        <Outlet />
      </main>
    </div>
  );
}
