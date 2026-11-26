const Equipment = require('../models/Equipment');

module.exports = {
  findById: (id) => Equipment.findById(id),
  findByIdAndStore: (id, storeId) => Equipment.findOne({ _id: id, store: storeId }),
  findActiveByStore: (storeId) => Equipment.find({ store: storeId, status: { $ne: 'retired' } }).sort({ name: 1 }),
};

// --- Added for the Sprint 3 frontend (manager equipment management) ---
module.exports.findByStore = (storeId) =>
  Equipment.find({ store: storeId, status: { $ne: 'retired' } }).sort({ name: 1 });
module.exports.create = (data) => Equipment.create(data);
module.exports.update = (id, changes) =>
  Equipment.findByIdAndUpdate(id, changes, { new: true, runValidators: true });
