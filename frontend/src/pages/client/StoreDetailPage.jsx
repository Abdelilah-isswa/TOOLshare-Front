import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../../hooks/queries';
import PageHeader from '../../components/ui/PageHeader';
import { QueryState } from '../../components/ui/Feedback';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ReservationForm from '../../components/ReservationForm';

// Parameterized route: /client/stores/:storeId. The filter state lives here (lifted state) so the
// search box and the availability toggle both drive the same list.
export default function StoreDetailPage() {
  const { storeId } = useParams();
  const query = useCatalog();
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selected, setSelected] = useState(null);

  const store = (query.data || []).find((s) => String(s._id) === storeId);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (store?.equipment || []).filter(
      (item) => (!term || item.name.toLowerCase().includes(term)) && (!onlyAvailable || item.status === 'available')
    );
  }, [store, search, onlyAvailable]);

  return (
    <QueryState query={query} empty={!store} emptyMessage="Ce magasin n’existe pas ou est fermé.">
      {store && (
        <>
          <p>
            <Link to="/client/stores">← Tous les magasins</Link>
          </p>
          <PageHeader title={store.name} subtitle={store.address} />

          <div className="toolbar">
            <label className="inline">
              Rechercher
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Perceuse, scie…" />
            </label>
            <label className="inline check">
              <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
              Disponibles seulement
            </label>
          </div>

          {visible.length === 0 ? (
            <p className="empty">Aucun matériel ne correspond à votre recherche.</p>
          ) : (
            <ul className="list">
              {visible.map((item) => (
                <li key={item._id} className="list-row">
                  <span className="grow">{item.name}</span>
                  <StatusBadge status={item.status} />
                  <Button disabled={item.status !== 'available'} onClick={() => setSelected(item)} aria-label={`Réserver ${item.name}`}>
                    Réserver
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <Modal title="Réserver du matériel" onClose={() => setSelected(null)}>
              <ReservationForm store={store} equipment={selected} onClose={() => setSelected(null)} />
            </Modal>
          )}
        </>
      )}
    </QueryState>
  );
}
