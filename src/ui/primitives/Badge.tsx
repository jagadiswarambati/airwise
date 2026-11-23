import React from 'react';

export type BadgeType = 'data-type' | 'freshness' | 'plan-source' | 'level' | 'default';

export interface BadgeProps {
  type?: BadgeType;
  variant?: string; // e.g. 'fresh', 'aging', 'stale', '0'..'4', 'ai', 'standard'
  children: React.ReactNode;
  className?: string;
  role?: string;
  'aria-label'?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  type = 'default',
  variant,
  children,
  className = '',
  role = 'status',
  'aria-label': ariaLabel,
}) => {
  const variantClass = variant ? `aw-badge-${type}-${variant}` : '';
  return (
    <span
      role={role}
      aria-label={ariaLabel}
      className={`aw-badge aw-badge-${type} ${variantClass} ${className}`.trim()}
    >
      {children}
    </span>
  );
};
