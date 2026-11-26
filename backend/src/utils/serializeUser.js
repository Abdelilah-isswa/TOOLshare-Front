// Public shape of a user: never includes the password hash.
module.exports = function serializeUser(user) {
  const store = user.store && user.store._id ? user.store._id : user.store;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: store ? String(store) : null,
    storeName: user.store && user.store.name ? user.store.name : undefined,
  };
};
