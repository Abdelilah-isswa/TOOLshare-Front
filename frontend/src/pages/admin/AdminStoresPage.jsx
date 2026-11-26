import { useState } from 'react';
import { useAdminStores, useCreateStore, useDeactivateStore, useUpdateStore } from '../../hooks/queries';
import { validateStore } from '../../utils/validators';
import PageHeader from '../../components/ui/PageHeader';
import { ErrorMessage, QueryState } from '../../components/ui/Feedback';
import { TextField } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

function StoreForm({ store, onClose }) {
  const [form, setForm] = useState({ name: store?.name || '', address: store?.address || '' });
  const [errors, setErrors] = useState({});
  const create = useCreateStore();
  const update = useUpdateStore();
  const mutation = store ? update : create;

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateStore(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const payload = { name: form.name.trim(), address: form.address.trim() };
    mutation.mutate(store ? { id: store._id, ...payload } : payload, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField label="Nom du magasin" value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <TextField label="Adresse" value={form.address} error={errors.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <ErrorMessage error={mutation.error} />
      <div className="actions">
        <Button type="submit" loading={mutation.isPending}>
          {store ? 'Enregistrer' : 'Créer le magasin'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

export default function AdminStoresPage() {
  const query = useAdminStores();
  const deactivate = useDeactivateStore();
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const stores = query.data || [];

  return (
    <>
      <PageHeader title="Magasins" subtitle="Supervision de tous les magasins." actions={<Button onClick={() => setEditing({})}>Nouveau magasin</Button>} />
      <ErrorMessage error={deactivate.error} />
      <QueryState query={query} empty={stores.length === 0} emptyMessage="Aucun magasin. Créez le premier.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Adresse</th>
                <th>État</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store._id}>
                  <td>{store.name}</td>
                  <td>{store.address}</td>
                  <td>
                    <span className={`badge ${store.active ? 'badge-available' : 'badge-retired'}`}>{store.active ? 'Ouvert' : 'Fermé'}</span>
                  </td>
                  <td className="row-actions">
                    <Button variant="ghost" onClick={() => setEditing(store)} aria-label={`Modifier ${store.name}`}>
                      Modifier
                    </Button>
                    {store.active &&
                      (confirming === store._id ? (
                        <>
                          <Button variant="danger" loading={deactivate.isPending} onClick={() => deactivate.mutate(store._id, { onSettled: () => setConfirming(null) })}>
                            Confirmer la fermeture
                          </Button>
                          <Button variant="ghost" onClick={() => setConfirming(null)}>
                            Non
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" onClick={() => { deactivate.reset(); setConfirming(store._id); }} aria-label={`Fermer ${store.name}`}>
                          Fermer
                        </Button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
      {editing && (
        <Modal title={editing._id ? 'Modifier le magasin' : 'Nouveau magasin'} onClose={() => setEditing(null)}>
          <StoreForm store={editing._id ? editing : null} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
