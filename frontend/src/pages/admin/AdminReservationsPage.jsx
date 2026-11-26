import { useMemo, useState } from 'react';
import { useAdminReservations, useAdminStores } from '../../hooks/queries';
import PageHeader from '../../components/ui/PageHeader';
import { QueryState } from '../../components/ui/Feedback';
import { SelectField } from '../../components/ui/Field';
import ReservationsTable from '../../components/ReservationsTable';

const STATUS_FILTERS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'returned', label: 'Rendues' },
  { value: 'cancelled', label: 'Annulées' },
];

export default function AdminReservationsPage() {
  const [status, setStatus] = useState('');
  const [storeId, setStoreId] = useState('');
  // Same object identity while the filters do not change: stable query key.
  const filters = useMemo(() => ({ ...(status && { status }), ...(storeId && { storeId }) }), [status, storeId]);
  const query = useAdminReservations(filters);
  const stores = useAdminStores();
  const items = query.data || [];

  return (
    <>
      <PageHeader title="Toutes les réservations" subtitle="Supervision de l’ensemble des magasins." />
      <div className="toolbar">
        <SelectField label="Statut" options={STATUS_FILTERS} value={status} onChange={(e) => setStatus(e.target.value)} />
        <SelectField
          label="Magasin"
          placeholder="Tous les magasins"
          options={(stores.data || []).map((s) => ({ value: s._id, label: s.name }))}
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        />
      </div>
      <QueryState query={query} empty={items.length === 0} emptyMessage="Aucune réservation pour ces filtres.">
        <ReservationsTable reservations={items} showStore />
      </QueryState>
    </>
  );
}
