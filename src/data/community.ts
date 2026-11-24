import { AirSnapshot, HouseholdProfile, RiskLevel } from '../domain/types';
import { calculateAvoidedVkm } from '../domain/impact';
import { LEVEL_NAMES } from '../domain/levels';

/**
 * Seeded Community Demo Constants (IMPACT_METHODOLOGY.md §9, Decision A-17)
 */
export const SEEDED_TOTAL_HOMES = 120;
export const SEEDED_NO_BURNING_PLEDGES = 84;
export const SEEDED_CARPOOL_HOUSEHOLDS = 18;
export const SEEDED_ASSUMED_ONE_WAY_KM = 12;
export const SEEDED_ASSUMED_CARPOOL_DAYS = 2;
export const SEEDED_ASSUMED_OCCUPANCY = 2;
export const SEEDED_SENIORS_COUNT = 24;
export const SEEDED_CHILDREN_U12_COUNT = 19;
export const SEEDED_RESPIRATORY_FLAGGED_COUNT = 9;

/**
 * Baseline seeded carpool vkm derived strictly via Formula E1:
 * SEEDED_CARPOOL_HOUSEHOLDS * (oneWayKm * 2 * tripsAvoided * (1 - 1 / occupancy))
 * 18 * (12 * 2 * 2 * (1 - 1 / 2)) = 18 * 24 = 432 vkm/week.
 */
export const SEEDED_BASELINE_CARPOOL_VKM =
  SEEDED_CARPOOL_HOUSEHOLDS *
  (SEEDED_ASSUMED_ONE_WAY_KM *
    2 *
    SEEDED_ASSUMED_CARPOOL_DAYS *
    (1 - 1 / SEEDED_ASSUMED_OCCUPANCY));

export interface SeededSociety {
  name: string;
  totalHomes: number;
  basePledges: {
    noBurning: number;
    carpoolParticipants: number;
  };
  vulnerableCensus: {
    seniors: number;
    childrenUnder12: number;
    respiratoryFlagged: number;
  };
  seededWeeklyAvoidedVkm: number;
}

export const GREEN_MEADOWS_SOCIETY: SeededSociety = {
  name: 'Green Meadows Apartments',
  totalHomes: SEEDED_TOTAL_HOMES,
  basePledges: {
    noBurning: SEEDED_NO_BURNING_PLEDGES,
    carpoolParticipants: SEEDED_CARPOOL_HOUSEHOLDS,
  },
  vulnerableCensus: {
    seniors: SEEDED_SENIORS_COUNT,
    childrenUnder12: SEEDED_CHILDREN_U12_COUNT,
    respiratoryFlagged: SEEDED_RESPIRATORY_FLAGGED_COUNT,
  },
  seededWeeklyAvoidedVkm: SEEDED_BASELINE_CARPOOL_VKM,
};

/**
 * Calculates aggregate community vehicle-km avoided (Formula C1).
 * Combines seeded society baseline (computed via E1) with current user's profile contribution.
 * Only defensible motorized avoidance (MO-03 carpool, MO-05 remote) is summed per §5.
 */
export function calculateCommunityAggregateVkm(
  profile: HouseholdProfile,
  _userPledgedNoBurning: boolean = false,
): number {
  const userCarpool = calculateAvoidedVkm('MO-03', profile) || 0;
  const userRemote = calculateAvoidedVkm('MO-05', profile) || 0;
  const userTotal = userCarpool + userRemote;

  return Math.round((SEEDED_BASELINE_CARPOOL_VKM + userTotal) * 10) / 10;
}

/**
 * Generates clean, non-identifying plain text briefing suitable for WhatsApp,
 * email, or residential notice boards (Rule CM-04, IMPACT_METHODOLOGY.md §9).
 * Contains NO emoji, no PII, no health flags, and no exact ages.
 */
export function generateShareableBriefing(
  snapshot: AirSnapshot,
  effectiveLevel: number,
  topActionTitles: string[] = [],
  userPledgedNoBurning: boolean = false,
  injectedDate?: Date | string,
  societyName: string = GREEN_MEADOWS_SOCIETY.name,
): string {
  const levelLabel = LEVEL_NAMES[effectiveLevel as RiskLevel] || 'Caution';
  const pm25Now = snapshot.pm25.now !== null ? Math.round(snapshot.pm25.now) : 'Unmeasured';

  const formattedDate = injectedDate
    ? typeof injectedDate === 'string'
      ? injectedDate
      : injectedDate.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
    : new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  const totalPledges = SEEDED_NO_BURNING_PLEDGES + (userPledgedNoBurning ? 1 : 0);

  const defaultActions = [
    'Pledge not to burn leaves, garden waste or rubbish.',
    'Coordinate morning carpools or use covered transit.',
    'Keep windows closed during morning/evening commute peaks.',
  ];

  const actionsToShow = topActionTitles.length >= 3 ? topActionTitles.slice(0, 3) : defaultActions;

  const totalVulnerableHouseholds = SEEDED_SENIORS_COUNT + SEEDED_CHILDREN_U12_COUNT;

  return `${societyName} — Daily Clean-Air Briefing
Date: ${formattedDate}
Air Quality: ${pm25Now} µg/m³ PM2.5 (${levelLabel} level)

Recommended Community Actions Today:
1. ${actionsToShow[0]}
2. ${actionsToShow[1]}
3. ${actionsToShow[2]}
4. Buddy check: Please check on neighbours who may need help today (${totalVulnerableHouseholds} households).

Society Impact Tally:
• ${totalPledges} / ${SEEDED_TOTAL_HOMES} households pledged to zero-burning.
• ~${SEEDED_BASELINE_CARPOOL_VKM} vehicle-km avoided this week by participating residents.

[Shared via AirWise — Demo data: ${societyName}]
Disclaimer: Informational guidance only; not medical advice.`;
}
