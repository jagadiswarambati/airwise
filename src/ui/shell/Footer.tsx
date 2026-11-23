import React from 'react';
import { AppRoute } from '../../state/route';
import { REPO_URL, DISCLAIMER_TEXT } from '../../config/site';
import { Icon } from '../icons';

interface FooterProps {
  onNavigate?: (route: AppRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleLinkClick = (route: AppRoute) => (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(route);
    }
  };

  return (
    <footer className="aw-footer">
      <div className="aw-container aw-footer-inner">
        <div className="aw-footer-brand-section">
          <div className="aw-footer-brand">
            <Icon name="wind" size={20} aria-hidden="true" />
            <span className="aw-footer-title">AirWise</span>
          </div>
          <p className="aw-footer-disclaimer">{DISCLAIMER_TEXT}</p>
        </div>

        <nav aria-label="Footer" className="aw-footer-nav">
          <ul className="aw-footer-links">
            <li>
              <a
                href="#/about"
                className="aw-footer-link"
                onClick={handleLinkClick('about')}
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#/privacy"
                className="aw-footer-link"
                onClick={handleLinkClick('privacy')}
              >
                Privacy
              </a>
            </li>
            <li>
              <a
                href="#/terms"
                className="aw-footer-link"
                onClick={handleLinkClick('terms')}
              >
                Terms
              </a>
            </li>
            <li>
              <a
                href="#/today"
                className="aw-footer-link"
                onClick={handleLinkClick('today')}
              >
                Data sources
              </a>
            </li>
            <li>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="aw-footer-link aw-footer-github-link"
              >
                <span>GitHub ↗</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};
