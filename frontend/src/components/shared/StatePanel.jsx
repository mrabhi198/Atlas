import React from 'react';
import { Inbox, TriangleAlert } from 'lucide-react';
import Spinner from './Spinner';

export default function StatePanel({
  variant = 'loading',
  title,
  message,
  action,
  className = '',
  ...rest
}) {
  const role = variant === 'error' ? 'alert' : 'status';

  return (
    <div className={`atlas-state ${className}`.trim()} role={role} {...rest}>
      {variant === 'loading' ? (
        <Spinner size="lg" />
      ) : variant === 'error' ? (
        <TriangleAlert size={36} style={{ color: 'var(--neon-red)' }} aria-hidden="true" />
      ) : (
        <Inbox size={36} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
      )}

      {title && <div className="atlas-state__title">{title}</div>}
      {message && <div className="atlas-state__message">{message}</div>}
      {action}
    </div>
  );
}