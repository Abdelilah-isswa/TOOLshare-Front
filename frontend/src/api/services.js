import { api } from './client';

const data = (promise) => promise.then((res) => res.data);

export const authApi = {
  login: (body) => data(api.post('/auth/login', body)),
  register: (body) => data(api.post('/auth/register', body)),
  me: () => data(api.get('/auth/me')),
  installationStatus: () => data(api.get('/installation/status')),
  install: (body) => data(api.post('/installation', body)),
};

export const catalogApi = {
  stores: () => data(api.get('/catalog/stores')).then((d) => d.stores),
};

export const reservationApi = {
  create: (body) => data(api.post('/reservations', body)).then((d) => d.reservation),
  availability: (params) => data(api.get('/reservations/availability', { params })),
  cancel: (id) => data(api.patch(`/reservations/${id}/cancel`)).then((d) => d.reservation),
  mine: (kind) => data(api.get(`/me/${kind}`)).then((d) => d[kind]),
  forManager: (status) =>
    data(api.get('/manager/reservations', { params: status ? { status } : {} })).then((d) => d.reservations),
  handover: (id) => data(api.patch(`/reservations/${id}/handover`)).then((d) => d.reservation),
  returnItem: (id) => data(api.patch(`/reservations/${id}/return`)).then((d) => d.reservation),
  forAdmin: (params) => data(api.get('/admin/reservations', { params })).then((d) => d.reservations),
};

export const equipmentApi = {
  list: () => data(api.get('/equipment')).then((d) => d.equipment),
  create: (body) => data(api.post('/equipment', body)).then((d) => d.equipment),
  update: ({ id, ...body }) => data(api.put(`/equipment/${id}`, body)).then((d) => d.equipment),
  retire: (id) => data(api.delete(`/equipment/${id}`)).then((d) => d.equipment),
};

export const adminApi = {
  stores: () => data(api.get('/stores')).then((d) => d.stores),
  createStore: (body) => data(api.post('/stores', body)).then((d) => d.store),
  updateStore: ({ id, ...body }) => data(api.put(`/stores/${id}`, body)).then((d) => d.store),
  deactivateStore: (id) => data(api.patch(`/stores/${id}/deactivate`)).then((d) => d.store),
  users: (role) => data(api.get('/users', { params: role ? { role } : {} })).then((d) => d.users),
  createUser: (body) => data(api.post('/users', body)).then((d) => d.user),
  assignStore: ({ userId, storeId }) => data(api.put(`/managers/${userId}/store`, { storeId })).then((d) => d.manager),
};
