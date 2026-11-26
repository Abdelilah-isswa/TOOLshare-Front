import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderApp } from './utils';
import { server } from './server';
import { session } from '../utils/session';

let loginRequests;
beforeEach(() => {
  loginRequests = 0;
  server.events.on('request:start', ({ request }) => {
    if (request.url.endsWith('/api/auth/login')) loginRequests += 1;
  });
});
afterEach(() => server.events.removeAllListeners());

const fillLogin = async (user, email, password) => {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Mot de passe'), password);
  await user.click(screen.getByRole('button', { name: 'Se connecter' }));
};

describe('login', () => {
  it('logs a manager in and sends them to their own space', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await fillLogin(user, 'manager@t.io', 'Password123!');
    expect(await screen.findByRole('heading', { name: /Magasin ToolShare Safi/ })).toBeInTheDocument();
    expect(session.getToken()).toBe('token-manager');
  });

  it('shows an error and stays on the page when the credentials are wrong (401)', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await fillLogin(user, 'manager@t.io', 'wrong-password');
    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.');
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(session.getToken()).toBeNull();
  });

  it('validates the form without calling the API', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(screen.getByText('L’email est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Le mot de passe est obligatoire.')).toBeInTheDocument();
    expect(loginRequests).toBe(0);
  });

  it('reports a network failure clearly', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.error()));
    const user = userEvent.setup();
    renderApp('/login');
    await fillLogin(user, 'manager@t.io', 'Password123!');
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de joindre le serveur');
  });
});

describe('register', () => {
  it('blocks mismatching passwords on the client side', async () => {
    const user = userEvent.setup();
    renderApp('/register');
    await user.type(screen.getByLabelText('Nom complet'), 'Nadia');
    await user.type(screen.getByLabelText('Email'), 'nadia@t.io');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Password999!');
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
  });

  it('creates the account and opens the customer space', async () => {
    const user = userEvent.setup();
    renderApp('/register');
    await user.type(screen.getByLabelText('Nom complet'), 'Nadia');
    await user.type(screen.getByLabelText('Email'), 'nadia@t.io');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByRole('heading', { name: 'Nos magasins' })).toBeInTheDocument();
  });

  it('shows the API conflict when the email is already used (409)', async () => {
    const user = userEvent.setup();
    renderApp('/register');
    await user.type(screen.getByLabelText('Nom complet'), 'Nadia');
    await user.type(screen.getByLabelText('Email'), 'taken@t.io');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Un compte existe déjà');
  });
});

describe('logout', () => {
  it('clears the session and returns to the login page', async () => {
    const user = userEvent.setup();
    renderApp('/client/stores', { as: 'user' });
    await screen.findByRole('heading', { name: 'Nos magasins' });
    await user.click(screen.getByRole('button', { name: 'Déconnexion' }));
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    await waitFor(() => expect(session.getToken()).toBeNull());
  });
});
