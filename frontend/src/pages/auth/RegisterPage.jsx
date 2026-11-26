import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateRegister } from '../../utils/validators';
import { ROLE_HOME } from '../../utils/format';
import { TextField } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateRegister(form);
    setErrors(found);
    setApiError(null);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      const user = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (error) {
      setApiError(error);
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1>Créer un compte</h1>
      <form onSubmit={handleSubmit} noValidate>
        <TextField label="Nom complet" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          hint="Au moins 8 caractères."
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <TextField
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <ErrorMessage error={apiError} />
        <Button type="submit" loading={submitting}>
          Créer mon compte
        </Button>
      </form>
      <p className="muted">
        Déjà inscrit ? <Link to="/login">Se connecter</Link>
      </p>
    </>
  );
}
