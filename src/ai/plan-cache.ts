import { HouseholdProfile, AirSnapshot } from '../domain/types';
import { AIPlanInput, AIPlanOutput } from './schema';
import { PROMPT_VERSION } from './prompts/planPrompt';

const planMemoryCache = new Map<string, { plan: AIPlanOutput; expiresAt: number }>();

/**
 * Creates a deterministic, privacy-preserving hash of household profile attributes.
 * Never includes names, coordinates, or exact locations.
 */
function hashProfile(profile: HouseholdProfile): string {
  const normalized = {
    budget: profile.budget,
    tenure: profile.housing.tenure,
    type: profile.housing.type,
    fuel: profile.cooking.fuel,
    exhaust: profile.cooking.hasExhaust,
    heating: profile.homeHeating,
    equipment: profile.equipment,
    members: profile.members.map((m) => `${m.ageGroup}-${(m.flags || []).sort().join(',')}`).sort(),
    travel: {
      modes: profile.travel.modes,
      trips: profile.travel.tripsPerWeek,
      canShift: profile.travel.canShiftTime,
      canRemote: profile.travel.canWorkRemotely,
    },
    routine: profile.routine,
  };
  return simpleStringHash(JSON.stringify(normalized));
}

export function simpleStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Derives a cache key incorporating:
 * - AI plan input structural hash (or profile hash for backward compatibility)
 * - Current hour bucket (YYYY-MM-DD-HH)
 * - Snapshot data signature (PM2.5 reading + freshness)
 * - Prompt version
 */
export function buildPlanCacheKey(
  inputOrProfile: AIPlanInput | HouseholdProfile,
  snapshot: AirSnapshot,
): string {
  let payloadHash: string;
  if ('approvedCandidateIds' in inputOrProfile) {
    payloadHash = simpleStringHash(JSON.stringify(inputOrProfile));
  } else {
    payloadHash = hashProfile(inputOrProfile);
  }

  const hourBucket = new Date().toISOString().slice(0, 13); // e.g. "2026-11-22T10"
  const pm25Value = snapshot.pm25.now !== null ? Math.round(snapshot.pm25.now) : 'null';
  const dataSig = `${pm25Value}_${snapshot.freshness}`;
  return `${payloadHash}_${hourBucket}_${dataSig}_v${PROMPT_VERSION}`;
}

export function getCachedPlan(key: string): AIPlanOutput | null {
  const entry = planMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    planMemoryCache.delete(key);
    return null;
  }
  return entry.plan;
}

export function setCachedPlan(key: string, plan: AIPlanOutput, ttlMs: number = 60 * 60 * 1000): void {
  planMemoryCache.set(key, {
    plan,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearPlanCache(): void {
  planMemoryCache.clear();
}
