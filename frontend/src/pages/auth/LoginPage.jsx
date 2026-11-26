import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useInstallationStatus } from '../../hooks/queries';
import { validateLogin } from '../../utils/validators';
import { ROLE_HOME } from '../../utils/format';
import { TextField } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { ErrorMessage, Notice } from '../../components/ui/Feedback';

const SPACE = { user: '/client', manager: '/manager', admin: '/admin' };

export default function LoginPage() {
  const { login, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const installation = useInstallationStatus();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateLogin(form);
    setErrors(found);
    setApiError(null);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      // Go back to the page that triggered the login, but only if this role may see it.
      const from = location.state?.from?.pathname;
      const target = from && from.startsWith(SPACE[user.role]) ? from : ROLE_HOME[user.role];
      navigate(target, { replace: true });
    } catch (error) {
      setApiError(error);
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1>Connexion</h1>
      {notice && <Notice tone="warning">{notice}</Notice>}
      <form onSubmit={handleSubmit} noValidate>
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <ErrorMessage error={apiError} />
        <Button type="submit" loading={submitting}>
          Se connecter
        </Button>
      </form>
      <p className="muted">
        Pas encore de compte ? <Link to="/register">Créer un compte client</Link>
      </p>
      {installation.data?.installed === false && (
        <p className="muted">
          Première utilisation ? <Link to="/install">Installer le système</Link>
        </p>
      )}
    </>
  );
}
