import { useState } from 'react';
import { type HouseholdProfile, type AirSnapshot, type ActionCandidate } from '../../domain/types';
import { decideVentilation } from '../../domain/ventilation';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { ActionRow } from '../components/ActionRow';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { PageHeader } from '../shell/PageHeader';
import { VerdictBlock } from '../components/VerdictBlock';
import { Banner } from '../primitives/Banner';
import { ROUTE_DESCRIPTIONS } from '../../state/route';
import { Icon } from '../icons';

interface IndoorScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

interface IndoorGroup {
  id: string;
  title: string;
  actionIds: string[];
}

const INDOOR_GROUPS: IndoorGroup[] = [
  {
    id: 'cleaner-room',
    title: 'Cleaner room',
    actionIds: ['IN-03', 'IN-04', 'IN-10'],
  },
  {
    id: 'cooking',
    title: 'Cooking',
    actionIds: ['IN-07', 'IN-08'],
  },
  {
    id: 'equipment',
    title: 'Equipment steps',
    actionIds: ['IN-05', 'IN-06'],
  },
  {
    id: 'source-control',
    title: 'Source control',
    actionIds: ['IN-01', 'IN-02', 'IN-09'],
  },
];

const CombustionWarningBanner: React.FC = () => (
  <Banner
    variant="warning"
    role="status"
    className="mb-4"
    icon={<Icon name="warning" size={18} aria-hidden="true" />}
  >
    <div>
      <strong>Carbon Monoxide Safety (Rule P-22):</strong>
      <p className="mt-1">
        Your home uses unvented combustion heating or biomass cooking without an
        exhaust chimney. Never seal air gaps or keep the space 100% airtight. Ensure
        adequate fresh airflow to prevent carbon monoxide accumulation.
      </p>
    </div>
  </Banner>
);

const IndoorAside: React.FC<{
  verdict: 'open' | 'brief' | 'closed';
  explanation: string;
  atHour?: number | null;
}> = ({ verdict, explanation, atHour }) => (
  <aside className="aw-screen-layout-aside" aria-label="Ventilation advisor and advice context">
    <div className="aw-screen-aside-sticky">
      <div className="aw-desktop-only mb-4">
        <VerdictBlock verdict={verdict} explanation={explanation} atHour={atHour ?? undefined} />
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold mb-2 flex-row-center gap-1">
          <Icon name="info" size={16} aria-hidden="true" />
          <span>Why this is advice, not a promise</span>
        </h3>
        <p className="text-xs text-muted">
          Air quality varies between neighbourhoods and changes quickly with local wind and
          temperature inversions. Building tightness, room volume, and household activity
          mean actual indoor exposure will differ from modelled estimates. Use these actions as
          practical steps, not absolute guarantees.
        </p>
      </div>
    </div>
  </aside>
);

const IndoorGroupsStack: React.FC<{
  approvedIndoor: ActionCandidate[];
  onSelectAction: (cand: ActionCandidate) => void;
}> = ({ approvedIndoor, onSelectAction }) => (
  <div className="indoor-groups-stack">
    {INDOOR_GROUPS.map((group) => {
      const groupCandidates = approvedIndoor.filter((c) =>
        group.actionIds.includes(c.action.id),
      );

      if (groupCandidates.length === 0) return null;

      return (
        <section
          key={group.id}
          aria-labelledby={`group-heading-${group.id}`}
          className="card mb-4"
        >
          <h2 id={`group-heading-${group.id}`} className="section-heading mb-2">
            {group.title}
          </h2>
          {group.id === 'cleaner-room' && (
            <p className="text-xs text-muted mb-3">
              Designate a well-sealed sanctuary room. Damp-wipe surfaces and keep interior doors
              closed to isolate outdoor drafts and cooking fumes.
            </p>
          )}
          <div className="actions-stack">
            {groupCandidates.map((cand) => (
              <ActionRow
                key={cand.action.id}
                candidate={cand}
                showEffort
                showAxisSummary
                onSelect={onSelectAction}
              />
            ))}
          </div>
        </section>
      );
    })}
  </div>
);

export function IndoorScreen({ profile, snapshot }: IndoorScreenProps) {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const { effectiveLevel, slots, policyResult } = useDailyPlan(
    profile,
    snapshot,
    targetRegion,
    false,
  );

  const ventResult = decideVentilation({ snapshot, effectiveLevel, slots, targetRegion });
  const approvedIndoor =
    policyResult?.approvedCandidates.filter(
      (c: ActionCandidate) => c.action.category === 'indoor',
    ) || [];

  const isCombustionRisk =
    profile.homeHeating === 'combustion' ||
    (profile.cooking.fuel === 'biomass' && !profile.cooking.hasExhaust);

  return (
    <div className="indoor-screen screen-container">
      <PageHeader title="At home" description={ROUTE_DESCRIPTIONS.indoor} />

      <div className="aw-screen-layout-grid">
        <div className="aw-screen-layout-main">
          <div className="aw-mobile-only mb-4">
            <VerdictBlock
              verdict={ventResult.verdict}
              explanation={ventResult.explanation}
              atHour={ventResult.atHour ?? undefined}
            />
          </div>

          {isCombustionRisk && <CombustionWarningBanner />}

          <IndoorGroupsStack
            approvedIndoor={approvedIndoor}
            onSelectAction={(c) => setSelectedAction(c)}
          />

          {approvedIndoor.length === 0 && (
            <div className="box-subtle">
              <p className="text-muted">No specific indoor actions recommended for current conditions.</p>
            </div>
          )}
        </div>

        <IndoorAside
          verdict={ventResult.verdict}
          explanation={ventResult.explanation}
          atHour={ventResult.atHour}
        />
      </div>

      {selectedAction && (
        <ActionDetailModal candidate={selectedAction} onClose={() => setSelectedAction(null)} />
      )}
    </div>
  );
}

export default IndoorScreen;
