import React from 'react';
import { type AppRoute } from '../../state/route';
import { Icon } from '../icons';
import { MAIN_NAV_ITEMS } from './nav-items';

interface TopNavProps {
  currentRoute: AppRoute;
  onNavigate?: (route: AppRoute) => void;
}

/**
 * Desktop Top Navigation component (>=1024px).
 * Uses semantic nav and ul with aria-current="page".
 */
export const TopNav: React.FC<TopNavProps> = ({ currentRoute, onNavigate }) => {
  return (
    <nav aria-label="Main" className="aw-top-nav">
      <ul className="aw-top-nav-list">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <li key={item.id} className="aw-top-nav-item">
              <a
                href={`#/${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={`aw-top-nav-link ${isActive ? 'aw-top-nav-link-active' : ''}`}
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate(item.id);
                  }
                }}
              >
                <Icon name={item.icon} size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
