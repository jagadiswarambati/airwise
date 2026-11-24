import { describe, it, expect } from 'vitest';
import {
  computeBaseLevel,
  computeEffectiveLevel,
  hasSensitiveMembers,
  LEVEL_NAMES,
} from '../../src/domain/levels';
import { type Member } from '../../src/domain/types';

describe('Risk Levels & Vulnerability Engine (Rule P-02)', () => {
  const healthyAdults: Member[] = [
    { id: '1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
    { id: '2', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
  ];

  const sensitiveChild: Member[] = [
    { id: '1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
    { id: '2', roleLabel: 'Child 5-12', ageGroup: '5-12', flags: [] },
  ];

  const sensitiveFlaggedAdult: Member[] = [
    { id: '1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: ['asthma_copd'] },
  ];

  const elderlyMember: Member[] = [{ id: '1', roleLabel: 'Adult 65+', ageGroup: '65+', flags: [] }];

  const infantMember: Member[] = [
    { id: '1', roleLabel: 'Infant under 5', ageGroup: 'u5', flags: [] },
  ];

  it('detects sensitive members across age groups and health flags', () => {
    expect(hasSensitiveMembers(healthyAdults)).toBe(false);
    expect(hasSensitiveMembers(sensitiveChild)).toBe(true);
    expect(hasSensitiveMembers(sensitiveFlaggedAdult)).toBe(true);
    expect(hasSensitiveMembers(elderlyMember)).toBe(true);
    expect(hasSensitiveMembers(infantMember)).toBe(true);
  });

  it('applies Rule P-02: base level + 1 for sensitive households, capped at 4', () => {
    // Healthy household: effective level equals base level
    expect(computeEffectiveLevel(0, healthyAdults)).toBe(0);
    expect(computeEffectiveLevel(1, healthyAdults)).toBe(1);
    expect(computeEffectiveLevel(2, healthyAdults)).toBe(2);
    expect(computeEffectiveLevel(3, healthyAdults)).toBe(3);
    expect(computeEffectiveLevel(4, healthyAdults)).toBe(4);

    // Sensitive child household: base + 1 bump
    expect(computeEffectiveLevel(0, sensitiveChild)).toBe(1);
    expect(computeEffectiveLevel(1, sensitiveChild)).toBe(2);
    expect(computeEffectiveLevel(2, sensitiveChild)).toBe(3);
    expect(computeEffectiveLevel(3, sensitiveChild)).toBe(4);
    expect(computeEffectiveLevel(4, sensitiveChild)).toBe(4); // capped at 4

    // Sensitive health flags: base + 1 bump
    expect(computeEffectiveLevel(1, sensitiveFlaggedAdult)).toBe(2);
    expect(computeEffectiveLevel(3, sensitiveFlaggedAdult)).toBe(4);
  });

  it('computes base level from PM2.5 and defaults to level 2 (Caution) when null (P-04)', () => {
    expect(computeBaseLevel(25, 'IN')).toBe(0);
    expect(computeBaseLevel(50, 'IN')).toBe(1);
    expect(computeBaseLevel(75, 'IN')).toBe(2);
    expect(computeBaseLevel(100, 'IN')).toBe(3);
    expect(computeBaseLevel(150, 'IN')).toBe(4);

    // Rule P-04: null PM2.5 defaults to 2 (Caution)
    expect(computeBaseLevel(null, 'IN')).toBe(2);
  });

  it('provides official non-medical plain language names', () => {
    expect(LEVEL_NAMES[0]).toBe('Clear');
    expect(LEVEL_NAMES[1]).toBe('Watch');
    expect(LEVEL_NAMES[2]).toBe('Caution');
    expect(LEVEL_NAMES[3]).toBe('Protect');
    expect(LEVEL_NAMES[4]).toBe('Severe for your household');
  });
});
