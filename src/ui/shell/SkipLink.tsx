import React from 'react';

/**
 * Accessible Skip Link component.
 * Placed first in the DOM so keyboard and screen reader users can immediately jump to main content.
 */
export const SkipLink: React.FC = () => {
  return (
    <a href="#main" className="aw-skip-link">
      Skip to main content
    </a>
  );
};
