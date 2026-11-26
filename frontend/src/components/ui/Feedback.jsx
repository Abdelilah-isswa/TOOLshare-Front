import { errorMessage } from '../../utils/errors';
import Button from './Button';

export function Loader({ label = 'Chargement…' }) {
  return (
    <div className="loader" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert">
      <p>{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

export function Notice({ children, tone = 'info' }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === 'success' ? 'status' : 'note'}>
      {children}
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="empty">{children}</p>;
}

// Shows loader / error / empty state, then the content: the same pattern for every React Query screen.
export function QueryState({ query, empty, emptyMessage = 'Aucun résultat.', children }) {
  if (query.isPending) return <Loader />;
  if (query.isError) return <ErrorMessage error={query.error} onRetry={() => query.refetch()} />;
  if (empty) return <EmptyState>{emptyMessage}</EmptyState>;
  return children;
}
