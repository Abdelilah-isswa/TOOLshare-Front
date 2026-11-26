const asyncHandler = require('../utils/asyncHandler');
const equipmentService = require('../services/equipmentService');
const staffReservationService = require('../services/staffReservationService');
const userAdminService = require('../services/userAdminService');

exports.listEquipment = asyncHandler(async (req, res) => res.json({ equipment: await equipmentService.list(req.user) }));
exports.createEquipment = asyncHandler(async (req, res) =>
  res.status(201).json({ equipment: await equipmentService.create(req.user, req.body || {}) }));
exports.updateEquipment = asyncHandler(async (req, res) =>
  res.json({ equipment: await equipmentService.update(req.user, req.params.equipmentId, req.body || {}) }));
exports.retireEquipment = asyncHandler(async (req, res) =>
  res.json({ equipment: await equipmentService.retire(req.user, req.params.equipmentId) }));

exports.managerReservations = asyncHandler(async (req, res) =>
  res.json({ reservations: await staffReservationService.listForStore(req.user, req.query.status) }));
exports.handover = asyncHandler(async (req, res) =>
  res.json({ reservation: await staffReservationService.handover(req.user, req.params.reservationId) }));
exports.returnItem = asyncHandler(async (req, res) =>
  res.json({ reservation: await staffReservationService.returnItem(req.user, req.params.reservationId) }));

exports.adminReservations = asyncHandler(async (req, res) =>
  res.json({ reservations: await staffReservationService.listAll(req.query) }));
exports.listUsers = asyncHandler(async (req, res) => res.json({ users: await userAdminService.list(req.query.role) }));
exports.createUser = asyncHandler(async (req, res) =>
  res.status(201).json({ user: await userAdminService.create(req.body || {}) }));
