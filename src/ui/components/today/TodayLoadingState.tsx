import { Skeleton } from '../Skeleton';
import { PageHeader } from '../../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../../state/route';
import { Icon } from '../../icons';
import { type ScenarioType } from '../../../data/fallback-chain';

export function TodayLoadingView() {
  return (
    <div className="aw-screen aw-screen-today">
      <PageHeader
        title="Today's Clean-Air Plan"
        description={ROUTE_DESCRIPTIONS.today}
      />
      <div className="aw-today-loading-skeleton" aria-label="Loading today's clean-air plan">
        <Skeleton count={1} variant="card" />
        <div className="aw-today-grid mt-6">
          <div className="aw-today-main">
            <Skeleton count={1} variant="text" />
            <div className="mt-4">
              <Skeleton count={3} variant="rect" />
            </div>
          </div>
          <aside className="aw-today-aside">
            <Skeleton count={2} variant="card" />
          </aside>
        </div>
      </div>
    </div>
  );
}

export interface TodayErrorViewProps {
  error: string | null;
  onRetry: () => void;
  onSelectScenario: (s: ScenarioType) => void;
}

export function TodayErrorView({ error, onRetry, onSelectScenario }: TodayErrorViewProps) {
  return (
    <div className="aw-screen aw-screen-today">
      <PageHeader
        title="Today's Clean-Air Plan"
        description={ROUTE_DESCRIPTIONS.today}
      />
      <div className="aw-today-error-state text-center py-6">
        <Icon name="warning" size={32} className="text-warning mb-2" aria-hidden="true" />
        <h2 className="text-lg font-bold mb-2">Unable to load air data</h2>
        <p className="error-message mb-4">
          {error || 'Network or service timeout. Check your connection or retry in a few moments.'}
        </p>
        <div className="aw-btn-row justify-center">
          <button
            type="button"
            className="aw-btn aw-btn-secondary"
            onClick={() => onSelectScenario('moderate')}
          >
            Use demo data
          </button>
          <button type="button" className="aw-btn aw-btn-primary" onClick={onRetry}>
            Retry forecast
          </button>
        </div>
      </div>
    </div>
  );
}
