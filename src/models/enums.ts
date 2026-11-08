/**
 * @module enums
 * @description Enumerations representing state machines, domain categories, and classification types for ANDON.
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

/** Engineering evidence revision types */
export enum EvidenceType {
  COMMISSIONING = 'commissioning',
  TEST_RESULT = 'test_result',
  EQUIVALENCE = 'equivalence',
}

/** Audit action types logged in action_log table */
export enum ActionType {
  DISCOVERY_RUN = 'discovery_run',
  CANDIDATE_CREATED = 'candidate_created',
  RELATIONSHIP_CONFIRMED = 'relationship_confirmed',
  RELATIONSHIP_DISMISSED = 'relationship_dismissed',
  COVERAGE_EVALUATED = 'coverage_evaluated',
  FOLLOWUP_APPROVED = 'followup_approved',
  FOLLOWUP_CREATED = 'followup_created',
  FOLLOWUP_CREATION_FAILED = 'followup_creation_failed',
  ASSESSMENT_MARKED_STALE = 'assessment_marked_stale',
  SOURCE_REFRESHED = 'source_refreshed',
  CONFIG_UPDATED = 'config_updated',
  EVIDENCE_MARKED_STALE = 'evidence_marked_stale',
}

/** Supported document source types */
export enum SourceType {
  CONFLUENCE_PAGE = 'confluence_page',
  JIRA_ISSUE = 'jira_issue',
  CONFLUENCE = 'confluence_page',
  JIRA = 'jira_issue',
}

/** Operational status of robot deployment */
export enum DeploymentStatus {
  ACTIVE = 'active',
  DECOMMISSIONED = 'decommissioned',
  SUSPENDED = 'suspended',
}

