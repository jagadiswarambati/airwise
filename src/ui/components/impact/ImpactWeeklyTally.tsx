import { type HouseholdProfile } from '../../../domain/types';
import {
  DEFAULT_CARPOOL_DAYS,
  DEFAULT_REMOTE_DAYS,
  DEFAULT_CARPOOL_OCCUPANCY,
} from '../../../domain/config/thresholds';
import {
  FORMULA_E1_TITLE,
  FORMULA_E1_SUMMARY,
  FORMULA_E1_EQUATIONS,
} from '../../../domain/config/impact-copy';
import { Stat } from '../../primitives/Stat';
import { Disclosure } from '../../primitives/Disclosure';

export interface VkmItem {
  id: string;
  title: string;
  vkm: number | undefined;
  note: string;
}

export interface ImpactWeeklyTallyProps {
  roundedWeeklyVkm: number;
  weeklyVkmBreakdown: VkmItem[];
  profile: HouseholdProfile;
  isDesktop?: boolean;
}

export function ImpactWeeklyTally({
  roundedWeeklyVkm,
  weeklyVkmBreakdown,
  profile,
  isDesktop = false,
}: ImpactWeeklyTallyProps) {
  const headingId = isDesktop ? 'desktop-tally-heading' : 'mobile-tally-heading';
  const className = `card mb-4 ${isDesktop ? 'aw-desktop-only' : 'aw-mobile-only'}`;

  return (
    <section className={className} aria-labelledby={headingId}>
      <h2 id={headingId} className="section-heading mb-2">
        Weekly Household Defensible Tally
      </h2>
      <Stat
        value={roundedWeeklyVkm > 0 ? `~${roundedWeeklyVkm}` : '0'}
        unit="vehicle-km avoided / week (Estimated)"
        label={`About ${roundedWeeklyVkm} vehicle-km avoided per week (Estimated)`}
      />

      {isDesktop && (
        <>
          {roundedWeeklyVkm > 0 ? (
            <div className="tally-breakdown-stack mt-3">
              {weeklyVkmBreakdown.map((item) => (
                <div key={item.id} className="tally-breakdown-row">
                  <div>
                    <strong>{item.title}</strong>
                    <div className="text-xs text-muted">{item.note}</div>
                  </div>
                  <span className="tally-row-vkm">~{item.vkm} vkm</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="box-subtle mt-3 text-xs text-muted">
              <strong>0 vehicle-km recorded:</strong> Profile commute distance is 0 km or no
              motorized vehicle commute indicated. Vehicle-km reductions are only estimated where
              commuting distances and vehicle trips are explicitly documented in your household
              profile.
            </div>
          )}
        </>
      )}

      <Disclosure title="Show how this is calculated" className="mt-3">
        <div className="text-xs text-muted">
          <p className="font-semibold mb-1">{FORMULA_E1_TITLE}</p>
          <p className="mb-2">{FORMULA_E1_SUMMARY}</p>
          <p>• {FORMULA_E1_EQUATIONS[0]}</p>
          <p>• {FORMULA_E1_EQUATIONS[1]}</p>
          <div className="mt-2">
            <strong>Documented Assumptions:</strong> Assumes round-trip distance of 2 ×{' '}
            {profile.travel.oneWayKm} km; {DEFAULT_CARPOOL_OCCUPANCY}-person carpool saves{' '}
            {Math.round((1 - 1 / DEFAULT_CARPOOL_OCCUPANCY) * 100)}% on shared days (
            {DEFAULT_CARPOOL_DAYS} days/week); remote work eliminates {DEFAULT_REMOTE_DAYS} full
            round trip.
          </div>
        </div>
      </Disclosure>
    </section>
  );
}
