import React from 'react';

export default function Spinner({ size = 'md', label, className = '', ...rest }) {
  const sizeClass = size === 'lg' ? 'atlas-spinner--lg' : '';
  return (
    <span
      className={`atlas-spinner ${sizeClass} ${className}`.trim()}
      role="status"
      aria-label={label || undefined}
      {...rest}
    />
  );
}