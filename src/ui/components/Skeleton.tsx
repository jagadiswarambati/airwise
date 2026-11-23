import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'rect';
  count?: number;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'card',
  count = 1,
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading content..."
      className={`aw-skeleton-group ${className}`}
    >
      {items.map((key) => (
        <div
          key={key}
          className={`aw-skeleton aw-skeleton-${variant}`}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};
