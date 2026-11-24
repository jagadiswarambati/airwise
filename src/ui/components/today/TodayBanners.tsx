import { Icon } from '../../icons';
import { type ScenarioType } from '../../../data/fallback-chain';
import { type AirSnapshot } from '../../../domain/types';

interface TodayBannersProps {
  isFallback: boolean;
  fallbackReason?: string;
  snapshot: AirSnapshot;
  onSelectScenario: (s: ScenarioType) => void;
}

export function TodayBanners({
  isFallback,
  fallbackReason,
  snapshot,
  onSelectScenario,
}: TodayBannersProps) {
  const isStale = snapshot.freshness === 'stale' || snapshot.freshness === 'none';

  return (
    <>
      {isFallback && (
        <aside className="banner banner-offline" role="status" aria-label="Fallback mode notice">
          <Icon name="info" size={18} aria-hidden="true" />
          <div>
            <div>
              {fallbackReason || "We couldn't reach the air data service. Using cautious defaults."}
            </div>
            <button
              type="button"
              className="aw-btn aw-btn-secondary mt-1 text-xs"
              onClick={() => onSelectScenario('moderate')}
            >
              Use demo data
            </button>
          </div>
        </aside>
      )}

      {isStale && (
        <aside className="banner banner-warning" role="status" aria-label="Stale data notice">
          <Icon name="warning" size={18} aria-hidden="true" />
          <div>
            Air data is 26 hours old. Treat advice as low confidence. Walking and open-window advice is hidden.
          </div>
        </aside>
      )}
    </>
  );
}
