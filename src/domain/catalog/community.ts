import { type Action } from '../types';

/**
 * Community Category Actions (CM-01 to CM-04).
 */
export const COMMUNITY_ACTIONS: Action[] = [
  {
    id: 'CM-01',
    title: 'Adopt neighborhood no-burning pledge',
    category: 'community',
    cost: 'free',
    effort: 1,
    evidence: 'high',
    templateKey: 'CM-01',
    impactSpec: {
      exposure: {
        direction: 'reduces',
        label: 'Recommended',
        evidence: 'medium',
        noteTemplate: 'Prevents localized smoke plumes from outdoor waste burning.',
      },
      emissions: {
        direction: 'reduces',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Directly halts community open combustion emissions.',
      },
      assumptions: ['Community has organized municipal waste disposal.'],
      doesNotChange: 'Does not eliminate regional background smog.',
    },
  },
  {
    id: 'CM-02',
    title: 'Coordinate building carpool board',
    category: 'community',
    cost: 'free',
    effort: 2,
    evidence: 'medium',
    templateKey: 'CM-02',
    impactSpec: {
      exposure: {
        direction: 'neutral',
        label: 'Recommended',
        evidence: 'medium',
        noteTemplate: 'Shared vehicle rides have neutral in-cabin exposure.',
      },
      emissions: {
        direction: 'reduces',
        label: 'Estimated',
        evidence: 'high',
        noteTemplate: 'Multiplies vehicle-kilometer reductions across participating neighbors.',
        hasFormula: 'E1',
      },
      assumptions: ['Neighbors share common destinations or school routes.'],
      doesNotChange: 'Does not clean outdoor air.',
    },
  },
  {
    id: 'CM-03',
    title: 'Buddy check on vulnerable neighbors',
    category: 'community',
    cost: 'free',
    effort: 1,
    evidence: 'medium',
    templateKey: 'CM-03',
    impactSpec: {
      exposure: {
        direction: 'reduces',
        label: 'Recommended',
        evidence: 'medium',
        noteTemplate: 'Helps seniors stay indoors by assisting with outdoor errands.',
      },
      emissions: {
        direction: 'neutral',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Community caregiving has neutral emissions impact.',
      },
      assumptions: ['Direct communication with elderly or isolated neighbors.'],
      doesNotChange: 'Does not change atmospheric air quality.',
    },
  },
  {
    id: 'CM-04',
    title: 'Share daily clean-air briefing',
    category: 'community',
    cost: 'free',
    effort: 1,
    evidence: 'medium',
    templateKey: 'CM-04',
    impactSpec: {
      exposure: {
        direction: 'reduces',
        label: 'Recommended',
        evidence: 'medium',
        noteTemplate: 'Helps society members plan protective measures in advance.',
      },
      emissions: {
        direction: 'reduces',
        label: 'Recommended',
        evidence: 'low',
        noteTemplate: 'Encourages collective trip reduction and anti-burning compliance.',
      },
      assumptions: ['Shared chat group or society notice board is active.'],
      doesNotChange: 'Information sharing requires individual action to produce change.',
    },
  },
];
