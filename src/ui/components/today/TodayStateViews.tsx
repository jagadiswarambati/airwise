import {
  type ActionCandidate,
  type AirSnapshot,
  type Plan,
} from '../../../domain/types';
import { SevereSmogView } from '../SevereSmogView';
import { ActionDetailModal } from '../ActionDetailModal';

export interface TodaySevereScreenProps {
  snapshot: AirSnapshot;
  plan: Plan;
  isManualSevere?: boolean;
  onToggleSevere?: () => void;
  onExit: () => void;
  selectedAction: ActionCandidate | null;
  onCloseAction: () => void;
}

export function TodaySevereScreen({
  snapshot,
  plan,
  isManualSevere,
  onToggleSevere,
  onExit,
  selectedAction,
  onCloseAction,
}: TodaySevereScreenProps) {
  return (
    <div className="aw-screen aw-screen-severe">
      <SevereSmogView
        snapshot={snapshot}
        plan={plan}
        onExitSevereView={onExit}
        isManualOverride={isManualSevere}
        onToggleManualOverride={onToggleSevere || (() => {})}
      />
      {selectedAction && (
        <ActionDetailModal candidate={selectedAction} onClose={onCloseAction} />
      )}
    </div>
  );
}
