const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/AppError');
const serializeUser = require('../utils/serializeUser');
const userRepository = require('../repositories/userRepository');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function signToken(user) {
  // Payload shape expected by the authenticate middleware: { sub, role, storeId }.
  return jwt.sign(
    { sub: String(user._id), role: user.role, storeId: user.store ? String(user.store) : null },
    config.jwtSecret,
    { expiresIn: '8h' }
  );
}

function validateCredentials({ email, password }) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError(400, 'email and password are required');
  }
  if (!EMAIL_RE.test(email)) throw new AppError(400, 'email is not valid');
}

async function register({ name, email, password } = {}) {
  validateCredentials({ email, password });
  if (typeof name !== 'string' || !name.trim()) throw new AppError(400, 'name is required');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (await userRepository.findByEmail(email.toLowerCase())) {
    throw new AppError(409, 'an account with this email already exists', 'EMAIL_TAKEN');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({ name: name.trim(), email, passwordHash, role: 'user' });
  return { token: signToken(user), user: serializeUser(user) };
}

async function login({ email, password } = {}) {
  validateCredentials({ email, password });
  const user = await userRepository.findByEmail(email.toLowerCase());
  // Same message for unknown email and wrong password: no account enumeration.
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw new AppError(401, 'invalid email or password', 'INVALID_CREDENTIALS');
  return { token: signToken(user), user: serializeUser(user) };
}

async function me(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(401, 'account no longer exists');
  return serializeUser(user);
}

module.exports = { register, login, me, signToken };
