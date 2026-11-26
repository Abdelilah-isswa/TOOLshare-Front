import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { renderApp } from './utils';
import { db, fail, server } from './server';

describe('admin stores', () => {
  it('lists all stores', async () => {
    renderApp('/admin/stores', { as: 'admin' });
    expect(await screen.findByText('ToolShare Safi')).toBeInTheDocument();
    expect(screen.getByText('ToolShare Agadir')).toBeInTheDocument();
  });

  it('validates and creates a store, which then appears in the list', async () => {
    const user = userEvent.setup();
    renderApp('/admin/stores', { as: 'admin' });
    await screen.findByText('ToolShare Safi');
    await user.click(screen.getByRole('button', { name: 'Nouveau magasin' }));
    const dialog = screen.getByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: 'Créer le magasin' }));
    expect(within(dialog).getByText('Le nom est obligatoire.')).toBeInTheDocument();
    expect(within(dialog).getByText('L’adresse est obligatoire.')).toBeInTheDocument();
    expect(db.stores).toHaveLength(2);

    await user.type(within(dialog).getByLabelText('Nom du magasin'), 'ToolShare Rabat');
    await user.type(within(dialog).getByLabelText('Adresse'), '1 Rue Test');
    await user.click(within(dialog).getByRole('button', { name: 'Créer le magasin' }));
    expect(await screen.findByText('ToolShare Rabat')).toBeInTheDocument();
  });

  it('shows an access-denied message when the API answers 403', async () => {
    server.use(http.get('/api/stores', () => fail(403, 'FORBIDDEN', 'forbidden')));
    renderApp('/admin/stores', { as: 'admin' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé');
  });
});

describe('admin users', () => {
  it('lists users and filters by role', async () => {
    const user = userEvent.setup();
    renderApp('/admin/users', { as: 'admin' });
    expect(await screen.findByText('client@t.io')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filtrer par rôle'), 'manager');
    expect(await screen.findByText('manager@t.io')).toBeInTheDocument();
    expect(screen.queryByText('client@t.io')).not.toBeInTheDocument();
  });

  it('creates a manager with validation', async () => {
    const user = userEvent.setup();
    renderApp('/admin/users', { as: 'admin' });
    await screen.findByText('client@t.io');
    await user.click(screen.getByRole('button', { name: 'Nouveau manager' }));
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByLabelText('Nom complet'), 'Samir');
    await user.type(within(dialog).getByLabelText('Email'), 'pas-un-email');
    await user.type(within(dialog).getByLabelText('Mot de passe provisoire'), 'Password123!');
    await user.click(within(dialog).getByRole('button', { name: 'Créer le manager' }));
    expect(within(dialog).getByText('Format d’email invalide.')).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText('Email'));
    await user.type(within(dialog).getByLabelText('Email'), 'samir@t.io');
    await user.click(within(dialog).getByRole('button', { name: 'Créer le manager' }));
    expect(await screen.findByText('samir@t.io')).toBeInTheDocument();
    expect(db.users.at(-1)).toMatchObject({ role: 'manager', email: 'samir@t.io' });
  });
});

describe('admin reservations', () => {
  it('shows reservations of every store with client and equipment names', async () => {
    renderApp('/admin/reservations', { as: 'admin' });
    expect(await screen.findByText('TS-0001')).toBeInTheDocument();
    expect(screen.getAllByText('Client Démo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ToolShare Safi').length).toBeGreaterThan(0);
  });
});
