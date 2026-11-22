import {
  AirSnapshot,
  HouseholdProfile,
  HourlyPoint,
  Member,
  RiskRadarResult,
  SlotId,
  TimeSlot,
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
  const { wake, leave, returnHome, bed } = profile.routine;

  const wakeM = parseTimeToMinutes(wake);
  const leaveM = parseTimeToMinutes(leave);
  const returnM = parseTimeToMinutes(returnHome);
  const bedM = parseTimeToMinutes(bed);

  // Commute durations default to 45 mins
  const commuteOutEndM = (leaveM + 45) % 1440;
  const commuteBackEndM = (returnM + 45) % 1440;

  const formatM = (minutes: number): string => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const slotDefinitions: Array<{
    id: SlotId;
    label: string;
    startM: number;
    endM: number;
    outdoorActivity: 'none' | 'commute' | 'active';
  }> = [
    {
      id: 'early-morning',
      label: 'Early Morning',
      startM: wakeM,
      endM: leaveM,
      outdoorActivity: 'none',
    },
    {
      id: 'commute-out',
      label: 'Morning Commute',
      startM: leaveM,
      endM: commuteOutEndM,
      outdoorActivity: 'commute',
    },
    {
      id: 'daytime',
      label: 'Daytime',
      startM: commuteOutEndM,
      endM: returnM,
      outdoorActivity: 'none',
    },
    {
      id: 'commute-back',
      label: 'Evening Commute',
      startM: returnM,
      endM: commuteBackEndM,
      outdoorActivity: 'commute',
    },
    {
      id: 'evening',
      label: 'Evening',
      startM: commuteBackEndM,
      endM: bedM,
      outdoorActivity: 'none',
    },
    {
      id: 'night',
      label: 'Night',
      startM: bedM,
      endM: wakeM,
      outdoorActivity: 'none',
    },
  ];

  return slotDefinitions.map((def) => {
    // Collect PM2.5 hourly points that fall within this slot's time window
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
      startTime: formatM(def.startM),
      endTime: formatM(def.endM),
      forecastMeanPm25: meanPm25,
      forecastLevel,
      outdoorActivity: def.outdoorActivity,
    };
  });
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
    const hasCriticalFlag = member.flags.includes('asthma_copd') || member.flags.includes('heart');

    if (weight > maxWeight) {
      maxWeight = weight;
      bestMember = member;
    } else if (weight === maxWeight) {
      const bestHasCritical =
        bestMember.flags.includes('asthma_copd') || bestMember.flags.includes('heart');
      if (hasCriticalFlag && !bestHasCritical) {
        bestMember = member;
      } else if (!hasCriticalFlag && bestHasCritical) {
        // Keep bestMember
      } else if (member.ageGroup === 'u5' && bestMember.ageGroup !== 'u5') {
        bestMember = member;
      } else if (
        member.ageGroup === '65+' &&
        bestMember.ageGroup !== 'u5' &&
        bestMember.ageGroup !== '65+'
      ) {
        bestMember = member;
      }
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
