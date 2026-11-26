jest.mock('../../src/repositories/reservationRepository');
jest.mock('../../src/repositories/equipmentRepository');
jest.mock('../../src/repositories/userRepository');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const reservationRepository = require('../../src/repositories/reservationRepository');
const equipmentRepository = require('../../src/repositories/equipmentRepository');
const userRepository = require('../../src/repositories/userRepository');
const staffReservationService = require('../../src/services/staffReservationService');
const equipmentService = require('../../src/services/equipmentService');
const authService = require('../../src/services/authService');

const manager = { id: 'm1', role: 'manager', storeId: 's1' };
const future = (h) => new Date(Date.now() + h * 3600 * 1000);

describe('handover / return rules', () => {
  test('confirmed -> in_progress for a reservation of the manager store', async () => {
    reservationRepository.findById.mockResolvedValue({ status: 'confirmed', store: 's1', endDate: future(2) });
    reservationRepository.transition.mockResolvedValue({ status: 'in_progress' });
    const res = await staffReservationService.handover(manager, 'r1');
    expect(res.status).toBe('in_progress');
    expect(reservationRepository.transition).toHaveBeenCalledWith('r1', 's1', 'confirmed', 'in_progress');
  });

  test('another store is forbidden (403)', async () => {
    reservationRepository.findById.mockResolvedValue({ status: 'confirmed', store: 's2', endDate: future(2) });
    await expect(staffReservationService.handover(manager, 'r1')).rejects.toMatchObject({ statusCode: 403 });
  });

  test('wrong status is a 409', async () => {
    reservationRepository.findById.mockResolvedValue({ status: 'cancelled', store: 's1', endDate: future(2) });
    await expect(staffReservationService.handover(manager, 'r1')).rejects.toMatchObject({ statusCode: 409 });
    reservationRepository.findById.mockResolvedValue({ status: 'confirmed', store: 's1', endDate: future(2) });
    await expect(staffReservationService.returnItem(manager, 'r1')).rejects.toMatchObject({ statusCode: 409 });
  });

  test('an expired reservation cannot be handed over', async () => {
    reservationRepository.findById.mockResolvedValue({ status: 'confirmed', store: 's1', endDate: future(-1) });
    await expect(staffReservationService.handover(manager, 'r1')).rejects.toMatchObject({ code: 'RESERVATION_EXPIRED' });
  });

  test('a manager without store is forbidden', async () => {
    await expect(staffReservationService.handover({ id: 'm', role: 'manager', storeId: null }, 'r1')).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('equipment scope', () => {
  test('creation always uses the store of the manager', async () => {
    equipmentRepository.create.mockImplementation(async (d) => d);
    const created = await equipmentService.create(manager, { name: ' Drill ', store: 'hacker-store' });
    expect(created).toMatchObject({ name: 'Drill', store: 's1' });
  });

  test('cannot edit equipment of another store', async () => {
    equipmentRepository.findById.mockResolvedValue({ _id: 'e1', store: 's2' });
    await expect(equipmentService.update(manager, 'e1', { name: 'x' })).rejects.toMatchObject({ statusCode: 403 });
  });

  test('cannot retire equipment with active reservations', async () => {
    equipmentRepository.findById.mockResolvedValue({ _id: 'e1', store: 's1' });
    reservationRepository.countActiveByEquipment.mockResolvedValue(1);
    await expect(equipmentService.retire(manager, 'e1')).rejects.toMatchObject({ statusCode: 409 });
  });

  test('validates name and status', async () => {
    await expect(equipmentService.create(manager, { name: '  ' })).rejects.toMatchObject({ statusCode: 400 });
    await expect(equipmentService.create(manager, { name: 'ok', status: 'broken' })).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('authService', () => {
  test('login returns a JWT with { sub, role, storeId } and no password', async () => {
    const password = await bcrypt.hash('Password123!', 4);
    userRepository.findByEmail.mockResolvedValue({
      _id: 'u1', name: 'M', email: 'm@t.io', password, role: 'manager', store: 's1',
    });
    const { token, user } = await authService.login({ email: 'M@t.io', password: 'Password123!' });
    expect(jwt.verify(token, config.jwtSecret)).toMatchObject({ sub: 'u1', role: 'manager', storeId: 's1' });
    expect(user.password).toBeUndefined();
  });

  test('wrong password and unknown email give the same 401', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(authService.login({ email: 'x@t.io', password: 'whatever1' })).rejects.toMatchObject({ statusCode: 401 });
    userRepository.findByEmail.mockResolvedValue({ _id: 'u', password: await bcrypt.hash('right-pass1', 4), role: 'user' });
    await expect(authService.login({ email: 'x@t.io', password: 'wrong-pass1' })).rejects.toMatchObject({ statusCode: 401 });
  });

  test('register validates input and rejects duplicates', async () => {
    await expect(authService.register({ name: 'A', email: 'bad', password: 'longenough1' })).rejects.toMatchObject({ statusCode: 400 });
    userRepository.findByEmail.mockResolvedValue({ _id: 'x' });
    await expect(authService.register({ name: 'A', email: 'a@t.io', password: 'longenough1' })).rejects.toMatchObject({ statusCode: 409 });
  });
});
