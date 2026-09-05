import React from 'react';

export default function Badge({ variant = 'default', className = '', children, ...rest }) {
  return (
    <span className={`atlas-badge atlas-badge--${variant} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}