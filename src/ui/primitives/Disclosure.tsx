import React from 'react';

export interface DisclosureProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export const Disclosure: React.FC<DisclosureProps> = ({
  title,
  children,
  defaultOpen = false,
  className = '',
  badge,
}) => {
  return (
    <details className={`aw-disclosure ${className}`.trim()} open={defaultOpen}>
      <summary className="aw-disclosure-summary">
        <span className="aw-disclosure-title">{title}</span>
        {badge && <span className="aw-disclosure-badge">{badge}</span>}
      </summary>
      <div className="aw-disclosure-content">
        {children}
      </div>
    </details>
  );
};
