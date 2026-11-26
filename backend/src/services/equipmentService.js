const AppError = require('../utils/AppError');
const equipmentRepository = require('../repositories/equipmentRepository');
const reservationRepository = require('../repositories/reservationRepository');

const STATUSES = ['available', 'unavailable'];

// A manager only ever acts on the store from their JWT, never one sent by the client.
function requireStore(user) {
  if (!user.storeId) throw new AppError(403, 'forbidden: no store assigned to this manager', 'NO_STORE');
  return user.storeId;
}

function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) throw new AppError(400, 'name is required');
  if (name.trim().length > 100) throw new AppError(400, 'name is too long (100 characters max)');
  return name.trim();
}

async function ownEquipment(user, id) {
  const storeId = requireStore(user);
  const equipment = await equipmentRepository.findById(id);
  if (!equipment) throw new AppError(404, 'equipment not found');
  if (String(equipment.store) !== String(storeId)) {
    throw new AppError(403, 'forbidden: outside your store scope');
  }
  return equipment;
}

const list = (user) => equipmentRepository.findByStore(requireStore(user));

async function create(user, { name, status = 'available' } = {}) {
  const storeId = requireStore(user);
  if (!STATUSES.includes(status)) throw new AppError(400, 'status must be available or unavailable');
  return equipmentRepository.create({ name: validateName(name), store: storeId, status });
}

async function update(user, id, { name, status } = {}) {
  await ownEquipment(user, id);
  const changes = {};
  if (name !== undefined) changes.name = validateName(name);
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new AppError(400, 'status must be available or unavailable');
    changes.status = status;
  }
  return equipmentRepository.update(id, changes);
}

// "Delete" = retire: history stays readable, the item disappears from the catalog.
async function retire(user, id) {
  await ownEquipment(user, id);
  if ((await reservationRepository.countActiveByEquipment(id)) > 0) {
    throw new AppError(409, 'equipment has active reservations', 'HAS_ACTIVE_RESERVATIONS');
  }
  return equipmentRepository.update(id, { status: 'retired' });
}

module.exports = { list, create, update, retire };
