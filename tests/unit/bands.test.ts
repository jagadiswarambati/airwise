import { describe, it, expect } from 'vitest';
import { getBandForPm25, INDIA_CPCB_BANDS, US_EPA_BANDS } from '../../src/domain/config/bands';

describe('Risk Bands and Boundary Values', () => {
  describe('India CPCB Bands', () => {
    it('maps boundaries cleanly for CPCB PM2.5 categories', () => {
      // Band 0: Clear (<= 30.0)
      expect(getBandForPm25(0, 'IN')).toBe(0);
      expect(getBandForPm25(15.5, 'IN')).toBe(0);
      expect(getBandForPm25(30.0, 'IN')).toBe(0);

      // Band 1: Watch (30.1 to 60.0)
      expect(getBandForPm25(30.1, 'IN')).toBe(1);
      expect(getBandForPm25(45.0, 'IN')).toBe(1);
      expect(getBandForPm25(60.0, 'IN')).toBe(1);

      // Band 2: Caution (60.1 to 90.0)
      expect(getBandForPm25(60.1, 'IN')).toBe(2);
      expect(getBandForPm25(75.0, 'IN')).toBe(2);
      expect(getBandForPm25(90.0, 'IN')).toBe(2);

      // Band 3: Protect (90.1 to 120.0)
      expect(getBandForPm25(90.1, 'IN')).toBe(3);
      expect(getBandForPm25(105.0, 'IN')).toBe(3);
      expect(getBandForPm25(120.0, 'IN')).toBe(3);

      // Band 4: Severe for your household (>= 120.1)
      expect(getBandForPm25(120.1, 'IN')).toBe(4);
      expect(getBandForPm25(250.0, 'IN')).toBe(4);
      expect(getBandForPm25(600.0, 'IN')).toBe(4);
    });

    it('safeguards negative values to level 0', () => {
      expect(getBandForPm25(-10, 'IN')).toBe(0);
    });
  });

  describe('US EPA Bands (2024 Revised Standard)', () => {
    it('maps boundaries cleanly for US EPA categories', () => {
      // Band 0: Clear (<= 9.0)
      expect(getBandForPm25(0, 'US')).toBe(0);
      expect(getBandForPm25(9.0, 'US')).toBe(0);

      // Band 1: Watch (9.1 to 35.4)
      expect(getBandForPm25(9.1, 'US')).toBe(1);
      expect(getBandForPm25(35.4, 'US')).toBe(1);

      // Band 2: Caution (35.5 to 55.4)
      expect(getBandForPm25(35.5, 'US')).toBe(2);
      expect(getBandForPm25(55.4, 'US')).toBe(2);

      // Band 3: Protect (55.5 to 125.4)
      expect(getBandForPm25(55.5, 'US')).toBe(3);
      expect(getBandForPm25(125.4, 'US')).toBe(3);

      // Band 4: Severe (>= 125.5)
      expect(getBandForPm25(125.5, 'US')).toBe(4);
      expect(getBandForPm25(300.0, 'US')).toBe(4);
    });
  });

  it('contains valid metadata and verified tags in band profiles', () => {
    expect(INDIA_CPCB_BANDS.verified).toBe(true);
    expect(US_EPA_BANDS.verified).toBe(true);
    expect(INDIA_CPCB_BANDS.bands).toHaveLength(5);
    expect(US_EPA_BANDS.bands).toHaveLength(5);
  });
});

