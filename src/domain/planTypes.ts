import { z } from 'zod';
import {
  type Confidence,
  type ImpactDirection,
  type ImpactLabel,
  type ImpactStatement,
  type RiskLevel,
  type SlotId,
} from './types';

export const ActionCategorySchema = z.enum(['indoor', 'personal', 'mobility', 'community']);
export type ActionCategory = z.infer<typeof ActionCategorySchema>;

export const ActionCostSchema = z.enum(['free', 'low', 'medium', 'high']);
export type ActionCost = z.infer<typeof ActionCostSchema>;

export const ActionEffortSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type ActionEffort = z.infer<typeof ActionEffortSchema>;

export const ActionEvidenceSchema = z.enum(['high', 'medium', 'low']);
export type ActionEvidence = z.infer<typeof ActionEvidenceSchema>;

export interface ImpactSpec {
  exposure: {
    direction: ImpactDirection;
    label: ImpactLabel;
    evidence: ActionEvidence;
    noteTemplate: string;
  };
  emissions: {
    direction: ImpactDirection;
    label: ImpactLabel;
    evidence: ActionEvidence;
    noteTemplate: string;
    hasFormula?: 'E1' | 'E2';
  };
  assumptions: string[];
  doesNotChange: string;
}

export interface Action {
  id: string;
  title: string;
  category: ActionCategory;
  cost: ActionCost;
  effort: ActionEffort;
  evidence: ActionEvidence;
  impactSpec: ImpactSpec;
  templateKey: string;
  minLevel?: RiskLevel;
  forbiddenLevels?: RiskLevel[];
  requiresPurifier?: boolean;
  requiresAcHvac?: boolean;
  requiresExhaust?: boolean;
}

export interface ActionCandidate {
  action: Action;
  impact: ImpactStatement;
  healthUrgency: number;
  feasibility: number;
  costFit: number;
  priorityScore: number;
  tags: {
    health: string;
    urgency: string;
    cost: string;
    effort: string;
  };
  applicableSlot?: SlotId;
  isMandatory: boolean;
  fixedDisclaimers?: string[];
}

export interface TimelineSlot {
  slotId: SlotId;
  slotLabel: string;
  actionIds: string[];
  actions: ActionCandidate[];
  note?: string;
}

export interface Plan {
  source: 'deterministic' | 'ai';
  generatedAt: string;
  headline: string;
  topActionIds: [string, string, string];
  topActions: ActionCandidate[];
  timeline: TimelineSlot[];
  explanations: Record<string, string>;
  planConfidence: Confidence;
  confidenceReason: string;
  assumptions: string[];
  flags: {
    severeMode: boolean;
    lowCostMode: boolean;
    fallbackPlan: boolean;
  };
}
