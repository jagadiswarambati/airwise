import { describe, it, expect } from 'vitest';
import { prepareAIPlanInput } from '../../src/ai/client';
import { AIPlanInputSchema } from '../../src/ai/schema';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { deriveTimeSlots } from '../../src/domain/radar';
import { evaluatePolicy } from '../../src/domain/policy';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';

describe('AI Request Privacy & Data Minimization Guard (SECURITY_PRIVACY Section 18)', () => {
  it('prepares an AI plan input payload containing zero PII or coordinates', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly, 'IN');
    const deterministicPlan = buildDeterministicPlan(PRIYA_PROFILE, snapshot, { targetRegion: 'IN' });
    const policyResult = evaluatePolicy(PRIYA_PROFILE, snapshot, slots, false, 'IN');

    const input = prepareAIPlanInput(
      deterministicPlan,
      snapshot,
      PRIYA_PROFILE,
      slots,
      policyResult,
    );

    // 1. Strict schema compliance
    const parseRes = AIPlanInputSchema.safeParse(input);
    expect(parseRes.success).toBe(true);

    const serialized = JSON.stringify(input);

    // 2. No location names or city labels
    expect(serialized).not.toContain(PRIYA_PROFILE.location.label);
    expect(serialized).not.toContain('Hyderabad');

    // 3. No GPS coordinates (latitude or longitude)
    expect(serialized).not.toContain(String(PRIYA_PROFILE.location.lat));
    expect(serialized).not.toContain(String(PRIYA_PROFILE.location.lon));
    expect(serialized).not.toContain('lat');
    expect(serialized).not.toContain('lon');
    expect(serialized).not.toContain('coordinates');

    // 4. No individual member names or personal labels
    expect(serialized).not.toContain('Priya');
    for (const m of PRIYA_PROFILE.members) {
      if (m.roleLabel) {
        // Exact roleLabel string like "Child, 8" must NOT be in serialized payload
        expect(serialized).not.toContain(m.roleLabel);
      }
    }

    // 5. Radar contains only age bands and slot IDs
    expect(['u5', '5-12', '13-17', '18-64', '65+', 'mixed']).toContain(input.radar.memberBand);
    expect(input.radar.peakSlotId).toBeDefined();

    // 6. No candidate titles or descriptions sent from client
    expect(serialized).not.toContain('candidateSummaries');
    expect(serialized).not.toContain('Keep windows');

    // 7. No client-provided allowlisted numbers sent in request
    expect(serialized).not.toContain('allowlistedNumbers');
  });
});
