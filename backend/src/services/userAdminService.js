const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const serializeUser = require('../utils/serializeUser');
const userRepository = require('../repositories/userRepository');
const storeRepository = require('../repositories/storeRepository');

const ROLES = ['user', 'manager', 'admin'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function list(role) {
  if (role && !ROLES.includes(role)) throw new AppError(400, `role must be one of ${ROLES.join(', ')}`);
  const users = await userRepository.findAll(role ? { role } : {});
  return users.map(serializeUser);
}

// Admin creates staff accounts (managers, with an optional store) or customers.
async function create({ name, email, password, role = 'manager', storeId } = {}) {
  if (!ROLES.includes(role) || role === 'admin') throw new AppError(400, 'role must be manager or user');
  if (typeof name !== 'string' || !name.trim()) throw new AppError(400, 'name is required');
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) throw new AppError(400, 'email is not valid');
  if (typeof password !== 'string' || password.length < 8) {
    throw new AppError(400, 'password must be at least 8 characters');
  }
  let store = null;
  if (storeId) {
    store = await storeRepository.findById(storeId);
    if (!store) throw new AppError(404, 'store not found');
    if (!store.active) throw new AppError(409, 'cannot assign a manager to an inactive store');
  }
  if (await userRepository.findByEmail(email.toLowerCase())) {
    throw new AppError(409, 'an account with this email already exists', 'EMAIL_TAKEN');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({
    name: name.trim(),
    email,
    passwordHash,
    role,
    store: role === 'manager' && store ? store._id : null,
  });
  return serializeUser(user);
}

module.exports = { list, create };
