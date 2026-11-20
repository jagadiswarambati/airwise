import React from 'react';
import { RiskLevel } from '../../domain/types';
import { LEVEL_NAMES } from '../../domain/levels';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const LEVEL_ICONS: Record<RiskLevel, string> = {
  0: '●', // Clear (Green)
  1: '▲', // Watch (Yellow)
  2: '◆', // Caution (Orange)
  3: '■', // Protect (Red)
  4: '✦', // Severe (Purple)
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const name = LEVEL_NAMES[level];
  const icon = LEVEL_ICONS[level];

  return (
    <span
      className={`risk-badge risk-level-${level} ${className}`}
      role="status"
      aria-label={`Air quality risk level: ${name}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{name}</span>
    </span>
  );
};

