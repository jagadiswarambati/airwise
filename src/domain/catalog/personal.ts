import { type Action } from '../types';

/**
 * Personal & Health Category Actions (PE-01 to PE-04).
 */
export const PERSONAL_ACTIONS: Action[] = [
  {
    id: 'PE-01',
    title: 'Limit outdoor exposure for sensitive members',
    category: 'personal',
    cost: 'free',
    effort: 1,
    evidence: 'high',
    templateKey: 'PE-01',
    minLevel: 2,
    impactSpec: {
      exposure: {
        direction: 'reduces',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Substantially reduces inhaled pollution dose during peak hours.',
      },
      emissions: {
        direction: 'neutral',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Protective behavioral change; neutral emissions.',
      },
      assumptions: ['Indoor environment is cleaner than outdoor air.'],
      doesNotChange: 'Does not reduce ambient outdoor pollution.',
    },
  },
  {
    id: 'PE-02',
    title: 'Wear fitted respirator (N95/FFP2) for essential trips',
    category: 'personal',
    cost: 'low',
    effort: 2,
    evidence: 'high',
    templateKey: 'PE-02',
    minLevel: 2,
    impactSpec: {
      exposure: {
        direction: 'reduces',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Filters out >= 95% of fine particulate matter when properly fitted.',
      },
      emissions: {
        direction: 'neutral',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Respirators protect the wearer; they do not alter outdoor emissions.',
      },
      assumptions: [
        'Respirator forms an airtight seal around the nose and mouth.',
        'Not for children under 5 (P-13).',
      ],
      doesNotChange: 'Does not reduce urban air pollution.',
    },
  },
  {
    id: 'PE-03',
    title: 'Shift active exercise and play indoors',
    category: 'personal',
    cost: 'free',
    effort: 1,
    evidence: 'high',
    templateKey: 'PE-03',
    minLevel: 2,
    impactSpec: {
      exposure: {
        direction: 'reduces',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Avoids heavy pulmonary exertion and high deep-lung particulate uptake.',
      },
      emissions: {
        direction: 'neutral',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Physical activity shift has zero emissions impact.',
      },
      assumptions: ['Adequate indoor space for gentle activities.'],
      doesNotChange: 'Does not replace medical asthma or cardiovascular management plans.',
    },
  },
  {
    id: 'PE-04',
    title: 'Follow clinician plan and check on vulnerable members',
    category: 'personal',
    cost: 'free',
    effort: 1,
    evidence: 'high',
    templateKey: 'PE-04',
    impactSpec: {
      exposure: {
        direction: 'neutral',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Ensures rapid medical response to respiratory or cardiac symptoms.',
      },
      emissions: {
        direction: 'neutral',
        label: 'Recommended',
        evidence: 'high',
        noteTemplate: 'Health monitoring has zero emissions impact.',
      },
      assumptions: ['Prescribed clinician management plan is available.'],
      doesNotChange: 'Informational guidance only; not medical advice.',
    },
  },
];
