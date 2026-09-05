import React from 'react';

const VARIANTS = {
  default: '',
  accent: 'atlas-btn--accent',
  secondary: 'atlas-btn--secondary',
  danger: 'atlas-btn--danger',
  ghost: 'atlas-btn--ghost'
};

const SIZES = {
  sm: 'atlas-btn--sm',
  icon: 'atlas-btn--icon'
};

export default function Button({
  variant = 'default',
  size,
  block = false,
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...rest
}) {
  const classes = [
    'atlas-btn',
    VARIANTS[variant] || '',
    SIZES[size] || '',
    block ? 'atlas-btn--block' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="atlas-spinner atlas-btn__spinner" aria-hidden="true" />}
      {icon}
      {children}
    </button>
  );
}