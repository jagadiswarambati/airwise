import {
  type ActionCandidate,
  type HouseholdProfile,
  type Plan,
  type RiskRadarResult,
} from '../../../domain/types';
import { type QuickCheckResult } from '../../../domain/quickchecks';
import { type TrustModel } from '../../../data/trust';
import { RadarLine } from '../RadarLine';
import { TrustSummary } from '../TrustSummary';
import { QuickChecksCard } from '../QuickChecksCard';
import { TodayTopActions } from './TodayTopActions';
import { TodayTimeline } from './TodayTimeline';

export interface TodayContentGridProps {
  radar: RiskRadarResult;
  profile: HouseholdProfile;
  plan: Plan;
  topActions: ActionCandidate[];
  trust: TrustModel;
  quickChecks?: QuickCheckResult[];
  onSelectAction: (c: ActionCandidate) => void;
}

export function TodayContentGrid({
  radar,
  profile,
  plan,
  topActions,
  trust,
  quickChecks,
  onSelectAction,
}: TodayContentGridProps) {
  return (
    <div className="aw-today-grid">
      <div className="aw-today-main">
        <RadarLine radar={radar} profile={profile} />
        <hr className="aw-divider" />
        <TodayTopActions plan={plan} topActions={topActions} onSelectAction={onSelectAction} />
        <hr className="aw-divider" />
        <TodayTimeline plan={plan} onSelectAction={onSelectAction} />
      </div>

      <aside className="aw-today-aside" aria-label="Forecast trust and quick questions">
        <TrustSummary trust={trust} />
        <hr className="aw-divider" />
        <QuickChecksCard checks={quickChecks || []} />
      </aside>
    </div>
  );
}
