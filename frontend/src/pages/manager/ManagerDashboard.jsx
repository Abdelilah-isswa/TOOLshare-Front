import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCatalog, useManagerEquipment, useManagerReservations } from '../../hooks/queries';
import PageHeader from '../../components/ui/PageHeader';
import { ErrorMessage, Loader } from '../../components/ui/Feedback';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const reservations = useManagerReservations();
  const equipment = useManagerEquipment();
  const catalog = useCatalog();

  const counts = useMemo(() => {
    const result = { confirmed: 0, in_progress: 0 };
    (reservations.data || []).forEach((r) => {
      if (r.status in result) result[r.status] += 1;
    });
    return result;
  }, [reservations.data]);

  const storeName = (catalog.data || []).find((s) => String(s._id) === String(user.storeId))?.name;
  const error = reservations.error || equipment.error;

  return (
    <>
      <PageHeader title={storeName ? `Magasin ${storeName}` : 'Mon magasin'} subtitle="Vue d’ensemble de votre activité." />
      {error && <ErrorMessage error={error} />}
      {(reservations.isPending || equipment.isPending) && !error && <Loader />}
      {reservations.data && equipment.data && (
        <ul className="card-grid">
          <li className="card stat">
            <p className="stat-value">{counts.confirmed}</p>
            <p>à remettre</p>
            <Link to="/manager/reservations">Gérer les remises</Link>
          </li>
          <li className="card stat">
            <p className="stat-value">{counts.in_progress}</p>
            <p>en cours de prêt</p>
            <Link to="/manager/reservations">Enregistrer un retour</Link>
          </li>
          <li className="card stat">
            <p className="stat-value">{equipment.data.length}</p>
            <p>matériels au catalogue</p>
            <Link to="/manager/equipment">Gérer le matériel</Link>
          </li>
        </ul>
      )}
    </>
  );
}
