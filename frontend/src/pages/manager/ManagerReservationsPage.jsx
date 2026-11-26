import { useState } from 'react';
import { useHandover, useManagerReservations, useReturnItem } from '../../hooks/queries';
import PageHeader from '../../components/ui/PageHeader';
import { ErrorMessage, QueryState } from '../../components/ui/Feedback';
import { SelectField } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import ReservationsTable from '../../components/ReservationsTable';

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'confirmed', label: 'À remettre' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'returned', label: 'Rendues' },
  { value: 'cancelled', label: 'Annulées' },
];

export default function ManagerReservationsPage() {
  const [status, setStatus] = useState('');
  const query = useManagerReservations(status);
  const handover = useHandover();
  const returnItem = useReturnItem();
  const items = query.data || [];
  const busyId = handover.isPending ? handover.variables : returnItem.isPending ? returnItem.variables : null;

  const clearErrors = () => {
    handover.reset();
    returnItem.reset();
  };

  const actions = (r) => {
    if (r.status === 'confirmed') {
      return (
        <Button loading={busyId === r._id} onClick={() => { clearErrors(); handover.mutate(r._id); }} aria-label={`Enregistrer la remise de ${r.reference}`}>
          Remise
        </Button>
      );
    }
    if (r.status === 'in_progress') {
      return (
        <Button loading={busyId === r._id} onClick={() => { clearErrors(); returnItem.mutate(r._id); }} aria-label={`Enregistrer le retour de ${r.reference}`}>
          Retour
        </Button>
      );
    }
    return null;
  };

  return (
    <>
      <PageHeader title="Réservations du magasin" subtitle="Enregistrez la remise du matériel au client, puis son retour." />
      <div className="toolbar">
        <SelectField label="Filtrer par statut" options={FILTERS} value={status} onChange={(e) => { clearErrors(); setStatus(e.target.value); }} />
      </div>
      <ErrorMessage error={handover.error || returnItem.error} />
      <QueryState query={query} empty={items.length === 0} emptyMessage="Aucune réservation pour ce filtre.">
        <ReservationsTable reservations={items} renderActions={actions} />
      </QueryState>
    </>
  );
}
