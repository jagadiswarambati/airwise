import React from 'react';

export type BannerVariant = 'info' | 'warning' | 'severe';

export interface BannerProps {
  variant?: BannerVariant;
  role?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  role = 'status',
  children,
  icon,
  className = '',
}) => {
  return (
    <div
      role={role}
      className={`aw-banner aw-banner-${variant} ${className}`.trim()}
    >
      {icon && <span className="aw-banner-icon" aria-hidden="true">{icon}</span>}
      <div className="aw-banner-content">{children}</div>
    </div>
  );
};
