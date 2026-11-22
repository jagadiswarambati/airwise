import { describe, expect, it } from 'vitest';
import {
  formatMinutesToTime,
  getNowInLocation,
  isMinuteInSlot,
  parseLocalHour,
  parseLocalMinuteOfDay,
  parseLocalTime,
  parseLocalTimeToUtcEpoch,
  parseTimeToMinutes,
} from '../../src/domain/time';

describe('Time and Timezone Primitives', () => {
  describe('parseTimeToMinutes and formatMinutesToTime', () => {
    it('parses HH:MM into minutes from midnight', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('06:30')).toBe(390);
      expect(parseTimeToMinutes('12:00')).toBe(720);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('formats minutes from midnight into HH:MM', () => {
      expect(formatMinutesToTime(0)).toBe('00:00');
      expect(formatMinutesToTime(390)).toBe('06:30');
      expect(formatMinutesToTime(720)).toBe('12:00');
      expect(formatMinutesToTime(1439)).toBe('23:59');
    });
  });

  describe('parseLocalTime', () => {
    it('parses clock string HH:MM directly', () => {
      const res = parseLocalTime('08:45');
      expect(res.hour).toBe(8);
      expect(res.minute).toBe(45);
      expect(res.minuteOfDay).toBe(8 * 60 + 45);
    });

    it('parses ISO local string without timezone offset directly', () => {
      const res = parseLocalTime('2026-11-22T14:30:00');
      expect(res.year).toBe(2026);
      expect(res.month).toBe(11);
      expect(res.day).toBe(22);
      expect(res.hour).toBe(14);
      expect(res.minute).toBe(30);
      expect(res.minuteOfDay).toBe(14 * 60 + 30);
    });

    it('parses ISO local string without seconds directly', () => {
      const res = parseLocalTime('2026-11-22T07:15');
      expect(res.hour).toBe(7);
      expect(res.minute).toBe(15);
      expect(res.minuteOfDay).toBe(7 * 60 + 15);
    });

    it('applies explicit utcOffsetSeconds to UTC / Z timestamp', () => {
      // 06:00:00Z in UTC + 5:30 (19800s) = 11:30 local time
      const res = parseLocalTime('2026-11-22T06:00:00Z', 19800);
      expect(res.hour).toBe(11);
      expect(res.minute).toBe(30);
      expect(res.minuteOfDay).toBe(11 * 60 + 30);
    });

    it('handles embedded timezone offset correctly', () => {
      const res = parseLocalTime('2026-11-22T12:00:00+05:30');
      // When converted to local time using its embedded offset, local hour is 12
      expect(res.hour).toBe(12);
      expect(res.minute).toBe(0);
    });

    it('returns zeroes for empty or invalid input', () => {
      expect(parseLocalTime('')).toEqual({
        year: 0,
        month: 0,
        day: 0,
        hour: 0,
        minute: 0,
        minuteOfDay: 0,
      });
      expect(parseLocalTime('not-a-date')).toEqual({
        year: 0,
        month: 0,
        day: 0,
        hour: 0,
        minute: 0,
        minuteOfDay: 0,
      });
    });
  });

  describe('parseLocalHour and parseLocalMinuteOfDay', () => {
    it('extracts local hour and minuteOfDay reliably', () => {
      expect(parseLocalHour('2026-11-20T17:45:00')).toBe(17);
      expect(parseLocalMinuteOfDay('2026-11-20T17:45:00')).toBe(17 * 60 + 45);
    });
  });

  describe('getNowInLocation', () => {
    it('calculates the date and time in the location using explicit offset', () => {
      // UTC 2026-11-20T20:00:00Z + 19800s (5.5h) = 2026-11-21 01:30:00
      const utcDate = new Date(Date.UTC(2026, 10, 20, 20, 0, 0));
      const loc = getNowInLocation(utcDate, 19800);

      expect(loc.year).toBe(2026);
      expect(loc.month).toBe(11);
      expect(loc.day).toBe(21);
      expect(loc.hour).toBe(1);
      expect(loc.minute).toBe(30);
      expect(loc.dateStr).toBe('2026-11-21');
    });

    it('defaults to 0 offset when omitted', () => {
      const utcDate = new Date(Date.UTC(2026, 10, 20, 10, 15, 0));
      const loc = getNowInLocation(utcDate);

      expect(loc.hour).toBe(10);
      expect(loc.minute).toBe(15);
      expect(loc.dateStr).toBe('2026-11-20');
    });
  });

  describe('isMinuteInSlot', () => {
    it('checks daytime slot within single day boundary', () => {
      const start = 360; // 06:00
      const end = 450; // 07:30

      expect(isMinuteInSlot(360, start, end)).toBe(true);
      expect(isMinuteInSlot(400, start, end)).toBe(true);
      expect(isMinuteInSlot(449, start, end)).toBe(true);
      expect(isMinuteInSlot(450, start, end)).toBe(false);
      expect(isMinuteInSlot(300, start, end)).toBe(false);
    });

    it('checks night slot wrapping across midnight', () => {
      const start = 1320; // 22:00
      const end = 360; // 06:00

      expect(isMinuteInSlot(1320, start, end)).toBe(true); // 22:00
      expect(isMinuteInSlot(1400, start, end)).toBe(true); // 23:20
      expect(isMinuteInSlot(0, start, end)).toBe(true); // 00:00
      expect(isMinuteInSlot(120, start, end)).toBe(true); // 02:00
      expect(isMinuteInSlot(359, start, end)).toBe(true); // 05:59
      expect(isMinuteInSlot(360, start, end)).toBe(false); // 06:00
      expect(isMinuteInSlot(720, start, end)).toBe(false); // 12:00
    });
  });

  describe('parseLocalTimeToUtcEpoch', () => {
    it('converts local timestamp to UTC epoch using explicit offset', () => {
      // 14:00 in India (+5:30) is 08:30 UTC
      const epoch = parseLocalTimeToUtcEpoch('2026-11-20T14:00:00', 19800);
      const expectedUtc = Date.UTC(2026, 10, 20, 8, 30, 0);
      expect(epoch).toBe(expectedUtc);
    });
  });
});
