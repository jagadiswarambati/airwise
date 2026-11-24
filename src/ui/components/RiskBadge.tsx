import React from 'react';
import { type RiskLevel } from '../../domain/types';
import { LEVEL_NAMES } from '../../domain/levels';
import { Icon, type IconName } from '../icons';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const LEVEL_ICON_NAMES: Record<RiskLevel, IconName> = {
  0: 'clear',
  1: 'watch',
  2: 'caution',
  3: 'protect',
  4: 'severe',
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const name = LEVEL_NAMES[level];
  const iconName = LEVEL_ICON_NAMES[level];

  return (
    <span
      className={`risk-badge risk-level-${level} ${className}`.trim()}
      role="status"
      aria-label={`Air quality risk level: ${name}`}
    >
      <Icon name={iconName} size={14} aria-hidden="true" />
      <span>{name}</span>
    </span>
  );
};
