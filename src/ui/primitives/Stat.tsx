import React from 'react';

export interface StatProps {
  value: React.ReactNode;
  unit?: string;
  label: string;
  trend?: React.ReactNode;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  value,
  unit,
  label,
  trend,
  className = '',
}) => {
  return (
    <div className={`aw-stat ${className}`.trim()}>
      <div className="aw-stat-main">
        <span className="aw-stat-value">{value}</span>
        {unit && <span className="aw-stat-unit">{unit}</span>}
      </div>
      <div className="aw-stat-footer">
        <span className="aw-stat-label">{label}</span>
        {trend && <span className="aw-stat-trend">{trend}</span>}
      </div>
    </div>
  );
};
