import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, className = '', ...rest }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusable = overlayRef.current?.querySelector(focusableSelector);
    firstFocusable?.focus();

    const prevActive = document.activeElement;
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="atlas-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
    >
      <div
        className={`atlas-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title || undefined}
        {...rest}
      >
        {title && <h2 className="atlas-modal__title">{title}</h2>}

        <button type="button" className="atlas-modal__close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div>{children}</div>

        {footer && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}