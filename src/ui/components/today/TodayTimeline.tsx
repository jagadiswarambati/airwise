import { type ActionCandidate, type Plan } from '../../../domain/types';
import { ActionRow } from '../ActionRow';

export interface TodayTimelineProps {
  plan: Plan;
  onSelectAction: (c: ActionCandidate) => void;
}

export function TodayTimeline({ plan, onSelectAction }: TodayTimelineProps) {
  return (
    <section className="aw-today-section" aria-label="Your day timeline">
      <h2 className="aw-section-title">Your day</h2>
      <div className="aw-timeline-slots">
        {plan.timeline.map((slot) => (
          <div key={slot.slotId} className="aw-timeline-slot-group">
            <div className="aw-timeline-slot-header">
              <span className="aw-slot-name">{slot.slotLabel}</span>
              <span className="aw-slot-note">{slot.note}</span>
            </div>
            <div className="aw-slot-actions">
              {slot.actions.map((cand) => (
                <ActionRow
                  key={cand.action.id}
                  candidate={cand}
                  onSelect={onSelectAction}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
