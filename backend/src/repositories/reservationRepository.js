const Reservation = require('../models/Reservation');
const AppError = require('../utils/AppError');

module.exports = {
  findById: (id) => Reservation.findById(id),
  findByReference: (reference) => Reservation.findOne({ reference }),

  // Ownership is enforced here: the query is always scoped to the given user.
  findByUser: (userId, filter = {}, sort = { startDate: 1 }) =>
    Reservation.find({ ...filter, user: userId }).sort(sort),

  // Fast-path overlap check (the unique partial index is the real guarantee).
  findOverlapping: (equipmentId, startDate, endDate) =>
    Reservation.find({
      equipment: equipmentId,
      status: { $in: ['confirmed', 'in_progress'] },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    }),

  async create(data) {
    try {
      return await Reservation.create(data);
    } catch (err) {
      if (err && err.code === 11000) {
        // Two different unique indexes can fail: reference (rare) or the slot index.
        if (err.keyPattern && err.keyPattern.reference) {
          const collision = new Error('reference collision');
          collision.referenceCollision = true;
          throw collision;
        }
        throw new AppError(409, 'the requested time slot is no longer available', 'SLOT_TAKEN');
      }
      throw err;
    }
  },

  // Atomic cancel: only succeeds if the reservation is still confirmed, still
  // owned by the user and has not started. Leaving 'confirmed' frees its slots
  // because the unique index only covers confirmed / in_progress.
  cancelIfConfirmed: (id, userId, now) =>
    Reservation.findOneAndUpdate(
      { _id: id, user: userId, status: 'confirmed', startDate: { $gt: now } },
      { status: 'cancelled' },
      { new: true }
    ),

  save(reservation) {
    return reservation.save();
  },
};

// --- Added for the Sprint 3 frontend (manager / admin views, handover, return) ---
const populateDetails = (query) => query.populate('user', 'name email').populate('equipment', 'name').populate('store', 'name');

module.exports.findDetailed = (filter = {}) =>
  populateDetails(Reservation.find(filter).sort({ startDate: -1 }));

module.exports.countActiveByEquipment = (equipmentId) =>
  Reservation.countDocuments({ equipment: equipmentId, status: { $in: ['confirmed', 'in_progress'] } });

// Atomic status change, scoped to the store of the manager.
module.exports.transition = (id, storeId, from, to) =>
  populateDetails(
    Reservation.findOneAndUpdate({ _id: id, store: storeId, status: from }, { status: to }, { new: true })
  );
