import { type WakingPoint } from './model';

export function HazeBandTable({ wakingPoints }: { wakingPoints: WakingPoint[] }) {
  return (
    <details className="aw-haze-disclosure">
      <summary className="aw-haze-disclosure-summary">Show hourly values</summary>
      <div className="aw-haze-table-wrap">
        <table className="aw-haze-table">
          <caption>Hourly forecast for waking day</caption>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">PM2.5 (µg/m³)</th>
              <th scope="col">Level</th>
            </tr>
          </thead>
          <tbody>
            {wakingPoints.map((pt) => (
              <tr key={pt.hour}>
                <td>{pt.timeLabel}</td>
                <td>{Math.round(pt.pm25)} µg/m³</td>
                <td>{pt.levelWord}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
