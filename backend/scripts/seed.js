/* Demo data for local development: node scripts/seed.js (needs MongoDB running).
 * Passwords below are for local demos only. Never use them anywhere public. */
const bcrypt = require('bcryptjs');
const { connect, disconnect } = require('../src/db');
const User = require('../src/models/User');
const Store = require('../src/models/Store');
const Equipment = require('../src/models/Equipment');
const Reservation = require('../src/models/Reservation');

const PASSWORD = 'Password123!';

async function main() {
  await connect();
  await Promise.all([User.deleteMany({}), Store.deleteMany({}), Equipment.deleteMany({}), Reservation.deleteMany({})]);
  const password = await bcrypt.hash(PASSWORD, 10);

  const [safi, agadir] = await Store.create([
    { name: 'ToolShare Safi', address: '12 Avenue Mohammed V, Safi' },
    { name: 'ToolShare Agadir', address: '5 Boulevard du 20 Août, Agadir' },
  ]);
  await Equipment.create([
    { name: 'Perceuse à percussion', store: safi._id },
    { name: 'Meuleuse d’angle 125 mm', store: safi._id },
    { name: 'Échafaudage mobile', store: safi._id },
    { name: 'Nettoyeur haute pression', store: agadir._id },
    { name: 'Scie circulaire', store: agadir._id, status: 'unavailable' },
  ]);
  await User.create([
    { name: 'Admin ToolShare', email: 'admin@toolshare.test', password, role: 'admin' },
    { name: 'Manager Safi', email: 'manager.safi@toolshare.test', password, role: 'manager', store: safi._id },
    { name: 'Manager Agadir', email: 'manager.agadir@toolshare.test', password, role: 'manager', store: agadir._id },
    { name: 'Client Démo', email: 'client@toolshare.test', password, role: 'user' },
  ]);
  console.log(`Seeded. Log in with admin@ / manager.safi@ / client@toolshare.test, password: ${PASSWORD}`);
  await disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
