import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { renderApp } from './utils';
import { db, fail, server } from './server';

describe('manager dashboard', () => {
  it('shows the counters of the manager’s own store', async () => {
    renderApp('/manager', { as: 'manager' });
    expect(await screen.findByRole('heading', { name: 'Magasin ToolShare Safi' })).toBeInTheDocument();
    expect(await screen.findByText('à remettre')).toBeInTheDocument();
    expect(screen.getByText('en cours de prêt')).toBeInTheDocument();
    expect(screen.getByText('matériels au catalogue')).toBeInTheDocument();
  });
});

describe('handover and return', () => {
  it('registers a handover, then the return', async () => {
    const user = userEvent.setup();
    renderApp('/manager/reservations', { as: 'manager' });
    const row = (await screen.findByText('TS-0001')).closest('tr');
    expect(within(row).getByText('Confirmée')).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: 'Enregistrer la remise de TS-0001' }));
    expect(await within((await screen.findByText('TS-0001')).closest('tr')).findByText('En cours')).toBeInTheDocument();
    expect(db.reservations.find((r) => r._id === 'r1').status).toBe('in_progress');

    await user.click(screen.getByRole('button', { name: 'Enregistrer le retour de TS-0001' }));
    expect(await within((await screen.findByText('TS-0001')).closest('tr')).findByText('Rendue')).toBeInTheDocument();
  });

  it('shows the API refusal when the action is no longer possible (409)', async () => {
    server.use(http.patch('/api/reservations/:id/handover', () => fail(409, 'INVALID_STATUS', 'only confirmed reservations can become in_progress')));
    const user = userEvent.setup();
    renderApp('/manager/reservations', { as: 'manager' });
    await screen.findByText('TS-0001');
    await user.click(screen.getByRole('button', { name: 'Enregistrer la remise de TS-0001' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('le statut de la réservation a changé');
    expect(db.reservations.find((r) => r._id === 'r1').status).toBe('confirmed');
  });

  it('filters the list by status', async () => {
    const user = userEvent.setup();
    renderApp('/manager/reservations', { as: 'manager' });
    await screen.findByText('TS-0001');
    await user.selectOptions(screen.getByLabelText('Filtrer par statut'), 'cancelled');
    expect(await screen.findByText('TS-0002')).toBeInTheDocument();
    expect(screen.queryByText('TS-0001')).not.toBeInTheDocument();
  });
});

describe('equipment management', () => {
  it('validates the form, then adds an item to the list', async () => {
    const user = userEvent.setup();
    renderApp('/manager/equipment', { as: 'manager' });
    await screen.findByText('Perceuse à percussion');

    await user.click(screen.getByRole('button', { name: 'Ajouter du matériel' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Ajouter' }));
    expect(within(dialog).getByText('Le nom est obligatoire.')).toBeInTheDocument();
    expect(db.stores[0].equipment).toHaveLength(3);

    await user.type(within(dialog).getByLabelText('Nom du matériel'), 'Ponceuse');
    await user.click(within(dialog).getByRole('button', { name: 'Ajouter' }));
    expect(await screen.findByText('Ponceuse')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
