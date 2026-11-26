import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/services';
import { useInstallationStatus } from '../../hooks/queries';
import { validateNewUser } from '../../utils/validators';
import { TextField } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { ErrorMessage, Loader, Notice } from '../../components/ui/Feedback';

// First-run setup: creates the initial administrator (the API only allows it once).
export default function InstallPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const status = useInstallationStatus();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  if (status.isPending) return <Loader />;
  if (status.data?.installed) {
    return (
      <>
        <h1>Installation</h1>
        <Notice>Le système est déjà installé. <Link to="/login">Se connecter</Link></Notice>
      </>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateNewUser(form);
    setErrors(found);
    setApiError(null);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      await authApi.install({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      await queryClient.invalidateQueries({ queryKey: ['installation'] });
      navigate('/login', { replace: true });
    } catch (error) {
      setApiError(error);
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1>Installation</h1>
      <p className="muted">Créez le compte administrateur initial.</p>
      <form onSubmit={handleSubmit} noValidate>
        <TextField label="Nom" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <TextField label="Mot de passe" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
        <ErrorMessage error={apiError} />
        <Button type="submit" loading={submitting}>
          Créer l’administrateur
        </Button>
      </form>
    </>
  );
}
