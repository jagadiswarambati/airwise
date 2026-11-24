import React from 'react';
import { type HouseholdProfile, type AirSnapshot } from '../../domain/types';
import {
  GREEN_MEADOWS_SOCIETY,
  calculateCommunityAggregateVkm,
  generateShareableBriefing,
} from '../../data/community';
import { useCommunityPledge } from '../../state/communityStore';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';
import { CommunityBuildingHeader } from '../components/community/CommunityBuildingHeader';
import { CommunityBriefingCard } from '../components/community/CommunityBriefingCard';
import {
  CommunityPledgeSection,
  CommunityCarpoolSection,
  CommunityBuddyCheckSection,
} from '../components/community/CommunityActions';
import { CommunityAside } from '../components/community/CommunityAside';

interface CommunityScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ profile, snapshot }) => {
  const [hasPledged, setHasPledged] = useCommunityPledge();

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const { effectiveLevel, plan } = useDailyPlan(profile, snapshot, targetRegion, true);

  const society = GREEN_MEADOWS_SOCIETY;
  const aggregateVkm = calculateCommunityAggregateVkm(profile, hasPledged);
  const topActionTitles = plan?.topActions.map((c) => c.action.title) || [];
  const shareableText = generateShareableBriefing(
    snapshot,
    effectiveLevel,
    topActionTitles,
    hasPledged,
  );

  const totalPledges = society.basePledges.noBurning + (hasPledged ? 1 : 0);
  const pm25Now = snapshot.pm25.now !== null ? Math.round(snapshot.pm25.now) : null;

  return (
    <div className="community-screen screen-container">
      <PageHeader title="Community Action & Briefing" description={ROUTE_DESCRIPTIONS.community} />

      <CommunityBuildingHeader />

      <div className="aw-screen-layout-grid">
        <div className="aw-screen-layout-main">
          <CommunityBriefingCard
            effectiveLevel={effectiveLevel}
            pm25Now={pm25Now}
            shareableText={shareableText}
          />

          <CommunityPledgeSection
            hasPledged={hasPledged}
            onTogglePledge={() => setHasPledged(!hasPledged)}
            totalPledges={totalPledges}
          />

          <CommunityCarpoolSection />

          <CommunityBuddyCheckSection />
        </div>

        <CommunityAside aggregateVkm={aggregateVkm} />
      </div>
    </div>
  );
};

export default CommunityScreen;
