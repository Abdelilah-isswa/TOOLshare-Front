const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export const formatDateTime = (value) => (value ? dateTime.format(new Date(value)) : '');

export const formatDuration = (hours) => {
  const whole = Math.floor(hours);
  const half = hours % 1 ? '30' : '';
  if (!whole) return `${half} min`;
  return half ? `${whole} h ${half}` : `${whole} h`;
};

export const STATUS_LABELS = {
  confirmed: 'Confirmée',
  in_progress: 'En cours',
  returned: 'Rendue',
  cancelled: 'Annulée',
  available: 'Disponible',
  unavailable: 'Indisponible',
  retired: 'Retiré',
};

export const ROLE_LABELS = { user: 'Client', manager: 'Manager', admin: 'Administrateur' };

export const ROLE_HOME = { user: '/client/stores', manager: '/manager', admin: '/admin/stores' };
