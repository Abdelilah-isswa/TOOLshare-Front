import { formatDateTime, formatDuration } from '../utils/format';
import StatusBadge from './ui/StatusBadge';

// Shared by the Manager and Admin spaces. `renderActions(reservation)` adds the row buttons.
export default function ReservationsTable({ reservations, showStore = false, renderActions }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Client</th>
            <th>Matériel</th>
            {showStore && <th>Magasin</th>}
            <th>Début</th>
            <th>Durée</th>
            <th>Statut</th>
            {renderActions && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r._id}>
              <td>{r.reference}</td>
              <td>
                {r.user?.name || '—'}
                <small className="block muted">{r.user?.email}</small>
              </td>
              <td>{r.equipment?.name || '—'}</td>
              {showStore && <td>{r.store?.name || '—'}</td>}
              <td>{formatDateTime(r.startDate)}</td>
              <td>{formatDuration(r.durationHours)}</td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              {renderActions && <td className="row-actions">{renderActions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
