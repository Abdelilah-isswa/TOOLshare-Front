// Route wiring and access rules that are decided BEFORE any database call: no MongoDB needed.
const request = require('supertest');
const app = require('../../src/app');
const { bearer } = require('../helpers/auth');

const as = (role, extra = {}) => bearer({ _id: 'abc123abc123abc123abc123', role, ...extra });

describe('Sprint 3 routes: authentication and roles', () => {
  test.each([
    ['get', '/api/equipment'],
    ['post', '/api/equipment'],
    ['get', '/api/manager/reservations'],
    ['patch', '/api/reservations/abc/handover'],
    ['patch', '/api/reservations/abc/return'],
    ['get', '/api/admin/reservations'],
    ['get', '/api/users'],
    ['post', '/api/users'],
    ['get', '/api/auth/me'],
  ])('%s %s without a token is 401', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBeDefined();
  });

  test.each([
    ['user', 'get', '/api/equipment'],
    ['admin', 'get', '/api/equipment'],
    ['user', 'get', '/api/manager/reservations'],
    ['user', 'patch', '/api/reservations/abc/handover'],
    ['manager', 'get', '/api/admin/reservations'],
    ['manager', 'get', '/api/users'],
    ['user', 'post', '/api/users'],
  ])('%s calling %s %s is 403', async (role, method, url) => {
    const res = await request(app)[method](url).set('Authorization', as(role));
    expect(res.status).toBe(403);
  });

  test('a manager without a store is refused before touching the database', async () => {
    const res = await request(app).get('/api/equipment').set('Authorization', as('manager', { store: null }));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NO_STORE');
  });

  test('login and register validate their input (400)', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(400);
    expect((await request(app).post('/api/auth/login').send({ email: 'bad', password: 'x' })).status).toBe(400);
    expect((await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@b.co', password: 'short' })).status).toBe(400);
  });

  test('unknown routes are still 404 (the staff router does not swallow them)', async () => {
    expect((await request(app).get('/api/does-not-exist')).status).toBe(404);
  });

  test('the Swagger spec lists the new endpoints', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(Object.keys(res.body.paths)).toEqual(expect.arrayContaining(['/api/auth/login', '/api/equipment', '/api/users']));
  });
});
