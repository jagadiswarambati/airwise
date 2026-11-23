import { describe, it, expect } from 'vitest';
import { evaluatePolicy, PolicyEvaluationResult } from '../../src/domain/policy';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { deriveTimeSlots } from '../../src/domain/radar';
import { ACTION_CATALOG } from '../../src/domain/catalog/actions';
import { HouseholdProfile, AirSnapshot, TimeSlot, Plan } from '../../src/domain/types';
import { generateHourlySeries } from '../fixtures/sample-profiles';
import { assertAllPolicyInvariants } from './predicates';

/**
 * Mutation Testing Suite:
 * Defines 5 mutant policies where 5 core policy safety rules are disabled.
 * Proves that the independent policy matrix oracle FAILS on every single mutant.
 */
describe('Policy Matrix Mutation Checks (Oracle Sensitivity)', () => {
  function getBaseContext() {
    const profile: HouseholdProfile = {
      schemaVersion: 1,
      location: { label: 'Delhi', lat: 28.6, lon: 77.2, country: 'IN' },
      members: [
        { id: 'm1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Child 5-12', ageGroup: '5-12', flags: ['asthma_copd'] },
      ],
      housing: { tenure: 'rent', type: 'apartment' },
      cooking: { fuel: 'lpg', hasExhaust: false },
      homeHeating: 'combustion',
      equipment: { purifier: false, windowAC: false, hvac: false },
      budget: 'free',
      travel: {
        modes: ['car'],
        oneWayKm: 10,
        tripsPerWeek: 5,
        canShiftTime: false,
        canWorkRemotely: false,
        transitAvailable: false,
        outdoorWorker: false,
      },
      routine: {
        wake: '06:00',
        leave: '08:00',
        returnHome: '17:00',
        cooking: ['07:00', '19:00'],
        bed: '22:00',
      },
    };

    const hourly = generateHourlySeries(180); // Severe smog PM2.5 = 180
    const fixedTime = '2026-11-23T12:00:00.000Z';
    const snapshot: AirSnapshot = {
      pm25: { now: 180, hourly },
      trend: 'rising',
      observedAt: fixedTime,
      fetchedAt: fixedTime,
      source: { id: 'test', name: 'Test', dataType: 'modelled', resolutionNote: 'grid' },
      freshness: 'fresh',
    };

    const slots: TimeSlot[] = deriveTimeSlots(profile, snapshot.pm25.hourly);
    return { profile, snapshot, slots };
  }

  it('Mutant 1: Disabling Severe Smog Mode override (P-01) causes oracle failure', () => {
    const { profile, snapshot, slots } = getBaseContext();
    const cleanPolicy = evaluatePolicy(profile, snapshot, slots);
    const cleanPlan = buildDeterministicPlan(profile, snapshot);

    // Mutant 1 introduces forbidden action MO-07 (walking/cycling) in severe smog
    const mo07Action = ACTION_CATALOG.find((a) => a.id === 'MO-07')!;
    const mutantPolicy: PolicyEvaluationResult = {
      ...cleanPolicy,
      approvedCandidates: [
        ...cleanPolicy.approvedCandidates,
        {
          action: mo07Action,
          impact: cleanPolicy.approvedCandidates[0].impact,
          healthUrgency: 1,
          feasibility: 3,
          costFit: 3,
          priorityScore: 20,
          tags: { health: 'Standard', urgency: 'Routine', cost: 'Free', effort: 'Quick' },
          isMandatory: false,
          fixedDisclaimers: [],
        },
      ],
      forbiddenActionIds: cleanPolicy.forbiddenActionIds.filter((id) => id !== 'MO-07'),
    };

    const mutantPlan: Plan = {
      ...cleanPlan,
      topActionIds: ['MO-07', cleanPlan.topActionIds[1], cleanPlan.topActionIds[2]],
    };

    expect(() => {
      assertAllPolicyInvariants({
        profile,
        snapshot,
        slots,
        policy: mutantPolicy,
        plan: mutantPlan,
        communityMode: false,
      });
    }).toThrow(/INVARIANT VIOLATION P-01_MO-07/);
  });

  it('Mutant 2: Disabling Budget Gating (P-10) causes oracle failure', () => {
    const { profile, snapshot, slots } = getBaseContext();
    profile.budget = 'free';
    const cleanPolicy = evaluatePolicy(profile, snapshot, slots);
    const cleanPlan = buildDeterministicPlan(profile, snapshot);

    // Mutant 2 injects low-cost respirator purchase PE-02 into free budget approved candidates
    const pe02Action = ACTION_CATALOG.find((a) => a.id === 'PE-02')!;
    const mutantPolicy: PolicyEvaluationResult = {
      ...cleanPolicy,
      approvedCandidates: [
        ...cleanPolicy.approvedCandidates,
        {
          action: pe02Action,
          impact: cleanPolicy.approvedCandidates[0].impact,
          healthUrgency: 4,
          feasibility: 2,
          costFit: 1,
          priorityScore: 30,
          tags: { health: 'High Urgency', urgency: 'Routine', cost: 'Low Cost', effort: 'Quick' },
          isMandatory: false,
          fixedDisclaimers: [],
        },
      ],
      forbiddenActionIds: cleanPolicy.forbiddenActionIds.filter((id) => id !== 'PE-02'),
    };

    expect(() => {
      assertAllPolicyInvariants({
        profile,
        snapshot,
        slots,
        policy: mutantPolicy,
        plan: cleanPlan,
        communityMode: false,
      });
    }).toThrow(/INVARIANT VIOLATION P-10/);
  });

  it('Mutant 3: Disabling Equipment Gating (P-11) causes oracle failure', () => {
    const { profile, snapshot, slots } = getBaseContext();
    profile.equipment.purifier = false;
    const cleanPolicy = evaluatePolicy(profile, snapshot, slots);
    const cleanPlan = buildDeterministicPlan(profile, snapshot);

    // Mutant 3 approves IN-05 (run air purifier) when household has no air purifier
    const in05Action = ACTION_CATALOG.find((a) => a.id === 'IN-05')!;
    const mutantPolicy: PolicyEvaluationResult = {
      ...cleanPolicy,
      approvedCandidates: [
        ...cleanPolicy.approvedCandidates,
        {
          action: in05Action,
          impact: cleanPolicy.approvedCandidates[0].impact,
          healthUrgency: 4,
          feasibility: 3,
          costFit: 3,
          priorityScore: 40,
          tags: { health: 'High Urgency', urgency: 'Routine', cost: 'Free', effort: 'Quick' },
          isMandatory: false,
          fixedDisclaimers: [],
        },
      ],
      forbiddenActionIds: cleanPolicy.forbiddenActionIds.filter((id) => id !== 'IN-05'),
    };

    expect(() => {
      assertAllPolicyInvariants({
        profile,
        snapshot,
        slots,
        policy: mutantPolicy,
        plan: cleanPlan,
        communityMode: false,
      });
    }).toThrow(/INVARIANT VIOLATION P-11_IN-05/);
  });

  it('Mutant 4: Disabling Community Mode Gating (P-21) causes oracle failure', () => {
    const { profile, snapshot, slots } = getBaseContext();
    const cleanPolicy = evaluatePolicy(profile, snapshot, slots, false);
    const cleanPlan = buildDeterministicPlan(profile, snapshot, { communityMode: false });

    // Mutant 4 approves community pledge action CM-01 when communityMode is disabled
    const cm01Action = ACTION_CATALOG.find((a) => a.id === 'CM-01')!;
    const mutantPolicy: PolicyEvaluationResult = {
      ...cleanPolicy,
      approvedCandidates: [
        ...cleanPolicy.approvedCandidates,
        {
          action: cm01Action,
          impact: cleanPolicy.approvedCandidates[0].impact,
          healthUrgency: 1,
          feasibility: 3,
          costFit: 3,
          priorityScore: 10,
          tags: { health: 'Standard', urgency: 'Routine', cost: 'Free', effort: 'Quick' },
          isMandatory: false,
          fixedDisclaimers: [],
        },
      ],
      forbiddenActionIds: cleanPolicy.forbiddenActionIds.filter((id) => id !== 'CM-01'),
    };

    expect(() => {
      assertAllPolicyInvariants({
        profile,
        snapshot,
        slots,
        policy: mutantPolicy,
        plan: cleanPlan,
        communityMode: false,
      });
    }).toThrow(/INVARIANT VIOLATION P-21_COMMUNITY/);
  });

  it('Mutant 5: Disabling Combustion Heating Gap-Sealing Gating (P-22) causes oracle failure', () => {
    const { profile, snapshot, slots } = getBaseContext();
    profile.budget = 'flexible';
    profile.homeHeating = 'combustion';
    const cleanPolicy = evaluatePolicy(profile, snapshot, slots);
    const cleanPlan = buildDeterministicPlan(profile, snapshot);

    // Mutant 5 approves IN-04 (seal draughts/gaps) in a home with combustion heating (carbon monoxide hazard!)
    const in04Action = ACTION_CATALOG.find((a) => a.id === 'IN-04')!;
    const mutantPolicy: PolicyEvaluationResult = {
      ...cleanPolicy,
      approvedCandidates: [
        ...cleanPolicy.approvedCandidates,
        {
          action: in04Action,
          impact: cleanPolicy.approvedCandidates[0].impact,
          healthUrgency: 3,
          feasibility: 2,
          costFit: 2,
          priorityScore: 25,
          tags: {
            health: 'Standard',
            urgency: 'Routine',
            cost: 'Low Cost',
            effort: 'Moderate Effort',
          },
          isMandatory: false,
          fixedDisclaimers: [],
        },
      ],
      forbiddenActionIds: cleanPolicy.forbiddenActionIds.filter((id) => id !== 'IN-04'),
    };

    expect(() => {
      assertAllPolicyInvariants({
        profile,
        snapshot,
        slots,
        policy: mutantPolicy,
        plan: cleanPlan,
        communityMode: false,
      });
    }).toThrow(/INVARIANT VIOLATION P-22_IN-04/);
  });
});
