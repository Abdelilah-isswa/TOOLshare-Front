import { buildStartDate, validateLogin, validateRegister, validateReservation } from './validators';

describe('validateLogin / validateRegister', () => {
  it('requires email and password and checks the email format', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({ email: 'L’email est obligatoire.', password: 'Le mot de passe est obligatoire.' });
    expect(validateLogin({ email: 'nope', password: 'x' }).email).toMatch(/invalide/);
    expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({});
  });

  it('checks password length and confirmation', () => {
    const base = { name: 'Ada', email: 'a@b.co' };
    expect(validateRegister({ ...base, password: 'short', confirm: 'short' }).password).toMatch(/8 caractères/);
    expect(validateRegister({ ...base, password: 'longenough', confirm: 'different' }).confirm).toMatch(/correspondent/);
    expect(validateRegister({ ...base, password: 'longenough', confirm: 'longenough' })).toEqual({});
  });
});

describe('validateReservation', () => {
  const now = new Date('2030-01-01T08:00:00');
  const good = { date: '2030-01-02', time: '10:00', duration: '2' };

  it('accepts a future slot on a 30-minute boundary', () => {
    const { errors, start, hours } = validateReservation(good, now);
    expect(errors).toEqual({});
    expect(start).toEqual(buildStartDate('2030-01-02', '10:00'));
    expect(hours).toBe(2);
  });

  it('rejects missing or past dates', () => {
    expect(validateReservation({ ...good, date: '' }, now).errors.date).toBeDefined();
    expect(validateReservation({ ...good, date: '2029-12-31' }, now).errors.date).toMatch(/futur/);
  });

  it('rejects invalid durations', () => {
    expect(validateReservation({ ...good, duration: '' }, now).errors.duration).toBeDefined();
    expect(validateReservation({ ...good, duration: '0' }, now).errors.duration).toMatch(/positive/);
    expect(validateReservation({ ...good, duration: '1.3' }, now).errors.duration).toMatch(/30 minutes/);
    expect(validateReservation({ ...good, duration: '169' }, now).errors.duration).toMatch(/168/);
    expect(validateReservation({ ...good, duration: '0.5' }, now).errors).toEqual({});
  });
});
