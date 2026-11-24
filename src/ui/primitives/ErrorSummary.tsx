import React, { useEffect, useRef } from 'react';
import { Icon } from '../icons';

export interface ErrorItem {
  fieldId: string;
  message: string;
}

export interface ErrorSummaryProps {
  errors: ErrorItem[];
  title?: string;
  className?: string;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  title,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0) {
      containerRef.current?.focus();
    }
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, fieldId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(fieldId);
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const summaryTitle =
    title ||
    (errors.length === 1
      ? 'There is 1 problem with your information'
      : `There are ${errors.length} problems with your information`);

  return (
    <div
      ref={containerRef}
      role="alert"
      tabIndex={-1}
      className={`aw-error-summary card card-callout-warning mb-4 ${className}`.trim()}
      aria-labelledby="error-summary-heading"
    >
      <h2
        id="error-summary-heading"
        className="aw-error-summary-title text-base font-bold flex-row-center gap-2 mb-2"
      >
        <Icon name="warning" size={20} aria-hidden="true" />
        <span>{summaryTitle}</span>
      </h2>

      <ul className="aw-error-summary-list">
        {errors.map((err, idx) => (
          <li key={idx} className="aw-error-summary-item mb-1">
            <a
              href={`#${err.fieldId}`}
              className="aw-error-summary-link text-sm font-semibold"
              onClick={(e) => handleLinkClick(e, err.fieldId)}
            >
              {err.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ErrorSummary;
