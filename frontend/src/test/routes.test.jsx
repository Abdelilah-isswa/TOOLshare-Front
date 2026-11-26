import { screen } from '@testing-library/react';
import { http } from 'msw';
import { renderApp } from './utils';
import { fail, server } from './server';
import { session } from '../utils/session';

describe('route protection', () => {
  it('sends an anonymous visitor to the login page', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
  });

  it.each(['/client/stores', '/manager', '/admin/stores'])('redirects anonymous access to %s to /login', async (path) => {
    renderApp(path);
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
  });

  it('opens directly on a private page when a session is stored (persistence)', async () => {
    renderApp('/client/stores', { as: 'user' });
    expect(await screen.findByRole('heading', { name: 'Nos magasins' })).toBeInTheDocument();
    expect(screen.getByText('Client Démo')).toBeInTheDocument();
  });

  it('redirects "/" to the home page of each role', async () => {
    renderApp('/', { as: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Magasins' })).toBeInTheDocument();
  });

  it('keeps logged-in users away from the login page', async () => {
    renderApp('/login', { as: 'user' });
    expect(await screen.findByRole('heading', { name: 'Nos magasins' })).toBeInTheDocument();
  });
});

describe('roles', () => {
  it('shows "access denied" to a customer who opens the manager space', async () => {
    renderApp('/manager', { as: 'user' });
    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
  });

  it('shows "access denied" to a manager who opens the admin space', async () => {
    renderApp('/admin/users', { as: 'manager' });
    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
  });

  it('shows only the navigation of the current role', async () => {
    renderApp('/manager', { as: 'manager' });
    await screen.findByRole('heading', { name: /Magasin/ });
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(nav).toHaveTextContent('Matériel');
    expect(nav).not.toHaveTextContent('Utilisateurs');
  });

  it('shows a 404 page for unknown addresses', async () => {
    renderApp('/nope', { as: 'user' });
    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  });

  it('shows a parameterized store page, and a clear message for an unknown store', async () => {
    renderApp('/client/stores/does-not-exist', { as: 'user' });
    expect(await screen.findByText(/n’existe pas ou est fermé/)).toBeInTheDocument();
  });
});

describe('401 and 403 from the API', () => {
  it('logs the user out and explains why when the token is rejected (401)', async () => {
    server.use(http.get('/api/catalog/stores', () => fail(401, 'UNAUTHORIZED', 'invalid or expired token')));
    renderApp('/client/stores', { as: 'user' });
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(screen.getByText('Votre session a expiré. Reconnectez-vous.')).toBeInTheDocument();
    expect(session.getToken()).toBeNull();
  });

  it('shows an access-denied message, without logging out, on a 403', async () => {
    server.use(http.get('/api/catalog/stores', () => fail(403, 'FORBIDDEN', 'forbidden')));
    renderApp('/client/stores', { as: 'user' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé');
    expect(session.getToken()).toBe('token-user');
  });
});
