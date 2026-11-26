export default function Button({ variant = 'primary', loading = false, children, disabled, type = 'button', ...props }) {
  return (
    <button type={type} className={`btn btn-${variant}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? 'Veuillez patienter…' : children}
    </button>
  );
}
