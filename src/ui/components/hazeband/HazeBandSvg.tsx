import { type WakingPoint } from './model';

interface HazeBandSvgProps {
  wakingPoints: WakingPoint[];
  maxPm: number;
}

export function HazeBandSvg({ wakingPoints, maxPm }: HazeBandSvgProps) {
  const svgWidth = 640;
  const svgHeight = 175;
  const marginLeft = 20;
  const marginRight = 20;
  const plotWidth = svgWidth - marginLeft - marginRight;
  const count = Math.max(1, wakingPoints.length);
  const stepX = plotWidth / count;
  const barWidth = Math.max(10, stepX - 6);

  const baselineY = 125;
  const maxBarH = 75;
  const maxScalePm = Math.max(80, maxPm * 1.15);

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="aw-hazeband-svg"
      preserveAspectRatio="none"
    >
      <line
        x1={marginLeft}
        y1={baselineY}
        x2={svgWidth - marginRight}
        y2={baselineY}
        className="aw-hazeband-axis"
      />

      {wakingPoints.map((pt, idx) => {
        const x = marginLeft + idx * stepX + (stepX - barWidth) / 2;
        const barH = Math.max(14, Math.round((pt.pm25 / maxScalePm) * maxBarH));
        const y = baselineY - barH;
        const isTick = pt.hour % 3 === 0;

        return (
          <g
            key={pt.hour}
            className={`aw-haze-group aw-haze-level-${pt.level} ${
              pt.isRadarSlot ? 'aw-haze-radar-slot' : ''
            }`}
          >
            {pt.isRadarSlot && (
              <rect
                x={x - 2}
                y={22}
                width={barWidth + 4}
                height={baselineY - 22}
                className="aw-haze-radar-bg"
                rx={3}
              />
            )}

            <rect x={x} y={y} width={barWidth} height={barH} rx={3} className="aw-haze-bar" />

            {pt.marker && (
              <text x={x + barWidth / 2} y={16} textAnchor="middle" className="aw-haze-marker-text">
                {pt.marker}
              </text>
            )}

            {pt.isNow && (
              <g className="aw-haze-now-group">
                <circle cx={x + barWidth / 2} cy={baselineY + 8} r={3} className="aw-haze-now-dot" />
                <text x={x + barWidth / 2} y={baselineY + 22} textAnchor="middle" className="aw-haze-now-text">
                  Now
                </text>
              </g>
            )}

            {isTick && !pt.isNow && (
              <text x={x + barWidth / 2} y={baselineY + 22} textAnchor="middle" className="aw-haze-tick-text">
                {pt.timeLabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
