const express = require('express');
const controller = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Create a customer account (role user)
 *     tags: [Auth]
 *     responses:
 *       201: { description: 'Account created, returns token and user' }
 *       400: { description: Validation error }
 *       409: { description: Email already used }
 */
router.post('/register', controller.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in, returns a JWT and the user
 *     tags: [Auth]
 *     responses:
 *       200: { description: 'Returns token and user' }
 *       401: { description: Invalid credentials }
 */
router.post('/login', controller.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Current user (checks that the token is still valid)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Unauthenticated }
 */
router.get('/me', authenticate, controller.me);

module.exports = router;
