import { describe, it, expect } from 'vitest';
import {
  SEEDED_TOTAL_HOMES,
  SEEDED_CARPOOL_HOUSEHOLDS,
  SEEDED_ASSUMED_ONE_WAY_KM,
  SEEDED_ASSUMED_CARPOOL_DAYS,
  SEEDED_ASSUMED_OCCUPANCY,
  SEEDED_BASELINE_CARPOOL_VKM,
  calculateCommunityAggregateVkm,
  generateShareableBriefing,
  GREEN_MEADOWS_SOCIETY,
} from '../../src/data/community';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';

describe('Community Data Layer & Formula C1', () => {
  it('computes baseline carpool vkm strictly from per-pledge constants via Formula E1', () => {
    // 18 * (12 * 2 * 2 * (1 - 1/2)) = 18 * 24 = 432
    const expected =
      SEEDED_CARPOOL_HOUSEHOLDS *
      (SEEDED_ASSUMED_ONE_WAY_KM *
        2 *
        SEEDED_ASSUMED_CARPOOL_DAYS *
        (1 - 1 / SEEDED_ASSUMED_OCCUPANCY));

    expect(expected).toBe(432);
    expect(SEEDED_BASELINE_CARPOOL_VKM).toBe(432);
    expect(GREEN_MEADOWS_SOCIETY.seededWeeklyAvoidedVkm).toBe(432);
  });

  it('calculates aggregate community vkm combining baseline + user profile contributions', () => {
    // Priya has 12 km one-way, carpool (MO-03: 24 vkm) + remote work (MO-05: 24 vkm) = 48 vkm
    // Aggregate = 432 + 48 = 480 vkm
    const aggregate = calculateCommunityAggregateVkm(PRIYA_PROFILE);
    expect(aggregate).toBe(480);
  });

  it('generates shareable clean-air briefing with injected date, level name, and zero emoji', () => {
    const snapshot = getSampleScenarioSnapshot('severe');
    const customDate = new Date('2026-11-25T08:00:00Z');
    const topActionTitles = [
      'Keep windows closed during morning/evening commute peaks',
      'Wear fitted respirator for essential outdoor trips',
      'Work remotely on high-pollution days',
    ];

    const briefing = generateShareableBriefing(
      snapshot,
      4, // Severe
      topActionTitles,
      true, // user pledged
      customDate,
    );

    // 1. Injected date is formatted and present
    expect(briefing).toContain('Date:');

    // 2. Contains level name, never raw number or the word "advisory"
    expect(briefing).toContain('Severe for your household level');
    expect(briefing.toLowerCase()).not.toContain('advisory');

    // 3. Includes pledge count including user pledge (84 + 1 = 85 / 120)
    expect(briefing).toContain(`85 / ${SEEDED_TOTAL_HOMES} households pledged`);

    // 4. Includes the top 3 actions
    expect(briefing).toContain('1. Keep windows closed');
    expect(briefing).toContain('2. Wear fitted respirator');
    expect(briefing).toContain('3. Work remotely');

    // 5. Includes buddy check single count
    expect(briefing).toContain('Please check on neighbours who may need help today');
    expect(briefing).toContain('43 households');

    // 6. Includes "Demo data" marker and disclaimer
    expect(briefing).toContain('Demo data: Green Meadows Apartments');
    expect(briefing).toContain('Disclaimer: Informational guidance only; not medical advice.');

    // 7. Strictly ZERO emoji characters (Unicode range checks)
    const emojiRegex =
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
    expect(emojiRegex.test(briefing)).toBe(false);

    // 8. No PII: no member names, exact ages, flags, or addresses
    expect(briefing).not.toContain('Priya');
    expect(briefing).not.toContain('asthma');
    expect(briefing).not.toContain('copd');
  });
});
