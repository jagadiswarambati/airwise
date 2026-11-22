/**
 * Time and Timezone domain utilities.
 * Handles parsing and slot calculations strictly in location-local time,
 * completely independent of runtime or browser timezone settings.
 */

export interface LocalTimeComponents {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  minuteOfDay: number;
}

/**
 * Parses "HH:MM" into minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (mins || 0);
}

/**
 * Formats minutes from midnight into "HH:MM".
 */
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Parses the local hour and minute from a timestamp string.
 *
 * Rules:
 * 1. If "HH:MM", parses directly.
 * 2. If ISO local-time string without timezone (e.g. "2026-11-20T14:00" or "2026-11-20T14:00:00"),
 *    reads the hour and minute characters directly without timezone shifting.
 * 3. If ISO string with offset or trailing Z (e.g. "2026-11-20T14:00:00Z"), converts
 *    using explicit utcOffsetSeconds (or embedded offset) and UTC methods.
 */
export function parseLocalTime(
  timeStr: string,
  utcOffsetSeconds?: number,
): LocalTimeComponents {
  if (!timeStr) {
    return { year: 0, month: 0, day: 0, hour: 0, minute: 0, minuteOfDay: 0 };
  }

  // 1. "HH:MM" format
  const hhmmMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const hour = parseInt(hhmmMatch[1], 10);
    const minute = parseInt(hhmmMatch[2], 10);
    return {
      year: 0,
      month: 0,
      day: 0,
      hour,
      minute,
      minuteOfDay: hour * 60 + minute,
    };
  }

  // 2. ISO string without timezone offset: "YYYY-MM-DDTHH:MM(:SS)?"
  const isoLocalMatch = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (isoLocalMatch) {
    const year = parseInt(isoLocalMatch[1], 10);
    const month = parseInt(isoLocalMatch[2], 10);
    const day = parseInt(isoLocalMatch[3], 10);
    const hour = parseInt(isoLocalMatch[4], 10);
    const minute = parseInt(isoLocalMatch[5], 10);
    return {
      year,
      month,
      day,
      hour,
      minute,
      minuteOfDay: hour * 60 + minute,
    };
  }

  // 3. String has an offset or Z
  let effectiveOffsetSeconds = utcOffsetSeconds;
  const offsetMatch = timeStr.match(/([+-]\d{2}):?(\d{2})$/);
  if (effectiveOffsetSeconds === undefined) {
    if (offsetMatch) {
      const sign = offsetMatch[1].startsWith('-') ? -1 : 1;
      const offH = parseInt(offsetMatch[1].replace(/[+-]/, ''), 10);
      const offM = parseInt(offsetMatch[2], 10);
      effectiveOffsetSeconds = sign * (offH * 3600 + offM * 60);
    } else if (timeStr.endsWith('Z')) {
      effectiveOffsetSeconds = 0;
    } else {
      effectiveOffsetSeconds = 0;
    }
  }

  const parsedEpoch = Date.parse(timeStr);
  if (isNaN(parsedEpoch)) {
    return { year: 0, month: 0, day: 0, hour: 0, minute: 0, minuteOfDay: 0 };
  }

  const localEpoch = parsedEpoch + effectiveOffsetSeconds * 1000;
  const d = new Date(localEpoch);
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
  };
}

/**
 * Returns the local hour (0..23) of a timestamp.
 */
export function parseLocalHour(timeStr: string, utcOffsetSeconds?: number): number {
  return parseLocalTime(timeStr, utcOffsetSeconds).hour;
}

/**
 * Returns the local minute of day (0..1439) of a timestamp.
 */
export function parseLocalMinuteOfDay(timeStr: string, utcOffsetSeconds?: number): number {
  return parseLocalTime(timeStr, utcOffsetSeconds).minuteOfDay;
}

/**
 * Computes "now in the location" from an injected Date plus utcOffsetSeconds.
 */
export function getNowInLocation(
  now: Date = new Date(),
  utcOffsetSeconds: number = 0,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  minuteOfDay: number;
  dateStr: string;
} {
  const localEpoch = now.getTime() + utcOffsetSeconds * 1000;
  const d = new Date(localEpoch);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
    dateStr,
  };
}

/**
 * Checks whether a minute of day falls within a defined slot [startMinute, endMinute).
 * Handles slots that wrap across midnight (e.g. night: 22:00 -> 06:00).
 */
export function isMinuteInSlot(
  minuteOfDay: number,
  startMinute: number,
  endMinute: number,
): boolean {
  if (startMinute <= endMinute) {
    return minuteOfDay >= startMinute && minuteOfDay < endMinute;
  }
  // Wraps past midnight
  return minuteOfDay >= startMinute || minuteOfDay < endMinute;
}

/**
 * Converts a location-local timestamp string into exact UTC epoch milliseconds.
 * Works uniformly whether the string contains an offset/Z or is a local representation
 * combined with an explicit utcOffsetSeconds.
 */
export function parseLocalTimeToUtcEpoch(
  timeStr: string,
  utcOffsetSeconds: number = 0,
): number {
  const comp = parseLocalTime(timeStr, utcOffsetSeconds);
  if (comp.year === 0) return 0;
  return Date.UTC(comp.year, comp.month - 1, comp.day, comp.hour, comp.minute) - utcOffsetSeconds * 1000;
}

