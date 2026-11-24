import React from 'react';
import { ActionCandidate } from '../../domain/types';
import { Icon, IconName } from '../icons';

export interface ActionRowProps {
  candidate: ActionCandidate & { mustInclude?: boolean };
  rank?: number;
  timelineTime?: string;
  onSelect?: (candidate: ActionCandidate) => void;
  showAxisSummary?: boolean;
  showEffort?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  expandedContent?: React.ReactNode;
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
 * cost tag, effort tag, axis summary, and trigger button.
 */
export const ActionRow: React.FC<ActionRowProps> = ({
  candidate,
  rank,
  timelineTime,
  onSelect,
  showAxisSummary = false,
  showEffort = false,
  expandable = false,
  expanded = false,
  onToggleExpand,
  expandedContent,
}) => {
  const { action, impact, tags } = candidate;

  const handleClick = () => {
    if (expandable && onToggleExpand) {
      onToggleExpand();
    }
    if (onSelect) {
      onSelect(candidate);
    }
  };

  const expDir =
    impact.exposure.direction === 'reduces'
      ? 'lowers'
      : impact.exposure.direction === 'neutral'
        ? 'no change'
        : 'conditional';

  const emDir =
    impact.emissions.direction === 'reduces'
      ? 'lowers'
      : impact.emissions.direction === 'neutral'
        ? 'no change'
        : 'conditional';

  return (
    <div className={`aw-action-row-container ${expanded ? 'aw-action-row-expanded' : ''}`.trim()}>
      <button
        type="button"
        className="aw-action-row"
        onClick={handleClick}
        aria-expanded={expandable ? expanded : undefined}
        aria-label={`${rank ? `Priority ${rank}: ` : ''}${action.title}. ${impact.explanation}. ${expandable ? 'Toggle details' : 'Tap for details'}.`}
      >
        <div className="aw-action-row-lead">
          {rank !== undefined && (
            <span className="aw-action-rank" aria-label={`Priority ${rank}`}>
              {rank}
            </span>
          )}
          {timelineTime && (
            <span className="aw-action-time-badge">{timelineTime}</span>
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

          <div className="aw-action-row-meta flex-wrap gap-2">
            <span className="tag tag-cost">{tags.cost}</span>
            {showEffort && (
              <span className="tag tag-effort">Effort: {tags.effort}</span>
            )}
            <span className="aw-action-row-confidence">
              {formatConfidenceWord(impact.exposure.confidence)}
            </span>
          </div>

          {showAxisSummary && (
            <div className="aw-action-row-axis-summary mt-1 flex-row-center gap-2 text-xs">
              <span className="flex-row-center gap-1 text-exposure">
                <Icon name="protect" size={13} aria-hidden="true" />
                <span>Exposure: {expDir}</span>
              </span>
              <span className="text-muted" aria-hidden="true">
                ·
              </span>
              <span className="flex-row-center gap-1 text-emissions">
                <Icon name="emissions" size={13} aria-hidden="true" />
                <span>Emissions: {emDir}</span>
              </span>
            </div>
          )}
        </div>

        <div
          className={`aw-action-row-end ${expanded ? 'aw-chevron-rotated' : ''}`}
          aria-hidden="true"
        >
          <Icon name="chevron" size={16} />
        </div>
      </button>

      {expandable && expandedContent && (
        <div className="aw-action-row-expanded-panel p-3" hidden={!expanded}>
          {expandedContent}
        </div>
      )}
    </div>
  );
};

export default ActionRow;
