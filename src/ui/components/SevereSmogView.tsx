import React, { useState, useEffect } from 'react';
import { ActionCandidate, AirSnapshot, Plan } from '../../domain/types';
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

/**
 * SevereSmogView: Calm, high-legibility Severe Smog mode.
 * Single column layout, high-contrast severe theme, base text >= 1.25rem,
 * level word in sentence case, PM2.5 with unit, up to 3 actions (mustInclude first),
 * primary "Show full plan" button, visible "Turn off severe view" button.
 * Announces entry ONCE via LiveRegion without role="alert" or aria-live="assertive" on container.
 */
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

  // Announce entry ONCE through LiveRegion
  useEffect(() => {
    announce('Severe air for your household. Showing the three most important actions.');
  }, []);

  // Sort mustInclude (mandatory) actions first, take up to 3
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
      {/* 1. Header Information */}
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

      {/* 2. Top 3 Immediate Actions (MustInclude first) */}
      <section className="aw-severe-actions-section" aria-label="Immediate high-priority protections">
        <h2 className="aw-severe-section-title">Immediate Protections</h2>
        <div className="aw-severe-actions-list">
          {topActions.map((cand) => (
            <article key={cand.action.id} className="aw-severe-action-item">
              <div className="aw-severe-action-head">
                <h3 className="aw-severe-action-title">{cand.action.title}</h3>
                <span className="tag tag-cost">{cand.tags.cost}</span>
              </div>
              <p className="aw-severe-action-why">{cand.impact.explanation}</p>
              <button
                type="button"
                className="aw-btn aw-btn-quiet aw-severe-action-btn"
                onClick={() => setSelectedAction(cand)}
                aria-label={`View guidance details for ${cand.action.title}`}
              >
                Action guidance &amp; details →
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Action Controls */}
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

      {selectedAction && (
        <ActionDetailModal
          candidate={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
};
