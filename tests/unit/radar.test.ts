import { describe, it, expect } from 'vitest';
import {
  computeRiskRadar,
  deriveTimeSlots,
  findMostVulnerableMember,
} from '../../src/domain/radar';
import { PRIYA_PROFILE, HEALTHY_ADULT_PROFILE, createSnapshot } from '../fixtures/sample-profiles';
import { Member } from '../../src/domain/types';

describe('Household Risk Radar Engine', () => {
  it('correctly identifies the most vulnerable member using max(ageWeight, ...flagWeights) per A-27', () => {
    // In Priya's household:
    // Priya (18-64, no flags) weight = 1
    // Child (5-12, asthma_copd) weight = max(2, 4) = 4
    // Elder (65+, no flags) weight = 3
    const mostVulnerable = findMostVulnerableMember(PRIYA_PROFILE.members);
    expect(mostVulnerable.roleLabel).toBe('Child 5-12');
    expect(mostVulnerable.flags).toContain('asthma_copd');
  });

  it('breaks ties towards respiratory conditions and younger children', () => {
    const tiedMembers: Member[] = [
      { id: '1', roleLabel: 'Child A', ageGroup: '5-12', flags: [] }, // weight 2
      { id: '2', roleLabel: 'Infant B', ageGroup: 'u5', flags: [] }, // weight 3
      { id: '3', roleLabel: 'Senior C', ageGroup: '65+', flags: [] }, // weight 3
    ];
    const picked = findMostVulnerableMember(tiedMembers);
    expect(picked.id).toBe('2'); // Infant (u5) prioritized
  });

  it('derives 6 daily routine slots including midnight-crossing sleep window', () => {
    const snapshot = createSnapshot(80);
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);

    expect(slots).toHaveLength(6);
    expect(slots.map((s) => s.id)).toEqual([
      'early-morning',
      'commute-out',
      'daytime',
      'commute-back',
      'evening',
      'night',
    ]);

    // Check night slot crossing midnight
    const nightSlot = slots.find((s) => s.id === 'night');
    expect(nightSlot?.startTime).toBe(PRIYA_PROFILE.routine.bed); // 22:00
    expect(nightSlot?.endTime).toBe(PRIYA_PROFILE.routine.wake); // 06:00
  });

  it('computes Risk Radar and explains why the highest-risk window matters', () => {
    const snapshot = createSnapshot(95); // High pollution snapshot
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);
    const radar = computeRiskRadar(PRIYA_PROFILE, snapshot, slots);

    expect(radar.memberRoleLabel).toBe('Child 5-12');
    expect(radar.slotId).toBeDefined();
    expect(radar.explanation).toContain('Child 5-12');
    expect(radar.score).toBeGreaterThan(0);
    expect(radar.reasonCode).toBeDefined();
  });

  it('handles healthy adult households gracefully with baseline weight 1', () => {
    const snapshot = createSnapshot(50);
    const slots = deriveTimeSlots(HEALTHY_ADULT_PROFILE, snapshot.pm25.hourly);
    const radar = computeRiskRadar(HEALTHY_ADULT_PROFILE, snapshot, slots);

    expect(radar.memberRoleLabel).toBe('Adult 18-64');
    expect(radar.score).toBeGreaterThan(0);
  });
});
