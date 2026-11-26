// Client-side validation. The API validates again: these checks only give fast, clear feedback.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;
export const MAX_DURATION_HOURS = 168;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'L’email est obligatoire.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Format d’email invalide.';
  if (!password) errors.password = 'Le mot de passe est obligatoire.';
  return errors;
}

export function validateRegister({ name, email, password, confirm }) {
  const errors = validateLogin({ email, password });
  if (!name.trim()) errors.name = 'Le nom est obligatoire.';
  if (!errors.password && password.length < MIN_PASSWORD) {
    errors.password = `Au moins ${MIN_PASSWORD} caractères.`;
  }
  if (!errors.password && confirm !== password) errors.confirm = 'Les mots de passe ne correspondent pas.';
  return errors;
}

export function validateStore({ name, address }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Le nom est obligatoire.';
  if (!address.trim()) errors.address = 'L’adresse est obligatoire.';
  return errors;
}

export function validateEquipment({ name }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Le nom est obligatoire.';
  else if (name.trim().length > 100) errors.name = '100 caractères maximum.';
  return errors;
}

export function validateNewUser({ name, email, password }) {
  const errors = validateRegister({ name, email, password, confirm: password });
  delete errors.confirm;
  return errors;
}

// Builds the start Date from the local date + time the user picked.
export function buildStartDate(date, time) {
  if (!date || !time) return null;
  const start = new Date(`${date}T${time}:00`);
  return Number.isNaN(start.getTime()) ? null : start;
}

export function validateReservation({ date, time, duration }, now = new Date()) {
  const errors = {};
  const start = buildStartDate(date, time);
  if (!date) errors.date = 'Choisissez une date.';
  else if (!start) errors.date = 'Date invalide.';
  else if (start <= now) errors.date = 'Le début doit être dans le futur.';
  else if (start.getUTCMinutes() % 30 !== 0) errors.time = 'L’heure doit tomber sur :00 ou :30.';

  const hours = Number(duration);
  if (duration === '' || Number.isNaN(hours)) errors.duration = 'Indiquez une durée.';
  else if (hours <= 0) errors.duration = 'La durée doit être positive.';
  else if (hours > MAX_DURATION_HOURS) errors.duration = `Maximum ${MAX_DURATION_HOURS} heures (7 jours).`;
  else if ((hours * 2) % 1 !== 0) errors.duration = 'La durée doit être un multiple de 30 minutes.';
  return { errors, start: errors.date || errors.time ? null : start, hours };
}
