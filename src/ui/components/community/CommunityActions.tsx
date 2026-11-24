import { Icon } from '../../icons';
import {
  GREEN_MEADOWS_SOCIETY,
  SEEDED_CARPOOL_HOUSEHOLDS,
  SEEDED_BASELINE_CARPOOL_VKM,
} from '../../../data/community';

interface PledgeProps {
  hasPledged: boolean;
  onTogglePledge: () => void;
  totalPledges: number;
}

export function CommunityPledgeSection({ hasPledged, onTogglePledge, totalPledges }: PledgeProps) {
  const society = GREEN_MEADOWS_SOCIETY;

  return (
    <section className="card mb-4" aria-labelledby="pledge-heading">
      <div className="pledge-header-row flex-between mb-2">
        <div>
          <span className="pledge-subtitle text-emissions text-xs font-semibold block">
            Action CM-01 · Clean Air Pledge
          </span>
          <h3 id="pledge-heading" className="pledge-title text-base font-bold">
            No-Burning Pledge
          </h3>
        </div>

        <span className="tag-emissions-pill">
          {totalPledges} / {society.totalHomes} Pledged
        </span>
      </div>

      <p className="pledge-desc text-sm text-muted mb-3">
        Open burning of leaves, garden waste, or rubbish creates dangerous localized PM2.5 spikes.
      </p>

      <button
        type="button"
        onClick={onTogglePledge}
        className={`pledge-toggle-btn ${hasPledged ? 'pledge-toggle-pledged' : 'pledge-toggle-unpledged'}`}
        aria-pressed={hasPledged}
        aria-label={`Zero burning pledge. Currently ${hasPledged ? 'pledged' : 'unpledged'}. Total ${totalPledges} of ${society.totalHomes} pledged.`}
      >
        {hasPledged ? (
          <>
            <Icon name="check" size={18} aria-hidden="true" />
            <span>Pledged not to burn leaves, garden waste or rubbish</span>
          </>
        ) : (
          <span>Pledge not to burn leaves, garden waste or rubbish</span>
        )}
      </button>
    </section>
  );
}

export function CommunityCarpoolSection() {
  const society = GREEN_MEADOWS_SOCIETY;

  return (
    <section className="card mb-4" aria-labelledby="carpool-heading">
      <span className="carpool-subtitle text-exposure text-xs font-semibold block mb-1">
        Action CM-02 · Collective Mobility
      </span>
      <h3 id="carpool-heading" className="carpool-title text-base font-bold mb-1">
        Building Carpool Coordination
      </h3>
      <p className="carpool-desc text-sm text-muted mb-3">
        {SEEDED_CARPOOL_HOUSEHOLDS} residents at {society.name} coordinate morning departures on common corridor routes.
      </p>

      <dl className="aw-definition-list" aria-label="Carpool statistics">
        <div className="aw-def-item">
          <dt className="aw-def-label">Commuters</dt>
          <dd className="aw-def-val">{SEEDED_CARPOOL_HOUSEHOLDS}</dd>
        </div>
        <div className="aw-def-item">
          <dt className="aw-def-label">Departure slot</dt>
          <dd className="aw-def-val">08:30</dd>
        </div>
        <div className="aw-def-item">
          <dt className="aw-def-label">Vehicle-km saved</dt>
          <dd className="aw-def-val">~{SEEDED_BASELINE_CARPOOL_VKM} vkm/wk</dd>
        </div>
      </dl>
    </section>
  );
}

export function CommunityBuddyCheckSection() {
  const society = GREEN_MEADOWS_SOCIETY;

  return (
    <section className="card mb-4" aria-labelledby="buddy-check-heading">
      <span className="buddy-subtitle text-warning text-xs font-semibold block mb-1">
        Action CM-03 · Vulnerability Care
      </span>
      <h3 id="buddy-check-heading" className="buddy-title text-base font-bold mb-1">
        Vulnerable Resident Buddy Check
      </h3>
      <p className="buddy-desc text-sm text-muted mb-3">
        Healthy residents check on at-risk households during elevated pollution episodes.
      </p>

      <dl className="aw-definition-list" aria-label="Vulnerable resident census">
        <div className="aw-def-item">
          <dt className="aw-def-label">Seniors (65+)</dt>
          <dd className="aw-def-val">{society.vulnerableCensus.seniors}</dd>
        </div>
        <div className="aw-def-item">
          <dt className="aw-def-label">Children (&lt;12)</dt>
          <dd className="aw-def-val">{society.vulnerableCensus.childrenUnder12}</dd>
        </div>
        <div className="aw-def-item">
          <dt className="aw-def-label">Respiratory</dt>
          <dd className="aw-def-val">{society.vulnerableCensus.respiratoryFlagged}</dd>
        </div>
      </dl>

      <div className="buddy-note text-xs text-muted mt-3">
        Census displays aggregated, non-identifying counts only to preserve neighbor privacy.
      </div>
    </section>
  );
}
