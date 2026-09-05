import React from 'react';

export default function Skeleton({ width = '100%', height = '16px', style, className = '', ...rest }) {
  return (
    <div
      className={`atlas-skeleton ${className}`.trim()}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}