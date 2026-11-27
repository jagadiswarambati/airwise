import { Chip } from '../../primitives/Chip';
import { Icon } from '../../icons';
import { BriefingPreview } from '../BriefingPreview';
import { GREEN_MEADOWS_SOCIETY } from '../../../data/community';
import { isRiskLevel, LEVEL_NAMES } from '../../../domain/levels';

export interface CommunityBriefingCardProps {
  effectiveLevel: number;
  pm25Now: number | null;
  shareableText: string;
}

export function CommunityBriefingCard({
  effectiveLevel,
  pm25Now,
  shareableText,
}: CommunityBriefingCardProps) {
  const society = GREEN_MEADOWS_SOCIETY;
  const levelName = isRiskLevel(effectiveLevel) ? LEVEL_NAMES[effectiveLevel] : 'Caution';

  return (
    <section className="card mb-4" aria-labelledby="society-briefing-title">
      <div className="society-briefing-header flex-between mb-2">
        <div>
          <span className="society-subtitle text-xs text-muted block">
            Today's Society Briefing
          </span>
          <div className="flex-row-center gap-2 mt-1">
            <h3 id="society-briefing-title" className="society-title">
              {society.name}
            </h3>
            <Chip label="Demo data" selected={false} />
          </div>
        </div>

        <div className={`society-level-badge card-risk-level-${effectiveLevel} flex-col-center`}>
          <div className="society-level-pm25 font-bold">
            {pm25Now !== null ? `${pm25Now} µg/m³` : 'Unmeasured'}
          </div>
          <div className="society-level-name flex-row-center gap-1 text-xs">
            <Icon name="protect" size={12} aria-hidden="true" />
            <span>{levelName} level</span>
          </div>
        </div>
      </div>

      <p className="society-briefing-summary text-sm text-muted mb-3">
        {effectiveLevel >= 3
          ? `Air is ${levelName} level for most households here. Residents should keep windows sealed and limit outdoor time for children and seniors.`
          : `Air is ${levelName} level for most households here. Maintain regular ventilation discipline and avoid smoke-generating activities.`}
      </p>

      <BriefingPreview briefingText={shareableText} societyName={society.name} />
    </section>
  );
}
