// The API always answers errors as { error: { code, message } }.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function toApiError(error) {
  if (error instanceof ApiError) return error;
  if (error?.response) {
    const { status, data } = error.response;
    return new ApiError(status, data?.error?.code || 'ERROR', data?.error?.message || 'Erreur inattendue');
  }
  if (error?.code === 'ECONNABORTED') return new ApiError(0, 'TIMEOUT', 'Le serveur met trop de temps à répondre.');
  return new ApiError(0, 'NETWORK_ERROR', 'Impossible de joindre le serveur.');
}

// Friendly French messages for the business errors the user can actually act on.
const MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  EMAIL_TAKEN: 'Un compte existe déjà avec cet email.',
  SLOT_TAKEN: 'Ce créneau est déjà réservé. Choisissez une autre date ou une autre heure.',
  EQUIPMENT_UNAVAILABLE: 'Ce matériel n’est pas disponible à la réservation.',
  STORE_INACTIVE: 'Ce magasin est fermé.',
  INVALID_STATUS: 'Cette action n’est plus possible : le statut de la réservation a changé.',
  ALREADY_STARTED: 'Une réservation déjà commencée ne peut plus être annulée.',
  RESERVATION_EXPIRED: 'Cette réservation est terminée : la remise n’est plus possible.',
  HAS_ACTIVE_RESERVATIONS: 'Ce matériel a des réservations en cours ou à venir : il ne peut pas être retiré.',
  ALREADY_INSTALLED: 'Le système est déjà installé.',
  NO_STORE: 'Aucun magasin ne vous est affecté. Contactez un administrateur.',
  NETWORK_ERROR: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
  TIMEOUT: 'Le serveur met trop de temps à répondre.',
};

export function errorMessage(error) {
  if (!error) return '';
  if (MESSAGES[error.code]) return MESSAGES[error.code];
  if (error.status === 401) return 'Votre session a expiré. Reconnectez-vous.';
  if (error.status === 403) return 'Accès refusé : vous n’avez pas les droits nécessaires.';
  if (error.status === 404) return 'Élément introuvable.';
  if (error.status >= 500) return 'Erreur du serveur. Réessayez dans un instant.';
  return error.message || 'Une erreur est survenue.';
}
