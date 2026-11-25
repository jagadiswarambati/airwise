import { type Action } from '../types';
import { INDOOR_ACTIONS } from './indoor';
import { PERSONAL_ACTIONS } from './personal';
import { MOBILITY_ACTIONS } from './mobility';
import { COMMUNITY_ACTIONS } from './community';

export { INDOOR_ACTIONS } from './indoor';
export { PERSONAL_ACTIONS } from './personal';
export { MOBILITY_ACTIONS } from './mobility';
export { COMMUNITY_ACTIONS } from './community';

/**
 * Master catalog of all 24 approved actions for AirWise, composed from category modules.
 * Maintained in exact deterministic ID order (IN, PE, MO, CM).
 */
export const ACTION_CATALOG: Action[] = [
  ...INDOOR_ACTIONS,
  ...PERSONAL_ACTIONS,
  ...MOBILITY_ACTIONS,
  ...COMMUNITY_ACTIONS,
];
