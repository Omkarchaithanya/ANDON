/**
 * @module domain/enums
 * @description Pure TypeScript enums defining ANDON's domain taxonomy, coverage states, and action lifecycles.
 * Invariant: /domain imports nothing from Forge, network, or external runtime libraries.
 */

/** Discovery status for candidate change intents discovered from Jira issues */
export enum DiscoveryStatus {
  CANDIDATE = 'candidate',
  CONFIRMED = 'confirmed',
  DISMISSED = 'dismissed',
  STALE = 'stale',
  UNKNOWN = 'unknown',
}

/** Deterministic coverage comparison result */
export enum CoverageResult {
  GAP = 'gap',
  COVERED = 'covered',
  UNKNOWN = 'unknown',
  ALTERNATIVE_PATH = 'alternative_path',
}

/** Review decision workflow status */
export enum ReviewStatus {
  PENDING = 'pending',
  CONFIRMED_GAP = 'confirmed_gap',
  CONFIRMED_COVERED = 'confirmed_covered',
  OUTCOME_UNCERTAIN = 'outcome_uncertain',
  STALE = 'stale',
}

/** Evidence revision lifecycle status */
export enum EvidenceStatus {
  CURRENT = 'current',
  STALE = 'stale',
  SUPERSEDED = 'superseded',
}

/** Follow-up Jira issue creation action status */
export enum FollowupCreationStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  CREATED = 'created',
  FAILED = 'failed',
  UNCERTAIN = 'uncertain',
}

/** Source document tracking status */
export enum SourceStatus {
  CURRENT = 'current',
  STALE = 'stale',
  DELETED = 'deleted',
}

/** Structural types of facility zones */
export enum ZoneType {
  AISLE = 'aisle',
  BAY = 'bay',
  CELL = 'cell',
}

/** Types of physical evidence revisions */
export enum EvidenceType {
  COMMISSIONING_BASELINE = 'commissioning_baseline',
  HAZARD_ANALYSIS = 'hazard_analysis',
  ACCEPTANCE_TEST = 'acceptance_test',
  OPERATOR_PROCEDURE = 'operator_procedure',
  SAFETY_ASSESSMENT = 'safety_assessment',
}

/** Types of external sources tracked by ANDON */
export enum SourceType {
  CONFLUENCE_PAGE = 'confluence_page',
  JIRA_ISSUE = 'jira_issue',
  EXTERNAL_URL = 'external_url',
}

/** Audit action types for immutable logging */
export enum ActionType {
  CHANGE_INTENT_CREATED = 'change_intent_created',
  RELATIONSHIP_CONFIRMED = 'relationship_confirmed',
  RELATIONSHIP_DISMISSED = 'relationship_dismissed',
  FOLLOWUP_CREATED = 'followup_created',
  FOLLOWUP_RECONCILED = 'followup_reconciled',
  STALE_ASSESSMENT_MARKED = 'stale_assessment_marked',
  CONFIGURATION_UPDATED = 'configuration_updated',
  DEPLOYMENT_REGISTERED = 'deployment_registered',
}

/** Three-state lifecycle for idempotent action records */
export enum ActionRecordState {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  OUTCOME_UNCERTAIN = 'outcome_uncertain',
}
