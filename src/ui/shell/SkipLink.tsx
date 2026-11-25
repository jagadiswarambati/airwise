import React from 'react';

/**
 * Accessible Skip Link component.
 * Placed first in the DOM so keyboard and screen reader users can immediately jump to main content.
 * Prevents hash change to avoid interfering with hash-based route navigation.
 */
export const SkipLink: React.FC = () => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById('main') || document.querySelector('main');
    if (main instanceof HTMLElement) {
      if (main.tabIndex < 0) {
        main.tabIndex = -1;
      }
      main.focus({ preventScroll: false });
      if (typeof main.scrollIntoView === 'function') {
        main.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <a href="#main" className="aw-skip-link" onClick={handleClick}>
      Skip to main content
    </a>
  );
};
