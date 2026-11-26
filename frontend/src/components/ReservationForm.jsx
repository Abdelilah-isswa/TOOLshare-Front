import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAvailability, useCreateReservation } from '../hooks/queries';
import { validateReservation } from '../utils/validators';
import { errorMessage } from '../utils/errors';
import { formatDateTime } from '../utils/format';
import { SelectField, TextField } from './ui/Field';
import Button from './ui/Button';
import { ErrorMessage, Notice } from './ui/Feedback';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const value = `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
  return { value, label: value };
});

// Reservation form: validates locally, asks the API whether the slot is free as soon as the
// input is valid, then books. A 409 (slot taken) is shown as a clear, actionable message.
export default function ReservationForm({ store, equipment, onClose }) {
  const [form, setForm] = useState({ date: '', time: '09:00', duration: '2' });
  const [submitted, setSubmitted] = useState(false);
  const mutation = useCreateReservation();

  const { errors, start, hours } = useMemo(() => validateReservation(form), [form]);
  const valid = Object.keys(errors).length === 0;
  const equipmentId = String(equipment._id);

  const availability = useAvailability(
    { equipmentId, startDate: start?.toISOString(), durationHours: hours },
    valid && Boolean(start)
  );

  const set = (field) => (event) => {
    mutation.reset();
    setForm((f) => ({ ...f, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    mutation.mutate({ storeId: String(store._id), equipmentId, startDate: start.toISOString(), durationHours: hours });
  };

  if (mutation.isSuccess) {
    const reservation = mutation.data;
    return (
      <div>
        <Notice tone="success">
          Réservation confirmée. Référence : <strong>{reservation.reference}</strong>
        </Notice>
        <p>
          {equipment.name} · {formatDateTime(reservation.startDate)}
        </p>
        <div className="actions">
          <Link className="btn btn-primary" to="/client/reservations">
            Voir mes réservations
          </Link>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  const unavailable = availability.data && availability.data.available === false;
  const show = (field) => (submitted ? errors[field] : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="muted">
        {equipment.name} — {store.name}
      </p>
      <div className="grid-2">
        <TextField label="Date de début" type="date" value={form.date} onChange={set('date')} error={show('date')} />
        <SelectField label="Heure de début" options={TIME_OPTIONS} value={form.time} onChange={set('time')} error={show('time')} />
      </div>
      <TextField
        label="Durée (heures)"
        type="number"
        min="0.5"
        max="168"
        step="0.5"
        value={form.duration}
        onChange={set('duration')}
        error={show('duration')}
        hint="Par pas de 30 minutes, 7 jours maximum."
      />

      {valid && availability.isFetching && <p className="muted" role="status">Vérification de la disponibilité…</p>}
      {valid && availability.data?.available && <Notice tone="success">Ce créneau est disponible.</Notice>}
      {unavailable && <Notice tone="warning">{errorMessage({ code: availability.data.reason })}</Notice>}
      {valid && availability.isError && <ErrorMessage error={availability.error} />}

      <ErrorMessage error={mutation.error} />
      <div className="actions">
        <Button type="submit" loading={mutation.isPending} disabled={unavailable}>
          Confirmer la réservation
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
