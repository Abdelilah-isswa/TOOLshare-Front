import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../utils/format';

export function ForbiddenPage() {
  const { user } = useAuth();
  return (
    <main className="status-page" id="main">
      <p className="status-code">403</p>
      <h1>Accès refusé</h1>
      <p>Vous n’avez pas les droits pour consulter cette page.</p>
      <Link className="btn btn-primary" to={user ? ROLE_HOME[user.role] || '/' : '/login'}>
        Retour à mon espace
      </Link>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="status-page" id="main">
      <p className="status-code">404</p>
      <h1>Page introuvable</h1>
      <p>Cette adresse n’existe pas.</p>
      <Link className="btn btn-primary" to="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
