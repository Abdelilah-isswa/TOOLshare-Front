const express = require('express');
const controller = require('../controllers/staffController');
const authenticate = require('../middlewares/authenticate');
const authorizeRoles = require('../middlewares/authorizeRoles');

// Manager equipment CRUD, manager reservation handling, admin supervision.
const router = express.Router();

/**
 * @openapi
 * /api/equipment:
 *   get:
 *     summary: Equipment of the manager's own store
 *     tags: [Equipment]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Equipment list }
 *       403: { description: Not a manager, or no store assigned }
 */
router.get('/equipment', authenticate, authorizeRoles('manager'), controller.listEquipment);
router.post('/equipment', authenticate, authorizeRoles('manager'), controller.createEquipment);
router.put('/equipment/:equipmentId', authenticate, authorizeRoles('manager'), controller.updateEquipment);
router.delete('/equipment/:equipmentId', authenticate, authorizeRoles('manager'), controller.retireEquipment);

/**
 * @openapi
 * /api/manager/reservations:
 *   get:
 *     summary: Reservations of the manager's own store (optional ?status=)
 *     tags: [Manager]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Reservations with user and equipment names }
 */
router.get('/manager/reservations', authenticate, authorizeRoles('manager'), controller.managerReservations);
router.patch('/reservations/:reservationId/handover', authenticate, authorizeRoles('manager'), controller.handover);
router.patch('/reservations/:reservationId/return', authenticate, authorizeRoles('manager'), controller.returnItem);

/**
 * @openapi
 * /api/admin/reservations:
 *   get:
 *     summary: All reservations (Admin), optional ?status= and ?storeId=
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Reservations }
 */
router.get('/admin/reservations', authenticate, authorizeRoles('admin'), controller.adminReservations);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List users (Admin), optional ?role=
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Users without password }
 */
router.get('/users', authenticate, authorizeRoles('admin'), controller.listUsers);
router.post('/users', authenticate, authorizeRoles('admin'), controller.createUser);

module.exports = router;
