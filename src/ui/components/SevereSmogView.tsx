import React from 'react';
import { ActionCandidate, AirSnapshot, Plan } from '../../domain/types';
import { ActionDetailModal } from './ActionDetailModal';
import { Icon } from '../icons';

interface SevereSmogViewProps {
  snapshot: AirSnapshot;
  plan: Plan;
  onExitSevereView?: () => void;
  isManualOverride?: boolean;
  onToggleManualOverride?: () => void;
}

export const SevereSmogView: React.FC<SevereSmogViewProps> = ({
  snapshot,
  plan,
  onExitSevereView,
  isManualOverride = false,
  onToggleManualOverride,
}) => {
  const [selectedAction, setSelectedAction] = React.useState<ActionCandidate | null>(null);

  // Severe mode displays at most 3 actions
  const topActions = plan.topActions.slice(0, 3);
  const pm25Val = snapshot.pm25.now ? Math.round(snapshot.pm25.now) : '150+';

  return (
    <div className="severe-container" role="alert" aria-live="assertive">
      <div className="severe-header-row">
        <span className="severe-badge">
          <Icon name="severe" size={16} aria-hidden="true" />
          <span>SEVERE SMOG ALERT</span>
        </span>

        {isManualOverride && onToggleManualOverride && (
          <button
            type="button"
            onClick={onToggleManualOverride}
            className="severe-override-btn"
          >
            Turn off manual override
          </button>
        )}
      </div>

      <div>
        <h1 className="severe-title">Severe Air Quality Hazard</h1>
        <p className="severe-subtext">
          Current outdoor PM2.5 is <strong>{pm25Val} µg/m³</strong>. Outdoor exertion is hazardous.
          Stay indoors and seal living spaces.
        </p>
      </div>

      <div className="severe-actions-group">
        <h2 className="severe-section-title">Top 3 Immediate Protections</h2>
        {topActions.map((cand) => (
          <div key={cand.action.id} className="severe-card">
            <div className="severe-card-header">
              <div className="severe-card-title">
                {cand.action.title}
              </div>
              <span className="severe-card-tag">
                {cand.tags.cost}
              </span>
            </div>

            <p className="severe-card-desc">
              {cand.impact.explanation}
            </p>

            <button
              type="button"
              onClick={() => setSelectedAction(cand)}
              className="severe-action-btn"
            >
              Action Guidance &amp; Impact
            </button>
          </div>
        ))}
      </div>

      {onExitSevereView && (
        <button
          type="button"
          onClick={onExitSevereView}
          className="aw-btn aw-btn-secondary"
        >
          Show full plan
        </button>
      )}

      {selectedAction && (
        <ActionDetailModal
          candidate={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
};
