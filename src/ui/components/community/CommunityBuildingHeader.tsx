import { Chip } from '../../primitives/Chip';
import { Icon } from '../../icons';
import { GREEN_MEADOWS_SOCIETY } from '../../../data/community';

export function CommunityBuildingHeader() {
  const society = GREEN_MEADOWS_SOCIETY;

  return (
    <section className="card card-callout-exposure mb-4" aria-labelledby="community-header-title">
      <div className="section-title-row mb-1">
        <h2 id="community-header-title" className="section-heading flex-row-center gap-1">
          <Icon name="people" size={20} aria-hidden="true" />
          <span>For your building</span>
        </h2>
        <Chip label="Demo data" selected={false} />
      </div>

      <p className="community-header-desc text-sm">
        Demonstrating collective building action at <strong>{society.name}</strong> (
        {society.totalHomes} homes). Helps housing societies coordinate waste burning bans, morning
        carpools, and vulnerable resident welfare.
      </p>
    </section>
  );
}
