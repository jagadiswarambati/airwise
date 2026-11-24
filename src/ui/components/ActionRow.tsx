import React from 'react';
import { ActionCandidate } from '../../domain/types';
import { Icon, IconName } from '../icons';

export interface ActionRowProps {
  candidate: ActionCandidate & { mustInclude?: boolean };
  rank?: number;
  timelineTime?: string;
  onSelect: (candidate: ActionCandidate) => void;
}

function getCategoryIcon(category: string): IconName {
  switch (category) {
    case 'indoor':
      return 'home';
    case 'personal':
      return 'protect';
    case 'mobility':
      return 'car';
    case 'community':
      return 'chart';
    default:
      return 'protect';
  }
}

function formatConfidenceWord(confidence: string): string {
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
    default:
      return `${confidence} confidence`;
  }
}

/**
 * ActionRow: Accessible divided list item representing an action candidate.
 * Includes rank (1-3) or timeline time badge, category icon, title, one-line explanation,
 * cost tag, confidence in words, must-include badge, and chevron trigger.
 */
export const ActionRow: React.FC<ActionRowProps> = ({
  candidate,
  rank,
  timelineTime,
  onSelect,
}) => {
  const { action, impact, tags } = candidate;

  return (
    <button
      type="button"
      className="aw-action-row"
      onClick={() => onSelect(candidate)}
      aria-label={`${rank ? `Priority ${rank}: ` : ''}${action.title}. ${impact.explanation}. Tap for details.`}
    >
      <div className="aw-action-row-lead">
        {rank !== undefined && (
          <span className="aw-action-rank" aria-label={`Priority ${rank}`}>
            {rank}
          </span>
        )}
        {timelineTime && (
          <span className="aw-action-time-badge">
            {timelineTime}
          </span>
        )}
        <div className="aw-action-row-icon" aria-hidden="true">
          <Icon name={getCategoryIcon(action.category)} size={20} />
        </div>
      </div>

      <div className="aw-action-row-body">
        <div className="aw-action-row-title-row">
          <span className="aw-action-row-title">{action.title}</span>
          {(candidate.isMandatory || candidate.mustInclude) && (
            <span className="tag tag-urgent">Mandatory</span>
          )}
        </div>
        <p className="aw-action-row-why">{impact.explanation}</p>
        <div className="aw-action-row-meta">
          <span className="tag tag-cost">{tags.cost}</span>
          <span className="aw-action-row-confidence">
            {formatConfidenceWord(impact.exposure.confidence)}
          </span>
        </div>
      </div>

      <div className="aw-action-row-end" aria-hidden="true">
        <Icon name="chevron" size={16} />
      </div>
    </button>
  );
};
