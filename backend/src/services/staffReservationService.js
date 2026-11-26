const AppError = require('../utils/AppError');
const reservationRepository = require('../repositories/reservationRepository');

const STATUSES = ['confirmed', 'in_progress', 'returned', 'cancelled'];

function statusFilter(status) {
  if (status === undefined || status === '') return {};
  if (!STATUSES.includes(status)) throw new AppError(400, `status must be one of ${STATUSES.join(', ')}`);
  return { status };
}

function listForStore(user, status) {
  if (!user.storeId) throw new AppError(403, 'forbidden: no store assigned to this manager', 'NO_STORE');
  return reservationRepository.findDetailed({ store: user.storeId, ...statusFilter(status) });
}

function listAll({ status, storeId } = {}) {
  return reservationRepository.findDetailed({ ...statusFilter(status), ...(storeId ? { store: storeId } : {}) });
}

// Handover (remise): confirmed -> in_progress. Return (retour): in_progress -> returned.
async function changeStatus(user, reservationId, from, to, now = new Date()) {
  if (!user.storeId) throw new AppError(403, 'forbidden: no store assigned to this manager', 'NO_STORE');
  const reservation = await reservationRepository.findById(reservationId);
  if (!reservation) throw new AppError(404, 'reservation not found');
  if (String(reservation.store) !== String(user.storeId)) {
    throw new AppError(403, 'forbidden: outside your store scope');
  }
  if (reservation.status !== from) {
    throw new AppError(409, `only ${from} reservations can become ${to}`, 'INVALID_STATUS');
  }
  if (to === 'in_progress' && reservation.endDate <= now) {
    throw new AppError(409, 'this reservation is over, it can no longer be handed over', 'RESERVATION_EXPIRED');
  }
  const updated = await reservationRepository.transition(reservationId, user.storeId, from, to);
  if (!updated) throw new AppError(409, 'reservation status changed in the meantime', 'INVALID_STATUS');
  return updated;
}

module.exports = {
  listForStore,
  listAll,
  handover: (user, id) => changeStatus(user, id, 'confirmed', 'in_progress'),
  returnItem: (user, id) => changeStatus(user, id, 'in_progress', 'returned'),
};
