import React from 'react';

export interface ChipProps {
  label: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  icon,
  className = '',
  'aria-label': ariaLabel,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`aw-chip ${selected ? 'aw-chip-selected' : ''} ${className}`.trim()}
    >
      {icon && <span className="aw-chip-icon" aria-hidden="true">{icon}</span>}
      <span className="aw-chip-label">{label}</span>
    </button>
  );
};
