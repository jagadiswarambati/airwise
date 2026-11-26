import { Icon } from '../../icons';
import { Stat } from '../../primitives/Stat';
import {
  GREEN_MEADOWS_SOCIETY,
  SEEDED_CARPOOL_HOUSEHOLDS,
} from '../../../data/community';

export function CommunityAside({ aggregateVkm }: { aggregateVkm: number }) {
  const society = GREEN_MEADOWS_SOCIETY;

  return (
    <aside
      className="aw-screen-layout-aside"
      aria-label="Community impact tally and coordination details"
    >
      <div className="aw-screen-aside-sticky">
        <section className="card mb-4" aria-labelledby="community-vkm-heading">
          <h3 id="community-vkm-heading" className="text-sm font-semibold mb-2">
            Aggregate Community Vehicle-KM Avoided
          </h3>
          <Stat
            value={`~${aggregateVkm}`}
            unit="vkm avoided this week (Formula C1)"
            label="Estimated, demo data"
          />

          <p className="community-vkm-desc text-xs text-muted mt-3">
            Combines {society.name}'s baseline (432 vkm across{' '}
            {SEEDED_CARPOOL_HOUSEHOLDS} carpooling residents) with your household's profile
            contribution.
          </p>
        </section>

        <div className="card">
          <h3 className="text-sm font-semibold mb-2 flex-row-center gap-1">
            <Icon name="people" size={16} aria-hidden="true" />
            <span>Neighbourhood coordination</span>
          </h3>
          <p className="text-xs text-muted">
            Local actions like stopping biomass burning and coordinating vehicle trips prevent
            hyper-local pollution hotspots right outside your building.
          </p>
        </div>
      </div>
    </aside>
  );
}
