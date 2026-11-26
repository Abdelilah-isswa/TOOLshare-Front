import { Link } from 'react-router-dom';
import { useCatalog } from '../../hooks/queries';
import PageHeader from '../../components/ui/PageHeader';
import { QueryState } from '../../components/ui/Feedback';

export default function StoresPage() {
  const query = useCatalog();
  const stores = query.data || [];
  return (
    <>
      <PageHeader title="Nos magasins" subtitle="Choisissez un magasin pour consulter son matériel et réserver." />
      <QueryState query={query} empty={stores.length === 0} emptyMessage="Aucun magasin ouvert pour le moment.">
        <ul className="card-grid">
          {stores.map((store) => {
            const available = (store.equipment || []).filter((e) => e.status === 'available').length;
            return (
              <li key={store._id} className="card">
                <h2>{store.name}</h2>
                <p className="muted">{store.address}</p>
                <p>
                  {available} matériel{available > 1 ? 's' : ''} disponible{available > 1 ? 's' : ''}
                </p>
                <Link className="btn btn-primary" to={`/client/stores/${store._id}`}>
                  Voir le matériel
                </Link>
              </li>
            );
          })}
        </ul>
      </QueryState>
    </>
  );
}
