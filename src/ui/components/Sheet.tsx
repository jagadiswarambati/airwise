import React from 'react';
import { Dialog, type DialogProps } from './Dialog';
import { Icon } from '../icons';

export interface SheetProps extends Omit<DialogProps, 'children'> {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  titleId?: string;
}

/**
 * Responsive Sheet component.
 * Displays as a bottom sheet on mobile (<768px) and a centered modal dialog on desktop (>=768px).
 */
export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className = '',
  overlayClassName = '',
  titleId: customTitleId,
}) => {
  const titleId =
    customTitleId || `sheet-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      className={`aw-sheet ${className}`}
      overlayClassName={overlayClassName}
    >
      {/* Visual drag handle on mobile */}
      <div className="aw-sheet-handle" aria-hidden="true" />

      {/* Header */}
      <div className="aw-sheet-header">
        <div className="aw-sheet-header-text">
          <h2 id={titleId} className="aw-sheet-title">
            {title}
          </h2>
          {subtitle && <p className="aw-sheet-subtitle">{subtitle}</p>}
        </div>
        <button
          type="button"
          className="aw-btn-icon"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          <Icon name="close" size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="aw-sheet-body">{children}</div>

      {/* Optional Footer */}
      {footer && <div className="aw-sheet-footer">{footer}</div>}
    </Dialog>
  );
};
