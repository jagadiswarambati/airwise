import { type ActionCandidate, type Plan } from '../../../domain/types';
import { Icon } from '../../icons';
import { ActionRow } from '../ActionRow';

export interface TodayTopActionsProps {
  plan: Plan;
  topActions: ActionCandidate[];
  onSelectAction: (c: ActionCandidate) => void;
}

export function TodayTopActions({ plan, topActions, onSelectAction }: TodayTopActionsProps) {
  const isAi = plan.source === 'ai';

  return (
    <section className="aw-today-section" aria-label="Do these first">
      <div className="aw-today-section-header">
        <h2 className="aw-section-title">Do these first</h2>
        <span className={isAi ? 'plan-source-badge-ai' : 'plan-source-badge-standard'}>
          <Icon name={isAi ? 'exposure' : 'protect'} size={14} aria-hidden="true" />
          <span>{isAi ? 'AI-personalised' : 'Standard plan'}</span>
        </span>
      </div>

      <div className="aw-action-rows-stack">
        {topActions.map((cand, idx) => (
          <ActionRow
            key={cand.action.id}
            candidate={cand}
            rank={idx + 1}
            onSelect={onSelectAction}
          />
        ))}
      </div>
    </section>
  );
}
