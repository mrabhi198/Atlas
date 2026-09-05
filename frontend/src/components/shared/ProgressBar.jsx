import React from 'react';

export default function ProgressBar({
  value,
  label,
  color = 'var(--neon-cyan)',
  thickness = '8px',
  className = '',
  ...rest
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div
      className={`atlas-progress ${className}`.trim()}
      style={{ height: thickness }}
      role="progressbar"
      aria-label={label || 'Progress'}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${clamped}% ${label || 'complete'}`}
      {...rest}
    >
      <div
        className="atlas-progress__fill"
        style={{ width: `${clamped}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  );
}