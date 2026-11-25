import {
  type HouseholdProfile,
  type AirSnapshot,
  type TimeSlot,
  type RiskLevel,
  type Plan,
} from '../../src/domain/types';
import { type PolicyEvaluationResult } from '../../src/domain/policy';
import { hasSensitiveMembers } from '../../src/domain/levels';
import { COMBUSTION_SAFETY_CAVEAT } from '../../src/domain/templates';

export interface InvariantAssertionContext {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
  slots: TimeSlot[];
  policy: PolicyEvaluationResult;
  plan: Plan;
  communityMode: boolean;
  expectedBase?: RiskLevel;
}

/**
 * Throws a detailed Error with minimal failing input JSON when an oracle fails.
 */
function failInvariant(rule: string, message: string, ctx: InvariantAssertionContext): never {
  const minimalInput = {
    rule,
    error: message,
    profile: {
      budget: ctx.profile.budget,
      members: ctx.profile.members.map((m) => ({ ageGroup: m.ageGroup, flags: m.flags })),
      equipment: ctx.profile.equipment,
      cooking: ctx.profile.cooking,
      homeHeating: ctx.profile.homeHeating,
      travel: ctx.profile.travel,
    },
    snapshot: {
      pm25Now: ctx.snapshot.pm25.now,
      freshness: ctx.snapshot.freshness,
      officialAlert: ctx.snapshot.officialAlert?.active,
    },
    communityMode: ctx.communityMode,
    policy: {
      baseLevel: ctx.policy.baseLevel,
      effectiveLevel: ctx.policy.effectiveLevel,
      approvedCount: ctx.policy.approvedCandidates.length,
      mustInclude: ctx.policy.mustIncludeActionIds,
      forbidden: ctx.policy.forbiddenActionIds,
    },
    plan: {
      top3: ctx.plan.topActionIds,
      confidence: ctx.plan.planConfidence,
      severeMode: ctx.plan.flags.severeMode,
    },
  };

  const err = new Error(
    `[INVARIANT VIOLATION ${rule}] ${message}\nMinimal failing input:\n${JSON.stringify(minimalInput, null, 2)}`,
  );
  throw err;
}

function assertExpectedBaseAndLevels(ctx: InvariantAssertionContext, hasSensitive: boolean): void {
  const { snapshot, policy, expectedBase } = ctx;
  if (expectedBase !== undefined && policy.baseLevel !== expectedBase) {
    failInvariant(
      'EXPECTED_BASE',
      `Computed baseLevel ${policy.baseLevel} !== expectedBase ${expectedBase}`,
      ctx,
    );
  }

  const pm25 = snapshot.pm25.now ?? 0;
  let oracleBase: RiskLevel = 0;
  if (pm25 <= 30) oracleBase = 0;
  else if (pm25 <= 60) oracleBase = 1;
  else if (pm25 <= 90) oracleBase = 2;
  else if (pm25 <= 120) oracleBase = 3;
  else oracleBase = 4;

  if (policy.baseLevel !== oracleBase) {
    failInvariant(
      'P-19_BASE',
      `Expected base ${oracleBase} for PM2.5 ${pm25}, got ${policy.baseLevel}`,
      ctx,
    );
  }

  const oracleEffective: RiskLevel = hasSensitive
    ? (Math.min(4, oracleBase + 1) as RiskLevel)
    : oracleBase;

  if (policy.effectiveLevel !== oracleEffective) {
    failInvariant(
      'P-19_EFFECTIVE',
      `Expected effective ${oracleEffective}, got ${policy.effectiveLevel}`,
      ctx,
    );
  }
}

function assertSevereActionGating(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
  hasSensitive: boolean,
): void {
  if (candidateIds.has('MO-07') || top3.includes('MO-07')) {
    failInvariant('P-01_MO-07', 'MO-07 (walking/cycling) must NEVER appear in severe mode', ctx);
  }
  if (candidateIds.has('IN-02') || top3.includes('IN-02')) {
    failInvariant('P-01_IN-02', 'IN-02 (open window) must NEVER appear in severe mode', ctx);
  }
  if (!top3.includes('IN-01')) {
    failInvariant('P-01_IN-01', 'IN-01 (closed windows) MUST appear in top 3 in severe mode', ctx);
  }
  if (hasSensitive && !top3.includes('PE-03')) {
    failInvariant(
      'P-01_PE-03',
      'PE-03 (indoor play) MUST appear in top 3 for sensitive households in severe mode',
      ctx,
    );
  }
}

function assertSevereModeInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
  hasSensitive: boolean,
): void {
  const { snapshot, policy, plan } = ctx;
  const isSevere = policy.effectiveLevel === 4 || Boolean(snapshot.officialAlert?.active);
  if (policy.flags.severeMode !== isSevere) {
    failInvariant(
      'P-01_FLAG',
      `severeMode flag ${policy.flags.severeMode} !== expected ${isSevere}`,
      ctx,
    );
  }
  if (plan.flags.severeMode !== isSevere) {
    failInvariant(
      'P-20_PLAN_FLAG',
      `plan severeMode flag ${plan.flags.severeMode} !== expected ${isSevere}`,
      ctx,
    );
  }

  if (isSevere) {
    assertSevereActionGating(ctx, candidateIds, top3, hasSensitive);
  }
}

function assertStaleAndVentilationInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
  isStaleOrNone: boolean,
): void {
  const { policy, plan } = ctx;
  if (isStaleOrNone) {
    if (candidateIds.has('IN-02') || top3.includes('IN-02')) {
      failInvariant('P-03_IN-02', 'IN-02 must NOT appear with stale or missing data', ctx);
    }
    if (candidateIds.has('MO-07') || top3.includes('MO-07')) {
      failInvariant('P-03_MO-07', 'MO-07 must NOT appear with stale or missing data', ctx);
    }
    if (plan.planConfidence !== 'low') {
      failInvariant(
        'P-04_CONFIDENCE',
        `Expected low confidence for stale/missing data, got ${plan.planConfidence}`,
        ctx,
      );
    }
  }

  if (policy.effectiveLevel >= 3) {
    if (candidateIds.has('IN-02') || top3.includes('IN-02')) {
      failInvariant('P-07_IN-02', 'IN-02 must NEVER appear at effective level >= 3', ctx);
    }
    if (!policy.mustIncludeActionIds.includes('IN-01')) {
      failInvariant(
        'P-07_MUST_IN-01',
        'IN-01 must be in mustIncludeActionIds at effective level >= 3',
        ctx,
      );
    }
    if (!top3.includes('IN-01')) {
      failInvariant('P-07_TOP_IN-01', 'IN-01 must be in top 3 at effective level >= 3', ctx);
    }
  }
}

function assertSensitiveHouseholdInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
  hasSensitive: boolean,
): void {
  const { policy } = ctx;
  if (!hasSensitive || policy.effectiveLevel < 3) return;

  if (!policy.mustIncludeActionIds.includes('PE-03')) {
    failInvariant(
      'P-09_MUST_PE-03',
      'PE-03 must be in mustIncludeActionIds for sensitive households at level >= 3',
      ctx,
    );
  }
  if (!top3.includes('PE-03')) {
    failInvariant(
      'P-09_TOP_PE-03',
      'PE-03 must be in top 3 for sensitive households at level >= 3',
      ctx,
    );
  }
  if (candidateIds.has('MO-07') || top3.includes('MO-07')) {
    failInvariant(
      'P-09_FORBID_MO-07',
      'MO-07 must be forbidden for sensitive households at level >= 3',
      ctx,
    );
  }
}

function assertBudgetTierInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
): void {
  const { profile, policy } = ctx;
  if (profile.budget !== 'free') return;

  for (const c of policy.approvedCandidates) {
    if (c.action.cost !== 'free') {
      failInvariant(
        'P-10_NON_FREE',
        `Approved action ${c.action.id} has non-free cost '${c.action.cost}' on free budget`,
        ctx,
      );
    }
  }
  if (candidateIds.has('PE-02')) {
    failInvariant('P-10_PE-02', 'PE-02 (purchase respirator) forbidden on free budget', ctx);
  }
  if (candidateIds.has('IN-04')) {
    failInvariant('P-10_IN-04', 'IN-04 (purchase seals) forbidden on free budget', ctx);
  }
  if (candidateIds.has('MO-02')) {
    failInvariant('P-10_MO-02', 'MO-02 (fare) forbidden on free budget', ctx);
  }
}

function assertEquipmentInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
): void {
  const { profile } = ctx;
  if (!profile.equipment.purifier && (candidateIds.has('IN-05') || top3.includes('IN-05'))) {
    failInvariant('P-11_IN-05', 'IN-05 requires air purifier', ctx);
  }
  if (
    !profile.equipment.windowAC &&
    !profile.equipment.hvac &&
    (candidateIds.has('IN-06') || top3.includes('IN-06'))
  ) {
    failInvariant('P-11_IN-06', 'IN-06 requires window AC or central HVAC', ctx);
  }
  if (!profile.cooking.hasExhaust && (candidateIds.has('IN-07') || top3.includes('IN-07'))) {
    failInvariant('P-11_IN-07', 'IN-07 requires kitchen exhaust', ctx);
  }
}

function assertRespiratorInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
): void {
  const { profile, policy } = ctx;
  const allUnder5 = profile.members.every((m) => m.ageGroup === 'u5');
  if (allUnder5 && (candidateIds.has('PE-02') || top3.includes('PE-02'))) {
    failInvariant('P-13_U5', 'PE-02 must NEVER appear when all household members are under 5', ctx);
  }
  if (policy.effectiveLevel < 2 && (candidateIds.has('PE-02') || top3.includes('PE-02'))) {
    failInvariant('P-13_LOW_LEVEL', 'PE-02 must not appear at effective level < 2', ctx);
  }
}

function assertMotorizedModeInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
): void {
  const { profile } = ctx;
  const isMotorized =
    profile.travel.modes.includes('car') || profile.travel.modes.includes('two_wheeler');
  if (!isMotorized) {
    if (candidateIds.has('MO-03') || top3.includes('MO-03')) {
      failInvariant('P-16_MO-03', 'MO-03 requires car or two-wheeler mode', ctx);
    }
    if (candidateIds.has('MO-06') || top3.includes('MO-06')) {
      failInvariant('P-16_MO-06', 'MO-06 requires car or two-wheeler mode', ctx);
    }
  }
}

function assertMobilityInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
): void {
  const { profile } = ctx;
  assertMotorizedModeInvariants(ctx, candidateIds, top3);
  if (!profile.travel.canWorkRemotely && (candidateIds.has('MO-05') || top3.includes('MO-05'))) {
    failInvariant('P-17_MO-05', 'MO-05 requires canWorkRemotely to be true', ctx);
  }
  if (!profile.travel.canShiftTime && (candidateIds.has('MO-01') || top3.includes('MO-01'))) {
    failInvariant('P-18_MO-01', 'MO-01 requires canShiftTime to be true', ctx);
  }
}

function assertCommunityInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
): void {
  if (ctx.communityMode) return;
  for (const cmId of ['CM-01', 'CM-02', 'CM-03', 'CM-04']) {
    if (candidateIds.has(cmId) || top3.includes(cmId)) {
      failInvariant('P-21_COMMUNITY', `${cmId} must NOT appear when communityMode is false`, ctx);
    }
  }
}

function assertCombustionHazardInvariants(
  ctx: InvariantAssertionContext,
  candidateIds: Set<string>,
  top3: string[],
): void {
  const { profile, policy } = ctx;
  const hasCombustionHazard =
    profile.homeHeating === 'combustion' ||
    (profile.cooking.fuel === 'biomass' && !profile.cooking.hasExhaust);

  if (!hasCombustionHazard) return;

  if (candidateIds.has('IN-04') || top3.includes('IN-04')) {
    failInvariant(
      'P-22_IN-04',
      'IN-04 (sealing gaps) strictly FORBIDDEN with combustion heating or unvented biomass',
      ctx,
    );
  }
  const in01Candidate = policy.approvedCandidates.find((c) => c.action.id === 'IN-01');
  if (in01Candidate && !in01Candidate.fixedDisclaimers?.includes(COMBUSTION_SAFETY_CAVEAT)) {
    failInvariant(
      'P-22_CO_CAVEAT',
      'IN-01 must carry combustion carbon monoxide caveat when combustion hazard present',
      ctx,
    );
  }
}

function assertStructuralShapeInvariants(ctx: InvariantAssertionContext): void {
  const { policy, plan } = ctx;
  const top3Actions = plan.topActionIds;

  if (top3Actions.length !== 3) {
    failInvariant(
      'SHAPE_TOP3_LEN',
      `Top 3 actions must have exactly 3 items, got ${top3Actions.length}`,
      ctx,
    );
  }
  if (new Set(top3Actions).size !== 3) {
    failInvariant(
      'SHAPE_TOP3_UNIQUE',
      `Top 3 actions must be unique, got ${JSON.stringify(top3Actions)}`,
      ctx,
    );
  }
  if (policy.approvedCandidates.length < 3) {
    failInvariant(
      'SHAPE_MIN_CANDIDATES',
      `Approved candidates must be >= 3, got ${policy.approvedCandidates.length}`,
      ctx,
    );
  }
  for (const c of policy.approvedCandidates) {
    if (!c.impact.exposure || !c.impact.emissions) {
      failInvariant(
        'COMPLETENESS_IMPACT',
        `Action ${c.action.id} missing exposure or emissions impact`,
        ctx,
      );
    }
    if (!Array.isArray(c.impact.assumptions) || c.impact.assumptions.length === 0) {
      failInvariant('COMPLETENESS_ASSUMPTIONS', `Action ${c.action.id} missing assumptions`, ctx);
    }
    if (typeof c.impact.doesNotChange !== 'string' || c.impact.doesNotChange.trim().length === 0) {
      failInvariant(
        'COMPLETENESS_DOES_NOT_CHANGE',
        `Action ${c.action.id} missing doesNotChange statements`,
        ctx,
      );
    }
  }
}

/**
 * Independent Policy Oracle / Invariant Verifier for P-01 through P-22.
 */
export function assertAllPolicyInvariants(ctx: InvariantAssertionContext): void {
  const { profile, snapshot, policy, plan } = ctx;
  const candidateIds = new Set(policy.approvedCandidates.map((c) => c.action.id));
  const top3 = plan.topActionIds;
  const hasSensitive = hasSensitiveMembers(profile.members);
  const isStaleOrNone =
    snapshot.freshness === 'stale' || snapshot.freshness === 'none' || snapshot.pm25.now === null;

  assertExpectedBaseAndLevels(ctx, hasSensitive);
  assertSevereModeInvariants(ctx, candidateIds, top3, hasSensitive);
  assertStaleAndVentilationInvariants(ctx, candidateIds, top3, isStaleOrNone);
  assertSensitiveHouseholdInvariants(ctx, candidateIds, top3, hasSensitive);
  assertBudgetTierInvariants(ctx, candidateIds);
  assertEquipmentInvariants(ctx, candidateIds, top3);
  assertRespiratorInvariants(ctx, candidateIds, top3);
  assertMobilityInvariants(ctx, candidateIds, top3);
  assertCommunityInvariants(ctx, candidateIds, top3);
  assertCombustionHazardInvariants(ctx, candidateIds, top3);
  assertStructuralShapeInvariants(ctx);
}
