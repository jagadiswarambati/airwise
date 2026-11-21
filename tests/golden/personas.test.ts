import { describe, it, expect } from 'vitest';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { HouseholdProfile } from '../../src/domain/types';
import { evaluatePolicy } from '../../src/domain/policy';
import { deriveTimeSlots } from '../../src/domain/radar';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';

describe('Golden Persona Tests across Scenarios', () => {
  const scenarios = ['clear', 'moderate', 'severe', 'stale'] as const;

  // Persona 1: Priya (Multi-Generational Urban Household with Child & Senior)
  describe('Persona 1: Priya (Multi-Generational Urban)', () => {
    it.each(scenarios)('evaluates safely in scenario: %s', (scenario) => {
      const snapshot = getSampleScenarioSnapshot(scenario);
      const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);

      expect(plan.topActionIds).toHaveLength(3);
      expect(plan.timeline).toHaveLength(6);

      if (scenario === 'severe') {
        expect(plan.flags.severeMode).toBe(true);
        expect(plan.topActionIds).toContain('IN-01'); // Windows closed mandatory
        expect(plan.topActionIds).toContain('PE-03'); // Indoor play mandatory for 8yo child
        expect(plan.topActionIds).not.toContain('MO-07'); // Walking forbidden
      }

      if (scenario === 'clear') {
        expect(plan.flags.severeMode).toBe(false);
        expect(['high', 'medium']).toContain(plan.planConfidence);
      }

      if (scenario === 'stale') {
        expect(plan.planConfidence).toBe('low');
      }
    });
  });

  // Persona 2: Arjun (Outdoor Gig Delivery Worker, Low Budget, Motorcycle)
  describe('Persona 2: Arjun (Outdoor Worker, Low Budget)', () => {
    const arjunProfile: HouseholdProfile = {
      schemaVersion: 1,
      location: { label: 'Bengaluru, India', lat: 12.97, lon: 77.59, country: 'IN' },
      housing: { tenure: 'rent', type: 'house' },
      homeHeating: 'none',
      cooking: { fuel: 'lpg', hasExhaust: false },
      equipment: { purifier: false, windowAC: false, hvac: false },
      budget: 'low',
      members: [{ id: 'm1', roleLabel: 'Adult, 26 (Delivery Worker)', ageGroup: '18-64', flags: [] }],
      travel: {
        modes: ['two_wheeler'],
        oneWayKm: 25,
        tripsPerWeek: 6,
        canShiftTime: false,
        canWorkRemotely: false,
        transitAvailable: false,
        outdoorWorker: true,
      },
      routine: {
        wake: '07:00',
        leave: '08:00',
        returnHome: '20:00',
        cooking: ['20:30'],
        bed: '23:00',
      },
    };

    it('never requires purifier purchases or high-budget actions', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const plan = buildDeterministicPlan(arjunProfile, snapshot);

      // Low budget gating (Rule P-10)
      expect(plan.topActionIds).not.toContain('IN-05'); // Purifier absent
      expect(plan.topActionIds).not.toContain('IN-06'); // AC absent
      // Cooking exhaust absent -> recommends low-smoke cooking (Rule P-12)
      const allActionIds = plan.timeline.flatMap((t) => t.actionIds);
      expect(allActionIds).toContain('IN-08');
    });

    it('approves respirator (PE-02) for high-exposure motorcycle trips in severe air', () => {
      const snapshot = getSampleScenarioSnapshot('severe');
      const slots = deriveTimeSlots(arjunProfile, snapshot.pm25.hourly, 'IN');
      const policy = evaluatePolicy(arjunProfile, snapshot, slots, false, 'IN');

      const approvedIds = policy.approvedCandidates.map((c) => c.action.id);
      expect(approvedIds).toContain('PE-02');

      const plan = buildDeterministicPlan(arjunProfile, snapshot);
      expect(plan.flags.severeMode).toBe(true);
    });
  });

  // Persona 3: Ramesh & Meena (Elderly Couple with Unvented Combustion Heating & Biomass)
  describe('Persona 3: Ramesh & Meena (Elderly, Combustion Heating)', () => {
    const rameshProfile: HouseholdProfile = {
      schemaVersion: 1,
      location: { label: 'Shimla, India', lat: 31.10, lon: 77.17, country: 'IN' },
      housing: { tenure: 'own', type: 'house' },
      homeHeating: 'combustion', // Combustion heating!
      cooking: { fuel: 'biomass', hasExhaust: false }, // Biomass without exhaust!
      equipment: { purifier: false, windowAC: false, hvac: false },
      budget: 'free',
      members: [
        { id: 'm1', roleLabel: 'Senior, 71', ageGroup: '65+', flags: ['heart'] },
        { id: 'm2', roleLabel: 'Senior, 67', ageGroup: '65+', flags: ['asthma_copd'] },
      ],
      travel: {
        modes: ['walk'],
        oneWayKm: 2,
        tripsPerWeek: 2,
        canShiftTime: false,
        canWorkRemotely: false,
        transitAvailable: false,
        outdoorWorker: false,
      },
      routine: {
        wake: '06:00',
        leave: '09:00',
        returnHome: '10:30',
        cooking: ['11:00'],
        bed: '21:00',
      },
    };

    it('strictly forbids draft sealing (IN-04) to prevent carbon monoxide poisoning (Rule P-22)', () => {
      for (const scenario of scenarios) {
        const snapshot = getSampleScenarioSnapshot(scenario);
        const plan = buildDeterministicPlan(rameshProfile, snapshot);

        const allActionIds = plan.timeline.flatMap((t) => t.actionIds);
        expect(allActionIds).not.toContain('IN-04');
        expect(plan.topActionIds).not.toContain('IN-04');
      }
    });

    it('strictly restricts all recommendations to free tier (Rule P-10)', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const plan = buildDeterministicPlan(rameshProfile, snapshot);

      for (const cand of plan.topActions) {
        expect(cand.action.cost).toBe('free');
      }
    });
  });

  // Persona 4: Ananya (Student with Infant Sibling under 5)
  describe('Persona 4: Ananya & Infant (Choking & Suffocation Safety)', () => {
    const infantProfile: HouseholdProfile = {
      schemaVersion: 1,
      location: { label: 'Delhi, India', lat: 28.61, lon: 77.21, country: 'IN' },
      housing: { tenure: 'rent', type: 'apartment' },
      homeHeating: 'none',
      cooking: { fuel: 'electric', hasExhaust: false },
      equipment: { purifier: false, windowAC: false, hvac: false },
      budget: 'free',
      members: [
        { id: 'm1', roleLabel: 'Adult, 21 (Student)', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Infant, 4 months', ageGroup: 'u5', flags: [] },
      ],
      travel: {
        modes: ['bus', 'walk'],
        oneWayKm: 5,
        tripsPerWeek: 5,
        canShiftTime: true,
        canWorkRemotely: false,
        transitAvailable: true,
        outdoorWorker: false,
      },
      routine: {
        wake: '07:30',
        leave: '08:30',
        returnHome: '16:00',
        cooking: ['19:00'],
        bed: '23:00',
      },
    };

    it('never suggests masks or respirators for under-5 infants (Rule P-13)', () => {
      const snapshot = getSampleScenarioSnapshot('severe');
      const plan = buildDeterministicPlan(infantProfile, snapshot);

      // Outdoor play shift (PE-03) and window seal (IN-01) mandatory
      expect(plan.topActionIds).toContain('PE-03');
      expect(plan.topActionIds).toContain('IN-01');
    });

    it('excludes public transit (MO-02) for sensitive members at Level >= 3 due to outdoor wait risk (Rule P-18 / A-25)', () => {
      const snapshot = getSampleScenarioSnapshot('severe');
      const plan = buildDeterministicPlan(infantProfile, snapshot);

      const allActionIds = plan.timeline.flatMap((t) => t.actionIds);
      expect(allActionIds).not.toContain('MO-02');
    });
  });

  // Persona 5: Vikram & Neha (Tech Professionals, High Budget, Full Equipment)
  describe('Persona 5: Vikram & Neha (Tech, Full Equipment)', () => {
    const techProfile: HouseholdProfile = {
      schemaVersion: 1,
      location: { label: 'Hyderabad, India', lat: 17.38, lon: 78.48, country: 'IN' },
      housing: { tenure: 'own', type: 'apartment' },
      homeHeating: 'electric',
      cooking: { fuel: 'electric', hasExhaust: true },
      equipment: { purifier: true, windowAC: false, hvac: true },
      budget: 'flexible',
      members: [
        { id: 'm1', roleLabel: 'Adult, 38', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Adult, 36', ageGroup: '18-64', flags: [] },
      ],
      travel: {
        modes: ['car'],
        oneWayKm: 18,
        tripsPerWeek: 4,
        canShiftTime: true,
        canWorkRemotely: true,
        transitAvailable: true,
        outdoorWorker: false,
      },
      routine: {
        wake: '07:00',
        leave: '09:00',
        returnHome: '18:00',
        cooking: ['19:30'],
        bed: '23:30',
      },
    };

    it('enables purifier and HVAC recirculation actions when equipment is owned (Rule P-11)', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const plan = buildDeterministicPlan(techProfile, snapshot);

      const allActionIds = plan.timeline.flatMap((t) => t.actionIds);
      expect(allActionIds).toContain('IN-05'); // Purifier
      expect(allActionIds).toContain('IN-06'); // HVAC
    });
  });
});
