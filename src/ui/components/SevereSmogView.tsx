import React from 'react';
import { ActionCandidate, AirSnapshot, Plan } from '../../domain/types';
import { ActionDetailModal } from './ActionDetailModal';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            backgroundColor: '#a855f7',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.875rem',
            letterSpacing: '0.05em',
          }}
        >
          🚨 SEVERE SMOG ALERT
        </span>

        {isManualOverride && onToggleManualOverride && (
          <button
            type="button"
            onClick={onToggleManualOverride}
            style={{ color: '#e9d5ff', textDecoration: 'underline', fontSize: '0.85rem' }}
          >
            Turn off manual override
          </button>
        )}
      </div>

      <div>
        <h1 className="severe-title">Severe Air Quality Hazard</h1>
        <p style={{ fontSize: '1.25rem', marginTop: '6px', color: '#f3e8ff' }}>
          Current outdoor PM2.5 is <strong>{pm25Val} µg/m³</strong>. Outdoor exertion is hazardous.
          Stay indoors and seal living spaces.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.15rem', color: '#d8b4fe' }}>Top 3 Immediate Protections</h2>
        {topActions.map((cand) => (
          <div key={cand.action.id} className="severe-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {cand.action.title}
              </div>
              <span
                style={{
                  backgroundColor: '#7e22ce',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {cand.tags.cost}
              </span>
            </div>

            <p style={{ fontSize: '1rem', color: '#f5f3ff', margin: '4px 0' }}>
              {cand.impact.explanation}
            </p>

            <button
              type="button"
              onClick={() => setSelectedAction(cand)}
              style={{
                alignSelf: 'flex-start',
                marginTop: '8px',
                color: '#ffffff',
                backgroundColor: '#9333ea',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Why &amp; Dual-Axis Impact →
            </button>
          </div>
        ))}
      </div>

      {onExitSevereView && (
        <button
          type="button"
          onClick={onExitSevereView}
          style={{
            marginTop: 'auto',
            padding: '16px',
            backgroundColor: '#ffffff',
            color: '#581c87',
            fontSize: '1.1rem',
            fontWeight: 800,
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          Show Full Plan &amp; Timeline
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

