import React from 'react';
import { HourlyPoint } from '../../domain/types';

interface SparklineProps {
  hourly: HourlyPoint[];
  width?: number;
  height?: number;
  ariaLabel?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  hourly,
  width = 300,
  height = 48,
  ariaLabel = '24-hour PM2.5 trend sparkline',
}) => {
  const validPoints = hourly.filter(
    (p): p is HourlyPoint & { pm25: number } => p.pm25 !== null && !isNaN(p.pm25),
  );

  if (validPoints.length < 2) {
    return null;
  }

  const values = validPoints.map((p) => p.pm25);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const paddingY = 4;
  const usableHeight = height - paddingY * 2;
  const stepX = width / (values.length - 1);

  const coordinates = values.map((val, idx) => {
    const x = idx * stepX;
    const y = height - paddingY - ((val - minVal) / range) * usableHeight;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });

  const pathData = coordinates.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    '',
  );

  const areaData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  // Determine haze level based on latest reading
  const latestValue = values[values.length - 1];
  let level = 0;
  if (latestValue > 120) level = 4;
  else if (latestValue > 90) level = 3;
  else if (latestValue > 60) level = 2;
  else if (latestValue > 30) level = 1;

  return (
    <div className={`sparkline-container sparkline-level-${level}`} aria-label={ariaLabel}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="sparkline-svg"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`sparkline-gradient-${level}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill={`url(#sparkline-gradient-${level})`} />
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
