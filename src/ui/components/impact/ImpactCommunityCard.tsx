import { Icon } from '../../icons';
import { Stat } from '../Stat';
import {
  GREEN_MEADOWS_SOCIETY,
  SEEDED_CARPOOL_HOUSEHOLDS,
} from '../../../data/community';

export function ImpactCommunityCard({
  communityAggregateVkm,
  roundedWeeklyVkm,
}: {
  communityAggregateVkm: number;
  roundedWeeklyVkm: number;
}) {
  return (
    <section className="card mb-4" aria-labelledby="community-aggregate-heading">
      <div className="section-title-row mb-2">
        <h3 id="community-aggregate-heading" className="section-heading flex-row-center gap-1">
          <Icon name="people" size={20} aria-hidden="true" />
          <span>Community Aggregate Impact</span>
        </h3>
        <span className="aw-badge aw-badge-data-type">Demo data</span>
      </div>

      <p className="community-aggregate-desc text-xs text-muted mb-2">
        Collective emissions avoided across {GREEN_MEADOWS_SOCIETY.name} (
        {GREEN_MEADOWS_SOCIETY.totalHomes} homes).
      </p>

      <Stat
        value={`~${communityAggregateVkm}`}
        unit="community vehicle-km avoided / week (Estimated)"
        label="Estimated (Formula C1)"
      />

      <div className="text-xs text-muted mt-2">
        Formula C1: Combines {GREEN_MEADOWS_SOCIETY.seededWeeklyAvoidedVkm} vkm baseline (
        {SEEDED_CARPOOL_HOUSEHOLDS} carpooling homes) + {roundedWeeklyVkm} vkm household
        contribution.
      </div>
    </section>
  );
}
