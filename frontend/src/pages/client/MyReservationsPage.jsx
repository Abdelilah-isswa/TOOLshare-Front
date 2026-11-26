import { useState } from 'react';
import { useCancelReservation, useEquipmentIndex, useMyReservations } from '../../hooks/queries';
import { formatDateTime, formatDuration } from '../../utils/format';
import PageHeader from '../../components/ui/PageHeader';
import { ErrorMessage, QueryState } from '../../components/ui/Feedback';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const TABS = [
  { kind: 'reservations', label: 'À venir' },
  { kind: 'loans', label: 'En cours' },
  { kind: 'history', label: 'Historique' },
];

export default function MyReservationsPage() {
  const [kind, setKind] = useState('reservations');
  const [confirming, setConfirming] = useState(null);
  const query = useMyReservations(kind); // only the visible tab is fetched
  const equipmentIndex = useEquipmentIndex();
  const cancel = useCancelReservation();
  const items = query.data || [];

  const doCancel = (id) =>
    cancel.mutate(id, { onSettled: () => setConfirming(null) });

  return (
    <>
      <PageHeader title="Mes réservations" />
      <div className="tabs" role="group" aria-label="Type de réservations">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            className={`tab${kind === tab.kind ? ' tab-active' : ''}`}
            aria-pressed={kind === tab.kind}
            onClick={() => {
              cancel.reset();
              setKind(tab.kind);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ErrorMessage error={cancel.error} />

      <QueryState query={query} empty={items.length === 0} emptyMessage="Rien à afficher ici pour le moment.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Matériel</th>
                <th>Début</th>
                <th>Durée</th>
                <th>Statut</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const info = equipmentIndex.get(String(r.equipment));
                return (
                  <tr key={r._id}>
                    <td>{r.reference}</td>
                    <td>{info ? `${info.name} (${info.storeName})` : 'Matériel retiré'}</td>
                    <td>{formatDateTime(r.startDate)}</td>
                    <td>{formatDuration(r.durationHours)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="row-actions">
                      {r.status === 'confirmed' &&
                        (confirming === r._id ? (
                          <>
                            <Button variant="danger" loading={cancel.isPending} onClick={() => doCancel(r._id)}>
                              Confirmer l’annulation
                            </Button>
                            <Button variant="ghost" onClick={() => setConfirming(null)}>
                              Non
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" onClick={() => setConfirming(r._id)} aria-label={`Annuler la réservation ${r.reference}`}>
                            Annuler
                          </Button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </QueryState>
    </>
  );
}
