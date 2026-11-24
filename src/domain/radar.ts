import {
  type AirSnapshot,
  type HouseholdProfile,
  type HourlyPoint,
  type Member,
  type RiskRadarResult,
  type SlotId,
  type TimeSlot,
} from './types';
import { getBandForPm25 } from './config/bands';
import {
  calculateMemberWeight,
  MODE_EXPOSURE_FACTORS,
  SLOT_OUTDOOR_FACTORS,
} from './config/radar-weights';
import { isMinuteInSlot, parseLocalMinuteOfDay } from './time';

/**
 * Parses "HH:MM" string into minutes from midnight (0..1439)
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (mins || 0);
}

interface SlotDef {
  id: SlotId;
  label: string;
  startM: number;
  endM: number;
  outdoorActivity: 'none' | 'commute' | 'active';
}

function buildSlotDefinitions(routine: HouseholdProfile['routine']): SlotDef[] {
  const wakeM = parseTimeToMinutes(routine.wake);
  const leaveM = parseTimeToMinutes(routine.leave);
  const returnM = parseTimeToMinutes(routine.returnHome);
  const bedM = parseTimeToMinutes(routine.bed);
  const commuteOutEndM = (leaveM + 45) % 1440;
  const commuteBackEndM = (returnM + 45) % 1440;

  return [
    { id: 'early-morning', label: 'Early Morning', startM: wakeM, endM: leaveM, outdoorActivity: 'none' },
    { id: 'commute-out', label: 'Morning Commute', startM: leaveM, endM: commuteOutEndM, outdoorActivity: 'commute' },
    { id: 'daytime', label: 'Daytime', startM: commuteOutEndM, endM: returnM, outdoorActivity: 'none' },
    { id: 'commute-back', label: 'Evening Commute', startM: returnM, endM: commuteBackEndM, outdoorActivity: 'commute' },
    { id: 'evening', label: 'Evening', startM: commuteBackEndM, endM: bedM, outdoorActivity: 'none' },
    { id: 'night', label: 'Night', startM: bedM, endM: wakeM, outdoorActivity: 'none' },
  ];
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Derives 6 standard daily time slots based on household routine and hourly forecast.
 * Uses location-local time parsing to guarantee timezone invariance.
 */
export function deriveTimeSlots(
  profile: HouseholdProfile,
  hourlySeries: HourlyPoint[],
  targetRegion: 'IN' | 'US' = 'IN',
  utcOffsetSeconds?: number,
): TimeSlot[] {
  const slotDefinitions = buildSlotDefinitions(profile.routine);

  return slotDefinitions.map((def) => {
    const pointsInSlot = hourlySeries.filter((p) => {
      if (!p.time) return false;
      const pointMinute = parseLocalMinuteOfDay(p.time, utcOffsetSeconds);
      return isMinuteInSlot(pointMinute, def.startM, def.endM);
    });

    const validPm25 = pointsInSlot
      .map((p) => p.pm25)
      .filter((v): v is number => v !== null && !isNaN(v));

    const meanPm25 =
      validPm25.length > 0
        ? Math.round((validPm25.reduce((sum, v) => sum + v, 0) / validPm25.length) * 10) / 10
        : null;

    const forecastLevel = meanPm25 !== null ? getBandForPm25(meanPm25, targetRegion) : 2;

    return {
      id: def.id,
      label: def.label,
      startTime: formatMinutes(def.startM),
      endTime: formatMinutes(def.endM),
      forecastMeanPm25: meanPm25,
      forecastLevel,
      outdoorActivity: def.outdoorActivity,
    };
  });
}

function isTieBreakerBetter(candidate: Member, current: Member): boolean {
  const candidateCrit =
    candidate.flags.includes('asthma_copd') || candidate.flags.includes('heart');
  const currentCrit =
    current.flags.includes('asthma_copd') || current.flags.includes('heart');

  if (candidateCrit && !currentCrit) return true;
  if (!candidateCrit && currentCrit) return false;
  if (candidate.ageGroup === 'u5' && current.ageGroup !== 'u5') return true;
  return candidate.ageGroup === '65+' && current.ageGroup !== 'u5' && current.ageGroup !== '65+';
}

/**
 * Finds the most vulnerable member of the household.
 * In case of ties, prioritizes:
 * 1. Member with respiratory/COPD or heart flags
 * 2. Youngest children (u5, then 5-12) or oldest seniors (65+)
 */
export function findMostVulnerableMember(members: Member[]): Member {
  if (members.length === 0) {
    throw new Error('Household must contain at least one member');
  }

  let bestMember = members[0];
  let maxWeight = -1;

  for (const member of members) {
    const weight = calculateMemberWeight(member.ageGroup, member.flags);
    if (weight > maxWeight) {
      maxWeight = weight;
      bestMember = member;
    } else if (weight === maxWeight && isTieBreakerBetter(member, bestMember)) {
      bestMember = member;
    }
  }

  return bestMember;
}

/**
 * Computes Household Risk Radar:
 * Identifies the most vulnerable member and the highest-risk daily time window,
 * explaining why that window matters.
 */
export function computeRiskRadar(
  profile: HouseholdProfile,
  _snapshot: AirSnapshot,
  slots: TimeSlot[],
): RiskRadarResult {
  const vulnerableMember = findMostVulnerableMember(profile.members);
  const memberWeight = calculateMemberWeight(vulnerableMember.ageGroup, vulnerableMember.flags);

  let highestScore = -1;
  let highestSlot = slots[0];

  for (const slot of slots) {
    let outdoorFactor = SLOT_OUTDOOR_FACTORS[slot.id] || 1.0;

    // If this is a commute window and household travels by active/open transit
    if (slot.outdoorActivity === 'commute' && profile.travel.modes.length > 0) {
      const maxModeFactor = Math.max(
        ...profile.travel.modes.map((m) => MODE_EXPOSURE_FACTORS[m] || 1.0),
      );
      outdoorFactor = outdoorFactor * (maxModeFactor / 1.5);
    }

    const levelFactor = (slot.forecastLevel + 1);
    const score = Math.round(memberWeight * levelFactor * outdoorFactor * 10) / 10;

    if (score > highestScore) {
      highestScore = score;
      highestSlot = slot;
    }
  }

  const slotTimeRange = `${highestSlot.startTime}–${highestSlot.endTime}`;
  let reasonCode = 'PEAK_COMMUTE_EXPOSURE';
  let explanation = '';

  if (highestSlot.outdoorActivity === 'commute') {
    reasonCode = 'COMMUTE_PEAK_RISK';
    explanation = `${vulnerableMember.roleLabel} during the ${highestSlot.label.toLowerCase()} (${slotTimeRange}): Outdoor travel coincides with higher pollution exposure.`;
  } else if (highestSlot.id === 'early-morning' || highestSlot.id === 'evening') {
    reasonCode = 'DIURNAL_INVERSION_RISK';
    explanation = `${vulnerableMember.roleLabel} in the ${highestSlot.label.toLowerCase()} (${slotTimeRange}): Temperature inversion and stagnant surface air cause elevated particle accumulation.`;
  } else {
    reasonCode = 'ELEVATED_DAYTIME_RISK';
    explanation = `${vulnerableMember.roleLabel} during ${highestSlot.label.toLowerCase()} (${slotTimeRange}): Persistent outdoor particulate concentrations require sustained indoor protection.`;
  }

  return {
    memberId: vulnerableMember.id,
    memberRoleLabel: vulnerableMember.roleLabel,
    slotId: highestSlot.id,
    slotLabel: highestSlot.label,
    reasonCode,
    explanation,
    score: highestScore,
  };
}
