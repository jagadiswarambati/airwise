import React from 'react';

export interface AxisPairProps {
  exposure: React.ReactNode;
  emissions: React.ReactNode;
  className?: string;
}

export const AxisPair: React.FC<AxisPairProps> = ({
  exposure,
  emissions,
  className = '',
}) => {
  return (
    <div className={`aw-axis-pair ${className}`.trim()}>
      <div className="aw-axis-card aw-axis-exposure">
        {exposure}
      </div>
      <div className="aw-axis-card aw-axis-emissions">
        {emissions}
      </div>
    </div>
  );
};
