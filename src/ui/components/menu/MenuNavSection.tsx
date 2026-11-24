import React from 'react';
import { type AppRoute, navigate } from '../../../state/route';
import { Icon } from '../../icons';

export function MenuNavSection({ onClose }: { onClose: () => void }) {
  const handleLinkClick = (target: AppRoute) => (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    navigate(target);
  };

  return (
    <section className="aw-menu-section" aria-label="Information & Legal">
      <h3 className="aw-menu-section-title">Information</h3>
      <ul className="aw-menu-nav-list">
        <li>
          <a href="#/about" className="aw-menu-nav-link" onClick={handleLinkClick('about')}>
            <span>About AirWise</span>
            <Icon name="chevron" size={16} aria-hidden="true" />
          </a>
        </li>
        <li>
          <a href="#/privacy" className="aw-menu-nav-link" onClick={handleLinkClick('privacy')}>
            <span>Privacy Policy</span>
            <Icon name="chevron" size={16} aria-hidden="true" />
          </a>
        </li>
        <li>
          <a href="#/terms" className="aw-menu-nav-link" onClick={handleLinkClick('terms')}>
            <span>Terms of Use</span>
            <Icon name="chevron" size={16} aria-hidden="true" />
          </a>
        </li>
      </ul>
    </section>
  );
}
