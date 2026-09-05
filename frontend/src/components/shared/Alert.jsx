import React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle
};

const ROLES = {
  danger: 'alert',
  success: 'status'
};

export default function Alert({
  variant = 'info',
  icon,
  title,
  children,
  role,
  className = '',
  ...rest
}) {
  const Icon = icon || ICONS[variant];
  return (
    <div
      className={`atlas-alert atlas-alert--${variant} ${className}`.trim()}
      role={role ?? ROLES[variant]}
      {...rest}
    >
      {Icon && <Icon size={15} className="atlas-alert__icon" aria-hidden="true" />}
      <div className="atlas-alert__content">
        {title && <div style={{ fontWeight: 600, marginBottom: '2px' }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}