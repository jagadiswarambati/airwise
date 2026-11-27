import React, { useState, useEffect } from 'react';
import { type ActionCandidate, type AirSnapshot, type Plan } from '../../domain/types';
import { ActionDetailModal } from './ActionDetailModal';
import { announce } from './liveRegionAnnouncer';
import { Icon } from '../icons';

export interface SevereSmogViewProps {
  snapshot: AirSnapshot;
  plan: Plan;
  onShowFullPlan?: () => void;
  onExitSevere?: () => void;
  onExitSevereView?: () => void;
  isManualOverride?: boolean;
  onToggleManualOverride?: () => void;
}

const SevereActionItem: React.FC<{
  candidate: ActionCandidate;
  onSelect: (cand: ActionCandidate) => void;
}> = ({ candidate, onSelect }) => (
  <article className="aw-severe-action-item">
    <div className="aw-severe-action-head">
      <h3 className="aw-severe-action-title">{candidate.action.title}</h3>
      <span className="tag tag-cost">{candidate.tags.cost}</span>
    </div>
    <p className="aw-severe-action-why">{candidate.impact.explanation}</p>
    <button
      type="button"
      className="aw-btn aw-btn-quiet aw-severe-action-btn"
      onClick={() => onSelect(candidate)}
      aria-label={`Action guidance & details for ${candidate.action.title}`}
    >
      Action guidance &amp; details →
    </button>
  </article>
);

const SevereControls: React.FC<{
  onShowFullPlan?: () => void;
  onExitSevere?: () => void;
  onExitSevereView?: () => void;
  isManualOverride?: boolean;
  onToggleManualOverride?: () => void;
}> = ({
  onShowFullPlan,
  onExitSevere,
  onExitSevereView,
  isManualOverride,
  onToggleManualOverride,
}) => (
  <div className="aw-severe-controls">
    <button
      type="button"
      className="aw-btn aw-btn-primary aw-severe-btn-primary"
      onClick={onShowFullPlan || onExitSevereView}
    >
      Show full plan
    </button>

    <button
      type="button"
      className="aw-btn aw-btn-secondary aw-severe-btn-exit"
      onClick={
        isManualOverride && onToggleManualOverride
          ? onToggleManualOverride
          : onExitSevere || onExitSevereView
      }
    >
      {isManualOverride ? 'Turn off manual override' : 'Turn off severe view'}
    </button>
  </div>
);

export const SevereSmogView: React.FC<SevereSmogViewProps> = ({
  snapshot,
  plan,
  onShowFullPlan,
  onExitSevere,
  onExitSevereView,
  isManualOverride = false,
  onToggleManualOverride,
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);

  useEffect(() => {
    announce('Severe air for your household. Showing the three most important actions.');
  }, []);

  const sortedActions = [...plan.topActions].sort((a, b) => {
    if (a.isMandatory && !b.isMandatory) return -1;
    if (!a.isMandatory && b.isMandatory) return 1;
    return 0;
  });
  const topActions = sortedActions.slice(0, 3);

  const pm25Val =
    snapshot.pm25.now !== null && !isNaN(snapshot.pm25.now)
      ? Math.round(snapshot.pm25.now)
      : '150+';

  return (
    <div className="aw-severe-view" data-theme="severe">
      <header className="aw-severe-header">
        <div className="aw-severe-level-row">
          <Icon name="severe" size={28} aria-hidden="true" />
          <h1 className="aw-severe-level-title">Severe for your household</h1>
        </div>

        <div className="aw-severe-reading">
          <span className="aw-severe-pm25-val">{pm25Val}</span>
          <span className="aw-severe-pm25-unit">µg/m³ PM2.5</span>
        </div>

        <p className="aw-severe-lead">
          Outdoor particulate pollution has reached severe levels. Stay indoors, keep windows
          closed, and maintain clean indoor living spaces.
        </p>
      </header>

      <section className="aw-severe-actions-section" aria-label="Immediate high-priority protections">
        <h2 className="aw-severe-section-title">Immediate Protections</h2>
        <div className="aw-severe-actions-list">
          {topActions.map((cand) => (
            <SevereActionItem key={cand.action.id} candidate={cand} onSelect={setSelectedAction} />
          ))}
        </div>
      </section>

      <SevereControls
        onShowFullPlan={onShowFullPlan}
        onExitSevere={onExitSevere}
        onExitSevereView={onExitSevereView}
        isManualOverride={isManualOverride}
        onToggleManualOverride={onToggleManualOverride}
      />

      {selectedAction && (
        <ActionDetailModal
          candidate={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
};
