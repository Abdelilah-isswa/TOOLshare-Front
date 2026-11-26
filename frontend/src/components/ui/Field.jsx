import { useId } from 'react';

// Label + control + error message, wired together for screen readers (aria-invalid / aria-describedby).
function Field({ label, error, hint, children }) {
  const id = useId();
  const messageId = `${id}-msg`;
  const describedBy = error || hint ? messageId : undefined;
  return (
    <div className={`field${error ? ' field-invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy })}
      {(error || hint) && (
        <p id={messageId} className={error ? 'field-error' : 'field-hint'}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, ...input }) {
  return <Field label={label} error={error} hint={hint}>{(a11y) => <input {...a11y} {...input} />}</Field>;
}

export function SelectField({ label, error, hint, options, placeholder, ...select }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(a11y) => (
        <select {...a11y} {...select}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
