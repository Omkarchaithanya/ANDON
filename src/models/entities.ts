/**
 * @module entities
 * @description Core entity definitions, input payload interfaces, and structured graph/LLM data types.
 */

import {
  DiscoveryStatus,
  CoverageResult,
  ReviewStatus,
  EvidenceStatus,
  FollowupCreationStatus,
  SourceStatus,
  ZoneType,
  EvidenceType,
  ActionType,
  SourceType,
  DeploymentStatus,
} from './enums';

/**
 * Site entity representing a physical warehouse or factory location.
 */
export interface Site {
  id: string;
  name: string;
  confluence_page_id?: string | null;
  confluence_page_version?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type CreateSiteInput = Omit<Site, 'id' | 'created_at' | 'updated_at'>;

/**
 * Zone entity representing a sub-area within a site (e.g. Aisle 7, Bay 3).
 */
export interface Zone {
  id: string;
  site_id: string;
  name: string;
  zone_type: ZoneType;
  confluence_page_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type CreateZoneInput = Omit<Zone, 'id' | 'created_at' | 'updated_at'>;

/**
 * Deployment entity representing an active robotics commissioning unit (e.g. AMR-12).
 */
export interface Deployment {
  id: string;
  zone_id: string;
  deployment_identifier: string;
  confluence_page_id?: string | null;
  confluence_page_version?: number | null;
  owner_account_id?: string | null;
  status: DeploymentStatus;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type CreateDeploymentInput = Omit<Deployment, 'id' | 'created_at' | 'updated_at'>;

/**
 * Condition entity representing a documented operating environment constraint or assumption.
 */
export interface Condition {
  id: string;
  deployment_id: string;
  attribute_name: string;
  attribute_value: string;
  source_confluence_page_id?: string | null;
  source_page_version?: number | null;
  source_span_start?: number | null;
  source_span_end?: number | null;
  source_quoted_text?: string | null;
  schema_version: string;
  created_at: string;
  updated_at: string;
}

export type CreateConditionInput = Omit<Condition, 'id' | 'created_at' | 'updated_at'>;

/**
 * Declared scope structure embedded in evidence revisions.
 */
export interface DeclaredScope {
  conditions: Array<{
    attribute_name: string;
    attribute_value?: string;
    declared_value?: string;
  }>;
  configuration_id?: string;
  zone_id?: string;
}

/**
 * EvidenceRevision entity representing a formal commissioning test or equivalence record.
 */
export interface EvidenceRevision {
  id: string;
  evidence_revision_id?: string;
  deployment_id: string;
  evidence_type: EvidenceType;
  confluence_page_id?: string | null;
  confluence_page_version?: number | null;
  source_quoted_text?: string | null;
  declared_scope: DeclaredScope | string;
  approved_by?: string | null;
  approved_at?: string | null;
  effective_from?: string | null;
  recorded_at: string;
  status: EvidenceStatus;
  staleness_reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type CreateEvidenceRevisionInput = Omit<
  EvidenceRevision,
  'id' | 'recorded_at' | 'created_at' | 'updated_at'
>;

/**
 * ChangeIntent entity representing a candidate physical change discovered from an intake ticket.
 */
export interface ChangeIntent {
  id: string;
  jira_issue_id: string;
  jira_issue_key: string;
  site_id?: string | null;
  zone_id?: string | null;
  proposed_attribute?: string | null;
  proposed_value?: string | null;
  effective_date?: string | null;
  source_quoted_text?: string | null;
  content_fingerprint?: string | null;
  discovery_status: DiscoveryStatus;
  llm_confidence?: number | null;
  llm_reasoning?: string | null;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  dismissed_by?: string | null;
  dismissed_at?: string | null;
  dismissal_reason?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateChangeIntentInput = Omit<ChangeIntent, 'id' | 'created_at' | 'updated_at'>;

/**
 * Detailed explanation structure for deterministic coverage evaluation.
 */
export interface CoverageDetail {
  matched_conditions?: Array<{ attribute: string; value: string }>;
  unmatched_conditions?: Array<{ attribute: string; expected: string; actual: string }>;
  missing_conditions?: Array<{ attribute: string }>;
  alternative_evidence_ids?: string[];
  explanation: string;
  result?: CoverageResult;
  conditions?: Array<{
    attribute_name: string;
    status: 'MATCHED' | 'GAP' | 'MISSING';
    declared_value: string | null;
    proposed_value: string | null;
    detail: string;
  }>;
  alternative_evidence_id?: string | null;
  evaluated_at?: string;
}

/**
 * ReviewDecision entity recording the evaluation of a confirmed change against evidence.
 */
export interface ReviewDecision {
  id: string;
  review_decision_id?: string;
  change_intent_id: string;
  deployment_id: string;
  evidence_revision_id?: string | null;
  coverage_result: CoverageResult;
  coverage_detail?: CoverageDetail | string | null;
  reviewer_account_id?: string | null;
  review_status: ReviewStatus;
  followup_jira_issue_id?: string | null;
  followup_jira_issue_key?: string | null;
  followup_creation_status?: FollowupCreationStatus;
  followup_idempotency_key?: string | null;
  source_versions_at_review?: SourceVersionSnapshot | string | null;
  created_at: string;
  updated_at: string;
}

export type CreateReviewDecisionInput = Omit<ReviewDecision, 'id' | 'created_at' | 'updated_at'>;

/**
 * ActionLogEntry for immutable audit history.
 */
export interface ActionLogEntry {
  id: string;
  action_type: ActionType;
  entity_type: string;
  entity_id: string;
  actor_account_id: string;
  detail?: Record<string, unknown> | string | null;
  created_at: string;
}

export type CreateActionLogEntryInput = Omit<ActionLogEntry, 'id' | 'created_at'>;

/**
 * Configuration entry stored in key-value store.
 */
export interface AppConfig {
  key: string;
  value: string;
  updated_at: string;
}

/**
 * Snapshot of monitored source documents at review time.
 */
export interface SourceVersionSnapshot {
  sources: Array<{
    source_type: SourceType;
    source_id: string;
    version: string;
    fingerprint?: string;
    checked_at: string;
  }>;
}

/**
 * Monitored document source version record.
 */
export interface SourceVersion {
  id: string;
  source_type: SourceType;
  source_id: string;
  known_version?: string | null;
  content_fingerprint?: string | null;
  last_checked_at: string;
  checked_at?: string;
  status: SourceStatus;
  created_at: string;
  updated_at: string;
}

export type CreateSourceVersionInput = Omit<SourceVersion, 'id' | 'created_at' | 'updated_at'>;

/**
 * LLM Candidate Proposal structure.
 */
export interface ExtractionProposal {
  candidate_deployment_id?: string;
  zone_name?: string;
  attribute_name?: string;
  old_value?: string;
  new_value?: string;
  effective_time_info?: string;
  source_quotes?: Array<{
    source_id: string;
    source_type: SourceType;
    quoted_text: string;
    span_start?: number;
    span_end?: number;
  }>;
  confidence: number;
  reasoning: string;
  has_relationship?: boolean;
  related_condition_ids?: string[];
  change_quote?: string;
  evidence_quote?: string;
  proposed_attribute?: string | null;
  proposed_value?: string | null;
  generated_at?: string;
}

/**
 * Graph context retrieved via Teamwork Graph curated queries.
 */
export interface GraphContext {
  site_page_id: string;
  linked_pages: Array<{
    page_id: string;
    title: string;
    page_type?: string;
  }>;
  page_owners: Array<{
    page_id: string;
    owner_account_id: string;
    owner_display_name: string;
  }>;
  registry_page_id?: string;
  linked_page_ids?: string[];
  linked_page_titles?: string[];
  owner_account_ids?: string[];
  owner_display_names?: string[];
  discovered_at?: string;
}

/**
 * Brief summary of an operating condition used in prompts.
 */
export interface ConditionSummary {
  deployment_id: string;
  deployment_identifier: string;
  zone_name: string;
  attribute_name: string;
  attribute_value: string;
  source_page_id?: string;
}

