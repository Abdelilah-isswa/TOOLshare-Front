const User = require('../models/User');

module.exports = {
  findById: (id) => User.findById(id),
  findByEmail: (email) => User.findOne({ email }),
  countAdmins: () => User.countDocuments({ role: 'admin' }),
  createAdmin: ({ name, email, passwordHash }) =>
    User.create({ name, email, password: passwordHash, role: 'admin' }),
};

// --- Added for the Sprint 3 frontend (auth + user administration) ---
module.exports.createUser = ({ name, email, passwordHash, role = 'user', store = null }) =>
  User.create({ name, email, password: passwordHash, role, store });
module.exports.findAll = (filter = {}) =>
  User.find(filter).sort({ createdAt: -1 }).populate('store', 'name');
