import React from 'react';
import { ActionCandidate } from '../../domain/types';

interface ActionCardProps {
  candidate: ActionCandidate;
  onSelect: (candidate: ActionCandidate) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ candidate, onSelect }) => {
  const { action, impact, tags } = candidate;

  return (
    <button
      type="button"
      className="action-card"
      onClick={() => onSelect(candidate)}
      aria-label={`Action: ${action.title}. Tap for full dual-axis impact details.`}
    >
      <div className="action-header">
        <div className="action-title">{action.title}</div>
        <span className="tag tag-cost">{tags.cost}</span>
      </div>

      <div className="action-why">{candidate.impact.explanation}</div>

      <div className="action-tags">
        {candidate.isMandatory && <span className="tag tag-urgent">Required</span>}
        {impact.exposure.direction === 'reduces' && (
          <span className="tag tag-exposure">Exposure ↓</span>
        )}
        {impact.emissions.direction === 'reduces' && (
          <span className="tag tag-emissions">
            Emissions ↓ {impact.emissions.value ? `(${impact.emissions.value.vkm} vkm)` : ''}
          </span>
        )}
        <span className="tag tag-cost">{tags.effort}</span>
      </div>
    </button>
  );
};

