import React from 'react';

export type IconName =
  | 'clear'
  | 'watch'
  | 'caution'
  | 'protect'
  | 'severe'
  | 'exposure'
  | 'emissions'
  | 'home'
  | 'car'
  | 'chart'
  | 'people'
  | 'menu'
  | 'close'
  | 'check'
  | 'info'
  | 'warning'
  | 'copy'
  | 'chevron'
  | 'wind';

export interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  className = '',
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
}) => {
  const isDecorative = ariaLabel === undefined;
  const computedAriaHidden = ariaHidden !== undefined ? ariaHidden : isDecorative;

  const renderPaths = () => {
    switch (name) {
      case 'clear':
        // Check circle
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12 2.5 2.5 4.5-4.5" />
          </>
        );
      case 'watch':
        // Eye
        return (
          <>
            <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        );
      case 'caution':
        // Warning triangle
        return (
          <>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        );
      case 'protect':
        // Shield
        return (
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        );
      case 'severe':
        // Octagon alert / hazard
        return (
          <>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        );
      case 'exposure':
        // Shield outline with crosshair or respiratory shelter
        return (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="14" />
            <line x1="9" y1="11" x2="15" y2="11" />
          </>
        );
      case 'emissions':
        // Sprout / leaf
        return (
          <>
            <path d="M7 20h10" />
            <path d="M10 20c0-4.4 2-8 6-8" />
            <path d="M16 12a5 5 0 0 0-5-5 5 5 0 0 0-5 5c0 3.3 2 6 4 8" />
          </>
        );
      case 'home':
        // House
        return (
          <>
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </>
        );
      case 'car':
        // Vehicle
        return (
          <>
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-3.6-2.1-4.4A2 2 0 0 0 12.5 5h-5a2 2 0 0 0-1.4.6C5.3 6.4 4 10 4 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </>
        );
      case 'chart':
        // Bar chart
        return (
          <>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </>
        );
      case 'people':
        // Users
        return (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        );
      case 'menu':
        // 3 horizontal bars
        return (
          <>
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </>
        );
      case 'close':
        // X
        return (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        );
      case 'check':
        // Checkmark
        return <polyline points="20 6 9 17 4 12" />;
      case 'info':
        // Circle info
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </>
        );
      case 'warning':
        // Alert triangle
        return (
          <>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        );
      case 'copy':
        // Copy documents
        return (
          <>
            <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        );
      case 'chevron':
        // Chevron down
        return <polyline points="6 9 12 15 18 9" />;
      case 'wind':
        // Wind gusts
        return (
          <>
            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
            <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
            <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth="1.75"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`aw-icon aw-icon-${name} ${className}`.trim()}
      aria-hidden={computedAriaHidden ? 'true' : undefined}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {renderPaths()}
    </svg>
  );
};
