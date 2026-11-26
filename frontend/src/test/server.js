import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// In-memory fake of the ToolShare API. Responses follow the real API: { error: { code, message } }.
const PASSWORD = 'Password123!';

export const USERS = {
  user: { id: 'u1', name: 'Client Démo', email: 'client@t.io', role: 'user', storeId: null },
  manager: { id: 'u2', name: 'Manager Safi', email: 'manager@t.io', role: 'manager', storeId: 's1' },
  admin: { id: 'u3', name: 'Admin ToolShare', email: 'admin@t.io', role: 'admin', storeId: null },
};

const fail = (status, code, message) => HttpResponse.json({ error: { code, message } }, { status });

const makeDb = () => ({
  forceConflictOnCreate: false,
  createCalls: 0,
  stores: [
    {
      _id: 's1', name: 'ToolShare Safi', address: '12 Avenue Mohammed V', active: true,
      equipment: [
        { _id: 'e1', name: 'Perceuse à percussion', status: 'available', store: 's1' },
        { _id: 'e2', name: 'Meuleuse d’angle', status: 'available', store: 's1' },
        { _id: 'e3', name: 'Scie circulaire', status: 'unavailable', store: 's1' },
      ],
    },
    { _id: 's2', name: 'ToolShare Agadir', address: '5 Boulevard du 20 Août', active: true, equipment: [] },
  ],
  users: [
    { ...USERS.user },
    { ...USERS.manager, storeName: 'ToolShare Safi' },
    { ...USERS.admin },
  ],
  reservations: [
    { _id: 'r1', reference: 'TS-0001', user: 'u1', store: 's1', equipment: 'e1', startDate: '2031-03-14T10:00:00.000Z', endDate: '2031-03-14T12:00:00.000Z', durationHours: 2, status: 'confirmed' },
    { _id: 'r2', reference: 'TS-0002', user: 'u1', store: 's1', equipment: 'e2', startDate: '2030-01-10T10:00:00.000Z', endDate: '2030-01-10T11:00:00.000Z', durationHours: 1, status: 'cancelled' },
    { _id: 'r3', reference: 'TS-0003', user: 'u1', store: 's1', equipment: 'e2', startDate: '2030-02-10T10:00:00.000Z', endDate: '2030-02-10T14:00:00.000Z', durationHours: 4, status: 'in_progress' },
  ],
});

export let db = makeDb();
export const resetDb = () => {
  db = makeDb();
};

// Reads "Bearer token-<role>" and returns the user, or a ready-made 401/403 response.
function guard(request, ...roles) {
  const header = request.headers.get('Authorization') || '';
  const role = header.startsWith('Bearer token-') ? header.slice('Bearer token-'.length) : null;
  const user = role && USERS[role];
  if (!user) return { response: fail(401, 'UNAUTHORIZED', 'authentication required') };
  if (roles.length && !roles.includes(user.role)) return { response: fail(403, 'FORBIDDEN', 'forbidden') };
  return { user };
}

const detailed = (r) => ({
  ...r,
  user: { name: 'Client Démo', email: 'client@t.io' },
  equipment: { name: db.stores.flatMap((s) => s.equipment).find((e) => e._id === r.equipment)?.name },
  store: { name: db.stores.find((s) => s._id === r.store)?.name },
});

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    const match = Object.values(USERS).find((u) => u.email === email);
    if (!match || password !== PASSWORD) return fail(401, 'INVALID_CREDENTIALS', 'invalid email or password');
    return HttpResponse.json({ token: `token-${match.role}`, user: match });
  }),
  http.post('/api/auth/register', async ({ request }) => {
    const { name, email } = await request.json();
    if (email === 'taken@t.io') return fail(409, 'EMAIL_TAKEN', 'an account with this email already exists');
    return HttpResponse.json({ token: 'token-user', user: { ...USERS.user, name, email } }, { status: 201 });
  }),
  http.get('/api/installation/status', () => HttpResponse.json({ installed: true })),

  http.get('/api/catalog/stores', ({ request }) => {
    const g = guard(request);
    return g.response || HttpResponse.json({ stores: db.stores.filter((s) => s.active) });
  }),
  http.get('/api/reservations/availability', ({ request }) => {
    const g = guard(request);
    if (g.response) return g.response;
    const equipmentId = new URL(request.url).searchParams.get('equipmentId');
    return HttpResponse.json(equipmentId === 'e2' ? { available: false, reason: 'SLOT_TAKEN' } : { available: true });
  }),
  http.post('/api/reservations', async ({ request }) => {
    const g = guard(request, 'user');
    if (g.response) return g.response;
    db.createCalls += 1;
    const body = await request.json();
    if (db.forceConflictOnCreate || body.equipmentId === 'e2') return fail(409, 'SLOT_TAKEN', 'the requested time slot is no longer available');
    const reservation = { _id: 'r9', reference: 'TS-NEW-0009', user: 'u1', store: body.storeId, equipment: body.equipmentId, startDate: body.startDate, endDate: body.startDate, durationHours: body.durationHours, status: 'confirmed' };
    db.reservations.push(reservation);
    return HttpResponse.json({ reservation }, { status: 201 });
  }),
  http.get('/api/me/reservations', ({ request }) => {
    const g = guard(request, 'user');
    return g.response || HttpResponse.json({ reservations: db.reservations.filter((r) => r.status === 'confirmed') });
  }),
  http.get('/api/me/loans', ({ request }) => {
    const g = guard(request, 'user');
    return g.response || HttpResponse.json({ loans: db.reservations.filter((r) => r.status === 'in_progress') });
  }),
  http.get('/api/me/history', ({ request }) => {
    const g = guard(request, 'user');
    return g.response || HttpResponse.json({ history: db.reservations.filter((r) => ['returned', 'cancelled'].includes(r.status)) });
  }),
  http.patch('/api/reservations/:id/cancel', ({ request, params }) => {
    const g = guard(request, 'user');
    if (g.response) return g.response;
    const r = db.reservations.find((x) => x._id === params.id);
    if (!r) return fail(404, 'NOT_FOUND', 'reservation not found');
    if (r.status !== 'confirmed') return fail(409, 'INVALID_STATUS', 'only confirmed reservations can be cancelled');
    r.status = 'cancelled';
    return HttpResponse.json({ reservation: r });
  }),

  // Manager
  http.get('/api/manager/reservations', ({ request }) => {
    const g = guard(request, 'manager');
    if (g.response) return g.response;
    const status = new URL(request.url).searchParams.get('status');
    const list = db.reservations.filter((r) => r.store === 's1' && (!status || r.status === status));
    return HttpResponse.json({ reservations: list.map(detailed) });
  }),
  http.patch('/api/reservations/:id/handover', ({ request, params }) => {
    const g = guard(request, 'manager');
    if (g.response) return g.response;
    const r = db.reservations.find((x) => x._id === params.id);
    if (r.status !== 'confirmed') return fail(409, 'INVALID_STATUS', 'only confirmed reservations can become in_progress');
    r.status = 'in_progress';
    return HttpResponse.json({ reservation: detailed(r) });
  }),
  http.patch('/api/reservations/:id/return', ({ request, params }) => {
    const g = guard(request, 'manager');
    if (g.response) return g.response;
    const r = db.reservations.find((x) => x._id === params.id);
    if (r.status !== 'in_progress') return fail(409, 'INVALID_STATUS', 'only in_progress reservations can become returned');
    r.status = 'returned';
    return HttpResponse.json({ reservation: detailed(r) });
  }),
  http.get('/api/equipment', ({ request }) => {
    const g = guard(request, 'manager');
    return g.response || HttpResponse.json({ equipment: db.stores[0].equipment });
  }),
  http.post('/api/equipment', async ({ request }) => {
    const g = guard(request, 'manager');
    if (g.response) return g.response;
    const body = await request.json();
    const item = { _id: `e${db.stores[0].equipment.length + 1}`, store: 's1', ...body };
    db.stores[0].equipment.push(item);
    return HttpResponse.json({ equipment: item }, { status: 201 });
  }),

  // Admin
  http.get('/api/stores', ({ request }) => {
    const g = guard(request, 'admin');
    return g.response || HttpResponse.json({ stores: db.stores });
  }),
  http.post('/api/stores', async ({ request }) => {
    const g = guard(request, 'admin');
    if (g.response) return g.response;
    const store = { _id: `s${db.stores.length + 1}`, active: true, equipment: [], ...(await request.json()) };
    db.stores.push(store);
    return HttpResponse.json({ store }, { status: 201 });
  }),
  http.get('/api/users', ({ request }) => {
    const g = guard(request, 'admin');
    if (g.response) return g.response;
    const role = new URL(request.url).searchParams.get('role');
    return HttpResponse.json({ users: db.users.filter((u) => !role || u.role === role) });
  }),
  http.post('/api/users', async ({ request }) => {
    const g = guard(request, 'admin');
    if (g.response) return g.response;
    const body = await request.json();
    const user = { id: `u${db.users.length + 1}`, name: body.name, email: body.email, role: body.role, storeId: body.storeId || null };
    db.users.push(user);
    return HttpResponse.json({ user }, { status: 201 });
  }),
  http.get('/api/admin/reservations', ({ request }) => {
    const g = guard(request, 'admin');
    return g.response || HttpResponse.json({ reservations: db.reservations.map(detailed) });
  }),
];

export const server = setupServer(...handlers);
export { http, HttpResponse, fail };
