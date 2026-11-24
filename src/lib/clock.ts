/**
 * System and testable clock abstractions.
 */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
