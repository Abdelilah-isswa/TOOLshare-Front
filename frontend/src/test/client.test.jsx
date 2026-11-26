import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils';
import { db } from './server';

const openReservation = async (user, equipmentName) => {
  renderApp('/client/stores/s1', { as: 'user' });
  await screen.findByRole('heading', { name: 'ToolShare Safi' });
  await user.click(screen.getByRole('button', { name: `Réserver ${equipmentName}` }));
  return screen.getByRole('dialog');
};

const pickDate = (dialog, value = '2031-03-14') =>
  fireEvent.change(within(dialog).getByLabelText('Date de début'), { target: { value } });

describe('stores and equipment', () => {
  it('lists the stores with their available equipment', async () => {
    renderApp('/client/stores', { as: 'user' });
    expect(await screen.findByText('ToolShare Safi')).toBeInTheDocument();
    expect(screen.getByText('2 matériels disponibles')).toBeInTheDocument();
    expect(screen.getByText('ToolShare Agadir')).toBeInTheDocument();
  });

  it('filters the equipment of a store by search and availability', async () => {
    const user = userEvent.setup();
    renderApp('/client/stores/s1', { as: 'user' });
    await screen.findByText('Perceuse à percussion');
    expect(screen.getByText('Scie circulaire')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Rechercher'), 'scie');
    expect(screen.queryByText('Perceuse à percussion')).not.toBeInTheDocument();
    expect(screen.getByText('Scie circulaire')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Rechercher'));
    await user.click(screen.getByLabelText('Disponibles seulement'));
    expect(screen.queryByText('Scie circulaire')).not.toBeInTheDocument();
    expect(screen.getByText('Meuleuse d’angle')).toBeInTheDocument();
  });

  it('does not let customers reserve unavailable equipment', async () => {
    renderApp('/client/stores/s1', { as: 'user' });
    expect(await screen.findByRole('button', { name: 'Réserver Scie circulaire' })).toBeDisabled();
  });
});

describe('reservation', () => {
  it('books a free slot and shows the reference', async () => {
    const user = userEvent.setup();
    const dialog = await openReservation(user, 'Perceuse à percussion');
    pickDate(dialog);
    expect(await within(dialog).findByText('Ce créneau est disponible.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer la réservation' }));
    expect(await within(dialog).findByText('TS-NEW-0009')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Voir mes réservations' })).toHaveAttribute('href', '/client/reservations');
  });

  it('validates the form before calling the API', async () => {
    const user = userEvent.setup();
    const dialog = await openReservation(user, 'Perceuse à percussion');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer la réservation' }));
    expect(within(dialog).getByText('Choisissez une date.')).toBeInTheDocument();
    expect(db.createCalls).toBe(0);

    pickDate(dialog, '2020-01-01');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer la réservation' }));
    expect(within(dialog).getByText('Le début doit être dans le futur.')).toBeInTheDocument();
    expect(db.createCalls).toBe(0);
  });

  it('warns about a conflict as soon as the slot is known to be taken', async () => {
    const user = userEvent.setup();
    const dialog = await openReservation(user, 'Meuleuse d’angle');
    pickDate(dialog);
    expect(await within(dialog).findByText(/déjà réservé/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Confirmer la réservation' })).toBeDisabled();
  });

  it('handles a conflict (409) that happens while booking', async () => {
    db.forceConflictOnCreate = true; // someone else booked between the check and the click
    const user = userEvent.setup();
    const dialog = await openReservation(user, 'Perceuse à percussion');
    pickDate(dialog);
    await within(dialog).findByText('Ce créneau est disponible.');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer la réservation' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Ce créneau est déjà réservé');
    expect(within(dialog).queryByText('TS-NEW-0009')).not.toBeInTheDocument();
  });

  it('closes the dialog with the Escape key', async () => {
    const user = userEvent.setup();
    await openReservation(user, 'Perceuse à percussion');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('my reservations', () => {
  it('shows upcoming reservations with equipment names, then the history', async () => {
    const user = userEvent.setup();
    renderApp('/client/reservations', { as: 'user' });
    expect(await screen.findByText('TS-0001')).toBeInTheDocument();
    expect(await screen.findByText(/Perceuse à percussion \(ToolShare Safi\)/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Historique' }));
    expect(await screen.findByText('TS-0002')).toBeInTheDocument();
    expect(screen.getByText('Annulée')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'En cours' }));
    expect(await screen.findByText('TS-0003')).toBeInTheDocument();
  });

  it('cancels a reservation after confirmation and refreshes the list', async () => {
    const user = userEvent.setup();
    renderApp('/client/reservations', { as: 'user' });
    await screen.findByText('TS-0001');
    await user.click(screen.getByRole('button', { name: 'Annuler la réservation TS-0001' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));
    expect(await screen.findByText('Rien à afficher ici pour le moment.')).toBeInTheDocument();
    expect(db.reservations.find((r) => r._id === 'r1').status).toBe('cancelled');
  });
});
