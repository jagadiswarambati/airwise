import { describe, it, expect } from 'vitest';
import { evaluateIndoorPolicy } from '../../src/domain/indoor';
import {
  PRIYA_PROFILE,
  HEALTHY_ADULT_PROFILE,
  COMBUSTION_HEATING_PROFILE,
} from '../fixtures/sample-profiles';
import { COMBUSTION_SAFETY_CAVEAT } from '../../src/domain/templates';

describe('Indoor-Air Policy Engine (Rules P-11, P-12, P-22)', () => {
  it('recommends standard source control and cleaner room', () => {
    const result = evaluateIndoorPolicy(PRIYA_PROFILE, 2);
    expect(result.actionIds).toContain('IN-09'); // No indoor smoke
    expect(result.actionIds).toContain('IN-10'); // Damp mopping
    expect(result.actionIds).toContain('IN-03'); // Cleaner room
  });

  it('P-11: gates mechanical purifier (IN-05) and AC/HVAC (IN-06) on equipment', () => {
    // Priya has window AC, but no purifier
    const priyaResult = evaluateIndoorPolicy(PRIYA_PROFILE, 2);
    expect(priyaResult.actionIds).not.toContain('IN-05'); // Purifier absent
    expect(priyaResult.actionIds).toContain('IN-06'); // Window AC present

    // Healthy adult has purifier, but no AC
    const adultResult = evaluateIndoorPolicy(HEALTHY_ADULT_PROFILE, 2);
    expect(adultResult.actionIds).toContain('IN-05'); // Purifier present
    expect(adultResult.actionIds).not.toContain('IN-06'); // AC absent
  });

  it('P-12: substitutes low-smoke cooking (IN-08) when kitchen lacks exhaust (IN-07)', () => {
    // Priya has no exhaust
    const priyaResult = evaluateIndoorPolicy(PRIYA_PROFILE, 2);
    expect(priyaResult.actionIds).not.toContain('IN-07');
    expect(priyaResult.actionIds).toContain('IN-08');

    // Adult has exhaust
    const adultResult = evaluateIndoorPolicy(HEALTHY_ADULT_PROFILE, 2);
    expect(adultResult.actionIds).toContain('IN-07');
  });

  it('P-22: forbids gap sealing (IN-04) and attaches CO caveat when combustion heating is used', () => {
    const combustionResult = evaluateIndoorPolicy(COMBUSTION_HEATING_PROFILE, 3);
    // FORBIDDEN to seal gaps!
    expect(combustionResult.forbiddenActionIds).toContain('IN-04');
    expect(combustionResult.actionIds).not.toContain('IN-04');
    // Safety caveat attached
    expect(combustionResult.safetyCaveats).toContain(COMBUSTION_SAFETY_CAVEAT);
    expect(combustionResult.explanations['IN-01']).toContain('carbon monoxide');
  });

  it('P-07: makes window closing (IN-01) mandatory at effective level >= 3', () => {
    const result = evaluateIndoorPolicy(PRIYA_PROFILE, 3);
    expect(result.mandatoryActionIds).toContain('IN-01');
    expect(result.forbiddenActionIds).toContain('IN-02');
  });
});
