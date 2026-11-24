import React from 'react';

export interface FieldsetProps {
  id?: string;
  legend: string;
  helperText?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const Fieldset: React.FC<FieldsetProps> = ({
  id,
  legend,
  helperText,
  error,
  className = '',
  children,
}) => {
  const helperId = helperText && id ? `${id}-helper` : undefined;
  const errorId = error && id ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      id={id}
      aria-describedby={describedBy}
      className={`aw-fieldset ${error ? 'aw-fieldset-has-error' : ''} ${className}`.trim()}
    >
      <legend className="aw-legend">{legend}</legend>

      {helperText && (
        <p id={helperId} className="aw-fieldset-helper">
          {helperText}
        </p>
      )}

      <div className="aw-fieldset-content">{children}</div>

      {error && (
        <p id={errorId} className="aw-fieldset-error" role="status">
          {error}
        </p>
      )}
    </fieldset>
  );
};

export default Fieldset;
