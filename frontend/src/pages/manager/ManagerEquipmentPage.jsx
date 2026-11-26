import { useState } from 'react';
import { useCreateEquipment, useManagerEquipment, useRetireEquipment, useUpdateEquipment } from '../../hooks/queries';
import { validateEquipment } from '../../utils/validators';
import PageHeader from '../../components/ui/PageHeader';
import { ErrorMessage, QueryState } from '../../components/ui/Feedback';
import { SelectField, TextField } from '../../components/ui/Field';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible' },
  { value: 'unavailable', label: 'Indisponible' },
];

function EquipmentForm({ item, onClose }) {
  const [form, setForm] = useState({ name: item?.name || '', status: item?.status || 'available' });
  const [errors, setErrors] = useState({});
  const create = useCreateEquipment();
  const update = useUpdateEquipment();
  const mutation = item ? update : create;

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateEquipment(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const payload = { name: form.name.trim(), status: form.status };
    mutation.mutate(item ? { id: item._id, ...payload } : payload, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField label="Nom du matériel" value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <SelectField label="Statut" options={STATUS_OPTIONS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
      <ErrorMessage error={mutation.error} />
      <div className="actions">
        <Button type="submit" loading={mutation.isPending}>
          {item ? 'Enregistrer' : 'Ajouter'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

export default function ManagerEquipmentPage() {
  const query = useManagerEquipment();
  const retire = useRetireEquipment();
  const [editing, setEditing] = useState(null); // null = closed, {} = new, item = edit
  const [confirming, setConfirming] = useState(null);
  const items = query.data || [];

  return (
    <>
      <PageHeader title="Matériel du magasin" actions={<Button onClick={() => setEditing({})}>Ajouter du matériel</Button>} />
      <ErrorMessage error={retire.error} />
      <QueryState query={query} empty={items.length === 0} emptyMessage="Aucun matériel pour le moment.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Statut</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="row-actions">
                    <Button variant="ghost" onClick={() => setEditing(item)} aria-label={`Modifier ${item.name}`}>
                      Modifier
                    </Button>
                    {confirming === item._id ? (
                      <>
                        <Button
                          variant="danger"
                          loading={retire.isPending}
                          onClick={() => retire.mutate(item._id, { onSettled: () => setConfirming(null) })}
                        >
                          Confirmer le retrait
                        </Button>
                        <Button variant="ghost" onClick={() => setConfirming(null)}>
                          Non
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" onClick={() => { retire.reset(); setConfirming(item._id); }} aria-label={`Retirer ${item.name}`}>
                        Retirer
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
      {editing && (
        <Modal title={editing._id ? 'Modifier le matériel' : 'Ajouter du matériel'} onClose={() => setEditing(null)}>
          <EquipmentForm item={editing._id ? editing : null} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
