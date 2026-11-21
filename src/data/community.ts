import { AirSnapshot, HouseholdProfile } from '../domain/types';
import { calculateAvoidedVkm } from '../domain/impact';

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
  totalHomes: 120,
  basePledges: {
    noBurning: 84,
    carpoolParticipants: 18,
  },
  vulnerableCensus: {
    seniors: 24,
    childrenUnder12: 19,
    respiratoryFlagged: 9,
  },
  seededWeeklyAvoidedVkm: 432,
};

/**
 * Calculates aggregate community vehicle-km avoided (Formula C1)
 * Combines seeded society baseline with the current user's profile contribution.
 */
export function calculateCommunityAggregateVkm(profile: HouseholdProfile): number {
  const userCarpool = calculateAvoidedVkm('MO-03', profile) || 0;
  const userErrands = calculateAvoidedVkm('MO-04', profile) || 0;
  const userRemote = calculateAvoidedVkm('MO-05', profile) || 0;
  const userTotal = userCarpool + userErrands + userRemote;

  return Math.round((GREEN_MEADOWS_SOCIETY.seededWeeklyAvoidedVkm + userTotal) * 10) / 10;
}

/**
 * Generates clean, non-identifying plain text briefing suitable for WhatsApp,
 * email, or residential notice boards (Rule CM-04).
 */
export function generateShareableBriefing(
  snapshot: AirSnapshot,
  effectiveLevel: number,
  society: SeededSociety = GREEN_MEADOWS_SOCIETY
): string {
  const levelNames = ['Clear', 'Watch', 'Caution', 'Protect', 'Severe'];
  const levelLabel = levelNames[effectiveLevel] || 'Caution';
  const pm25Now = snapshot.pm25.now !== null ? Math.round(snapshot.pm25.now) : 'Unmeasured';

  return `🍃 *${society.name} — Daily Clean-Air Briefing*
📅 Date: ${new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
💨 Air Quality: ${pm25Now} µg/m³ PM2.5 (${levelLabel} level)

*Recommended Community Actions Today:*
1. 🚫 No open burning of leaves, garbage, or wood in or around society grounds.
2. 🚗 Coordinate morning carpools or use covered transit.
3. 🏠 Keep windows closed during morning/evening commute peaks.
4. 🤝 Buddy Check: Please check on our ${society.vulnerableCensus.seniors} seniors and families with young children.

*Society Impact Tally:*
• ${society.basePledges.noBurning} / ${society.totalHomes} households pledged to zero-burning.
• ~${society.seededWeeklyAvoidedVkm} vehicle-km avoided this week by participating residents.

[Shared via AirWise — Demo data: Green Meadows Apartments]`;
}
