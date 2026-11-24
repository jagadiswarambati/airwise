import React from 'react';
import { type AppRoute } from '../../state/route';
import { Icon } from '../icons';
import { MAIN_NAV_ITEMS } from './nav-items';

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate?: (route: AppRoute) => void;
}

/**
 * Mobile and Tablet Bottom Navigation (<1024px).
 * Fixed 56px bottom bar with 5 equal columns, fully operable via keyboard (Tab, Enter/Space).
 * Uses semantic nav and ul with aria-current="page".
 */
export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  return (
    <nav aria-label="Main" className="aw-bottom-nav">
      <ul className="aw-bottom-nav-list">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <li key={item.id} className="aw-bottom-nav-item">
              <a
                href={`#/${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={`aw-bottom-nav-link ${isActive ? 'aw-bottom-nav-link-active' : ''}`}
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate(item.id);
                  }
                }}
              >
                <span className="aw-bottom-nav-icon">
                  <Icon name={item.icon} size={20} aria-hidden="true" />
                </span>
                <span className="aw-bottom-nav-label">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
