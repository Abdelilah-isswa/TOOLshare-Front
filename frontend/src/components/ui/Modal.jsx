import { useEffect, useId, useRef } from 'react';

export default function Modal({ title, onClose, children }) {
  const titleId = useId();
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.(); // give focus back to the button that opened the dialog
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
