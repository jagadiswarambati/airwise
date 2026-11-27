import { describe, it, expect } from 'vitest';
import '../../src/lib/zodConfig';
import { z } from 'zod';
import { HouseholdProfileSchema } from '../../src/domain/types';

describe('Zod strict-CSP configuration (src/lib/zodConfig.ts)', () => {
  it('enables jitless mode globally and still validates schemas cleanly', () => {
    expect(z.config().jitless).toBe(true);

    const valid = HouseholdProfileSchema.safeParse({
      schemaVersion: 1,
      location: { label: 'Delhi', lat: 28.61, lon: 77.21, country: 'IN' },
      members: [{ id: 'm1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] }],
      housing: { tenure: 'rent', type: 'apartment' },
      cooking: { fuel: 'lpg', hasExhaust: true },
      homeHeating: 'none',
      equipment: { purifier: false, windowAC: false, hvac: false },
      budget: 'low',
      travel: {
        modes: ['bus'],
        oneWayKm: 5,
        tripsPerWeek: 5,
        canShiftTime: true,
        canWorkRemotely: false,
        transitAvailable: true,
        outdoorWorker: false,
      },
      routine: {
        wake: '06:00',
        leave: '08:00',
        returnHome: '18:00',
        cooking: ['07:00'],
        bed: '22:00',
      },
    });

    expect(valid.success).toBe(true);
  });
});
