import {
  type AirSnapshot,
  type HouseholdProfile,
  type RiskLevel,
  type RiskRadarResult,
  type TimeSlot,
} from '../../../domain/types';
import { parseLocalTime, parseTimeToMinutes, formatMinutesToTime, isMinuteInSlot } from '../../../domain/time';
import { computeBaseLevel, LEVEL_NAMES } from '../../../domain/levels';
import { deriveTimeSlots } from '../../../domain/radar';

export interface WakingPoint {
  hour: number;
  timeLabel: string;
  pm25: number;
  level: RiskLevel;
  levelWord: string;
  isNow: boolean;
  isRadarSlot: boolean;
  marker?: string;
}

interface RoutineHours {
  startH: number;
  endH: number;
  leaveH: number;
  returnH: number;
  cookHours: number[];
}

function getRoutineHours(profile: HouseholdProfile): RoutineHours {
  const routine = profile.routine || {
    wake: '07:00',
    bed: '22:00',
    leave: '08:00',
    returnHome: '18:00',
    cooking: ['07:30', '19:30'],
  };
  const wakeM = parseTimeToMinutes(routine.wake || '07:00');
  const bedM = parseTimeToMinutes(routine.bed || '22:00');
  const wakeH = Math.floor(wakeM / 60);
  const bedH = Math.floor(bedM / 60);

  const startH = bedH > wakeH ? wakeH : 6;
  const endH = bedH > wakeH ? bedH : 22;

  const leaveH = Math.floor(parseTimeToMinutes(routine.leave || '08:00') / 60);
  const returnH = Math.floor(parseTimeToMinutes(routine.returnHome || '18:00') / 60);
  const cookHours = (routine.cooking || ['07:30', '19:30']).map((t) =>
    Math.floor(parseTimeToMinutes(t) / 60),
  );

  return { startH, endH, leaveH, returnH, cookHours };
}

function buildHourlyMap(snapshot: AirSnapshot, utcOffset?: number): Map<number, number> {
  const hourlyMap = new Map<number, number>();
  for (const pt of snapshot.pm25.hourly) {
    if (!pt.time) continue;
    const h = parseLocalTime(pt.time, utcOffset).hour;
    if (pt.pm25 !== null && !isNaN(pt.pm25)) {
      hourlyMap.set(h, pt.pm25);
    }
  }
  return hourlyMap;
}

function getPointMarker(h: number, r: RoutineHours): string | undefined {
  if (h === r.leaveH) return 'Leave';
  if (h === r.returnH) return 'Return';
  if (r.cookHours.includes(h)) return 'Cook';
  return undefined;
}

function checkRadarSlot(h: number, slot?: TimeSlot): boolean {
  if (!slot) return false;
  const startM = parseTimeToMinutes(slot.startTime);
  const endM = parseTimeToMinutes(slot.endTime);
  return isMinuteInSlot(h * 60 + 30, startM, endM);
}

function buildSummaryLabel(points: WakingPoint[]): string {
  const pmValues = points.map((p) => Math.round(p.pm25));
  const minPm = pmValues.length > 0 ? Math.min(...pmValues) : 20;
  const maxPm = pmValues.length > 0 ? Math.max(...pmValues) : 50;

  const peakPoint = points.find((p) => Math.round(p.pm25) === maxPm) || points[0];
  const peakTime = peakPoint ? peakPoint.timeLabel : '';
  const peakLevelWord = peakPoint ? peakPoint.levelWord : '';

  const firstTime = points[0]?.timeLabel || '07:00';
  const lastTime = points[points.length - 1]?.timeLabel || '22:00';

  return `Hourly PM2.5 forecast for waking hours (${firstTime} to ${lastTime}): ranges from ${minPm} to ${maxPm} µg/m³, peaking around ${peakTime} in the ${peakLevelWord} band.`;
}

export function computeWakingPoints(
  snapshot: AirSnapshot,
  profile: HouseholdProfile,
  radar?: RiskRadarResult,
): { wakingPoints: WakingPoint[]; summaryAriaLabel: string } {
  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const utcOffset = snapshot.utcOffsetSeconds;
  const r = getRoutineHours(profile);

  const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, targetRegion, utcOffset);
  const targetRadarSlot = radar ? slots.find((s) => s.id === radar.slotId) : undefined;

  const nowHour = parseLocalTime(
    snapshot.fetchedAt || snapshot.pm25.hourly[0]?.time || '',
    utcOffset,
  ).hour;

  const hourlyMap = buildHourlyMap(snapshot, utcOffset);

  const wakingPoints: WakingPoint[] = [];
  for (let h = r.startH; h <= r.endH; h++) {
    const pm25 = hourlyMap.get(h) ?? snapshot.pm25.now ?? 25;
    const level = computeBaseLevel(pm25, targetRegion);
    const levelWord = LEVEL_NAMES[level];
    const isNow = h === nowHour;
    const isRadarSlot = checkRadarSlot(h, targetRadarSlot);
    const marker = getPointMarker(h, r);

    wakingPoints.push({
      hour: h,
      timeLabel: formatMinutesToTime(h * 60),
      pm25,
      level,
      levelWord,
      isNow,
      isRadarSlot,
      marker,
    });
  }

  const summaryAriaLabel = buildSummaryLabel(wakingPoints);
  return { wakingPoints, summaryAriaLabel };
}
