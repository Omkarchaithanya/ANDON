/**
 * @module domain/enums
 * @description Pure TypeScript enums defining Keel's domain taxonomy, finding types, and states.
 * Invariant: /domain imports nothing from Forge, network, or external runtime libraries.
 */

/**
 * The six typed findings permitted on a Clearance Card.
 * SPEC §4 / Master Invariant 5:
 */
export enum FindingType {
  /** A decision still governs this change. Cited. */
  IN_FORCE = 'IN_FORCE',
  /** A newer decision replaced an older one, but the ticket still follows the old one. */
  SUPERSEDED = 'SUPERSEDED',
  /** The decision's owner is deactivated, left the team, or has no successor. */
  OWNER_GONE = 'OWNER_GONE',
  /** A linked goal changed after this work was scoped. */
  GOAL_DRIFT = 'GOAL_DRIFT',
  /** A Jira Service Management postmortem says "do not do this again." */
  INCIDENT_ECHO = 'INCIDENT_ECHO',
  /** Code or scope with no goal, or a goal with no owner. The CQS gap, made local. */
  UNLINKED = 'UNLINKED',
  /** Access-restricted source citation (counted as hold reason, never clear). */
  RESTRICTED = 'RESTRICTED',
}

/**
 * Clearance Status state model.
 * Invariant 1: UNKNOWN renders as HOLD.
 */
export enum Status {
  CLEAR = 'CLEAR',
  HOLD = 'HOLD',
  OVERRIDE = 'OVERRIDE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Lifecycle state of an individual decision.
 */
export enum DecisionState {
  IN_FORCE = 'IN_FORCE',
  SUPERSEDED = 'SUPERSEDED',
  OVERRIDDEN = 'OVERRIDDEN',
  EXPIRED = 'EXPIRED',
}

/**
 * Provenance citation source types.
 */
export enum CitationSource {
  JIRA = 'JIRA',
  CONFLUENCE = 'CONFLUENCE',
  JSM = 'JSM',
  BITBUCKET = 'BITBUCKET',
  TWG = 'TWG',
  PEOPLE = 'PEOPLE',
  GOAL = 'GOAL',
}

/**
 * Structural relationship of an override ADR to older decisions.
 */
export enum OverrideRelation {
  SUPERSEDES = 'SUPERSEDES',
  NARROWER_THAN = 'NARROWER_THAN',
  EXCEPTION_FOR = 'EXCEPTION_FOR',
}

/**
 * Three-state lifecycle for idempotent action records.
 * SPEC Invariant 14 / ADR-002:
 */
export enum ActionRecordState {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  OUTCOME_UNCERTAIN = 'outcome_uncertain',
}

