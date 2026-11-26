import { useMemo, useState } from 'react';
import { useAdminStores, useAdminUsers, useAssignStore, useCreateUser } from '../../hooks/queries';
import { validateNewUser } from '../../utils/validators';
import { ROLE_LABELS } from '../../utils/format';
import PageHeader from '../../components/ui/PageHeader';
import { ErrorMessage, QueryState } from '../../components/ui/Feedback';
import { SelectField, TextField } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const ROLE_FILTERS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'user', label: 'Clients' },
  { value: 'manager', label: 'Managers' },
  { value: 'admin', label: 'Administrateurs' },
];

function ManagerForm({ stores, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', storeId: '' });
  const [errors, setErrors] = useState({});
  const create = useCreateUser();

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateNewUser(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    create.mutate(
      { name: form.name.trim(), email: form.email.trim(), password: form.password, role: 'manager', ...(form.storeId ? { storeId: form.storeId } : {}) },
      { onSuccess: onClose }
    );
  };
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField label="Nom complet" value={form.name} onChange={set('name')} error={errors.name} />
      <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
      <TextField label="Mot de passe provisoire" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
      <SelectField
        label="Magasin"
        placeholder="Aucun pour l’instant"
        options={stores.filter((s) => s.active).map((s) => ({ value: s._id, label: s.name }))}
        value={form.storeId}
        onChange={set('storeId')}
      />
      <ErrorMessage error={create.error} />
      <div className="actions">
        <Button type="submit" loading={create.isPending}>
          Créer le manager
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function AssignStore({ manager, stores }) {
  const [storeId, setStoreId] = useState(manager.storeId || '');
  const assign = useAssignStore();
  return (
    <div className="assign">
      <select aria-label={`Magasin de ${manager.name}`} value={storeId} onChange={(e) => { assign.reset(); setStoreId(e.target.value); }}>
        <option value="">Choisir…</option>
        {stores.filter((s) => s.active).map((s) => (
          <option key={s._id} value={s._id}>
            {s.name}
          </option>
        ))}
      </select>
      <Button variant="ghost" disabled={!storeId || storeId === manager.storeId} loading={assign.isPending} onClick={() => assign.mutate({ userId: manager.id, storeId })} aria-label={`Affecter ${manager.name}`}>
        Affecter
      </Button>
      <ErrorMessage error={assign.error} />
    </div>
  );
}

export default function AdminUsersPage() {
  const [role, setRole] = useState('');
  const [creating, setCreating] = useState(false);
  const query = useAdminUsers(role);
  const stores = useAdminStores();
  const users = query.data || [];
  const storeList = useMemo(() => stores.data || [], [stores.data]);

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Clients, managers et administrateurs." actions={<Button onClick={() => setCreating(true)}>Nouveau manager</Button>} />
      <div className="toolbar">
        <SelectField label="Filtrer par rôle" options={ROLE_FILTERS} value={role} onChange={(e) => setRole(e.target.value)} />
      </div>
      <QueryState query={query} empty={users.length === 0} emptyMessage="Aucun utilisateur pour ce filtre.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Magasin</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{ROLE_LABELS[u.role]}</td>
                  <td>{u.role === 'manager' ? <AssignStore key={`${u.id}-${u.storeId}`} manager={u} stores={storeList} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
      {creating && (
        <Modal title="Nouveau manager" onClose={() => setCreating(false)}>
          <ManagerForm stores={storeList} onClose={() => setCreating(false)} />
        </Modal>
      )}
    </>
  );
}
