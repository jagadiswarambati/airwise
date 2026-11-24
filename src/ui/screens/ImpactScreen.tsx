import React, { useState } from 'react';
import { type HouseholdProfile, type AirSnapshot, type ActionCandidate } from '../../domain/types';
import { calculateAvoidedVkm } from '../../domain/impact';
import { calculateCommunityAggregateVkm } from '../../data/community';
import {
  DEFAULT_CARPOOL_DAYS,
  DEFAULT_REMOTE_DAYS,
  DEFAULT_CARPOOL_OCCUPANCY,
} from '../../domain/config/thresholds';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';
import { ImpactOverviewBanner } from '../components/impact/ImpactOverviewBanner';
import { ImpactWeeklyTally, type VkmItem } from '../components/impact/ImpactWeeklyTally';
import { ImpactCommunityCard } from '../components/impact/ImpactCommunityCard';
import { ImpactFormulasCard } from '../components/impact/ImpactFormulasCard';
import { ImpactActionList } from '../components/impact/ImpactActionList';

interface ImpactScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

export const ImpactScreen: React.FC<ImpactScreenProps> = ({ profile, snapshot }) => {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const { policyResult } = useDailyPlan(profile, snapshot, targetRegion, true);
  const approvedCandidates = policyResult?.approvedCandidates || [];

  const carpoolVkm = calculateAvoidedVkm('MO-03', profile);
  const remoteVkm = calculateAvoidedVkm('MO-05', profile);

  const weeklyVkmBreakdown: VkmItem[] = [
    {
      id: 'MO-03',
      title: `Carpooling ${DEFAULT_CARPOOL_DAYS} days/week`,
      vkm: carpoolVkm,
      note: `Default ${DEFAULT_CARPOOL_OCCUPANCY}-person occupancy`,
    },
    {
      id: 'MO-05',
      title: `Remote work ${DEFAULT_REMOTE_DAYS} day/week`,
      vkm: remoteVkm,
      note: 'Eliminates 1 round trip commute',
    },
  ].filter((item) => item.vkm !== undefined && item.vkm > 0);

  const totalWeeklyVkm = weeklyVkmBreakdown.reduce((sum, item) => sum + (item.vkm || 0), 0);
  const roundedWeeklyVkm = Math.round(totalWeeklyVkm * 10) / 10;
  const communityAggregateVkm = calculateCommunityAggregateVkm(profile);

  return (
    <div className="impact-screen screen-container">
      <PageHeader title="Dual-Axis Impact Overview" description={ROUTE_DESCRIPTIONS.impact} />

      <ImpactOverviewBanner />

      <div className="aw-screen-layout-grid">
        <div className="aw-screen-layout-main">
          <ImpactWeeklyTally
            roundedWeeklyVkm={roundedWeeklyVkm}
            weeklyVkmBreakdown={weeklyVkmBreakdown}
            profile={profile}
            isDesktop={false}
          />

          <ImpactActionList
            candidates={approvedCandidates}
            onSelectAction={(cand) => setSelectedAction(cand)}
          />
        </div>

        <aside
          className="aw-screen-layout-aside"
          aria-label="Household tally and calculation formulas"
        >
          <div className="aw-screen-aside-sticky">
            <ImpactWeeklyTally
              roundedWeeklyVkm={roundedWeeklyVkm}
              weeklyVkmBreakdown={weeklyVkmBreakdown}
              profile={profile}
              isDesktop={true}
            />

            <ImpactCommunityCard
              communityAggregateVkm={communityAggregateVkm}
              roundedWeeklyVkm={roundedWeeklyVkm}
            />

            <ImpactFormulasCard />
          </div>
        </aside>
      </div>

      {selectedAction && (
        <ActionDetailModal candidate={selectedAction} onClose={() => setSelectedAction(null)} />
      )}
    </div>
  );
};

export default ImpactScreen;
