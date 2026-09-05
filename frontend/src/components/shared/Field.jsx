import React, { useId } from 'react';

export default function Field({
  label,
  hint,
  error,
  required,
  as: Control = 'input',
  className = '',
  icon,
  children,
  id: externalId,
  ...rest
}) {
  const autoId = useId();
  const id = externalId || rest.name || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const controlProps = {
    ...rest,
    id,
    required: required || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: `atlas-input ${rest.className || ''}`.trim()
  };

  const control = (
    <Control {...controlProps}>{children}</Control>
  );

  return (
    <div className={`atlas-field ${className}`.trim()}>
      {label && (
        <label className="atlas-label" htmlFor={id}>
          {label}
          {required && (
            <span className="atlas-label__req" aria-hidden="true"> *</span>
          )}
        </label>
      )}

      {icon ? (
        <div style={{ position: 'relative' }}>
          {icon}
          {control}
        </div>
      ) : (
        control
      )}

      {hint && (
        <span className="atlas-hint" id={hintId}>{hint}</span>
      )}

      {error && (
        <span className="atlas-field__error" id={errorId} role="alert">{error}</span>
      )}
    </div>
  );
}