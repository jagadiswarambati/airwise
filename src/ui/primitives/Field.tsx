import React from 'react';

export interface FieldProps {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface AccessibleFieldProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

function getEnhancedChild(
  children: React.ReactNode,
  id: string,
  describedBy?: string,
  error?: string,
) {
  if (!React.isValidElement<AccessibleFieldProps>(children)) {
    return children;
  }
  const childProps = children.props;
  return React.cloneElement(children, {
    id: childProps.id || id,
    'aria-describedby':
      [childProps['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : undefined,
  });
}

export const Field: React.FC<FieldProps> = ({
  id,
  label,
  helperText,
  error,
  required,
  className = '',
  children,
}) => {
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  const enhancedChild = getEnhancedChild(children, id, describedBy, error);

  return (
    <div className={`aw-field ${error ? 'aw-field-has-error' : ''} ${className}`.trim()}>
      <label htmlFor={id} className="aw-field-label">
        <span className="aw-field-label-text">{label}</span>
        {required && (
          <span className="aw-field-required" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>

      {helperText && (
        <p id={helperId} className="aw-field-helper">
          {helperText}
        </p>
      )}

      <div className="aw-field-control">{enhancedChild}</div>

      {error && (
        <p id={errorId} className="aw-field-error" role="status">
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;
