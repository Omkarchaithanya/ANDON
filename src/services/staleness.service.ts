/**
 * @module staleness.service
 * @description Staleness detection and management for source documents.
 *
 * Monitors Confluence pages and Jira issues referenced by ANDON evidence
 * to detect when they change after a review decision has been made.
 * When staleness is detected, affected evidence revisions and review
 * decisions are flagged so users know the underlying data may have changed.
 */

import { ActionType, SourceType } from '../models/enums';
import { ReviewDecision } from '../models/entities';
import {
  ExternalApiError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';
import { computeFingerprint } from '../utils/content-fingerprint';
import * as repository from '../db/repository';
import * as confluenceService from './confluence.service';
import * as jiraService from './jira.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of a staleness check comparing known vs current source version.
 */
export interface StalenessCheck {
  /** Whether the source has changed since we last recorded its version. */
  isStale: boolean;
  /** The current version of the source (null if source is inaccessible). */
  currentVersion: string | null;
  /** The version we had on record. */
  knownVersion: string | null;
  /** ISO-8601 timestamp of when this check was performed. */
  lastChecked: string;
}

/**
 * Updated source version information after a refresh.
 */
export interface SourceVersion {
  /** The source type. */
  sourceType: SourceType;
  /** The source ID (page ID or issue key). */
  sourceId: string;
  /** The refreshed version string. */
  version: string;
  /** ISO-8601 timestamp of the refresh. */
  checkedAt: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compares the known version of a source against its current version
 * to determine if the source has become stale.
 *
 * For Confluence: fetches the current page version number and compares.
 * For Jira: fetches the issue content and computes a content fingerprint.
 *
 * @param sourceType - The type of source (CONFLUENCE or JIRA).
 * @param sourceId - The source document ID (page ID or issue key).
 * @param knownVersion - The version we have on record.
 * @returns A StalenessCheck indicating whether the source has changed.
 * @throws {ValidationError} If parameters are invalid.
 * @throws {ExternalApiError} If the source cannot be fetched.
 */
export async function checkSourceStaleness(
  sourceType: SourceType,
  sourceId: string,
  knownVersion: string
): Promise<StalenessCheck> {
  if (!isNonEmptyString(sourceId)) {
    throw new ValidationError('sourceId must be a non-empty string');
  }
  if (!isNonEmptyString(knownVersion)) {
    throw new ValidationError('knownVersion must be a non-empty string');
  }

  const now = new Date().toISOString();
  let currentVersion: string | null = null;

  try {
    switch (sourceType) {
      case SourceType.CONFLUENCE: {
        const versionInfo = await confluenceService.getPageVersion(sourceId);
        currentVersion = String(versionInfo.version);
        break;
      }

      case SourceType.JIRA: {
        const issue = await jiraService.getIssue(sourceId);
        // For Jira, compute a content fingerprint from summary + description
        const contentForFingerprint = [
          issue.fields.summary || '',
          typeof issue.fields.description === 'string'
            ? issue.fields.description
            : '',
        ].join('\n');
        currentVersion = computeFingerprint(contentForFingerprint);
        break;
      }

      default:
        throw new ValidationError(`Unsupported source type: ${String(sourceType)}`);
    }
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      throw err;
    }
    // If we can't reach the source, we can't determine staleness
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(
      String(sourceType),
      `Cannot check staleness for ${String(sourceType)} source ${sourceId}: ${message}`
    );
  }

  // Record the check timestamp
  await repository.updateSourceCheckTimestamp(sourceType, sourceId, now);

  const isStale = currentVersion !== knownVersion;

  return {
    isStale,
    currentVersion,
    knownVersion,
    lastChecked: now,
  };
}

/**
 * Marks an evidence revision as stale in the database and logs the action.
 *
 * This is called when a source document has changed after evidence was
 * captured. The evidence revision is flagged so downstream consumers
 * (review decisions, coverage evaluations) know the data may be outdated.
 *
 * @param evidenceId - The evidence revision ID to mark as stale.
 * @param reason - A human-readable explanation of why it's stale.
 * @param actorId - The account ID of the actor (system or user) marking it stale.
 * @throws {ValidationError} If parameters are invalid.
 * @throws {NotFoundError} If the evidence revision doesn't exist.
 */
export async function markEvidenceStale(
  evidenceId: string,
  reason: string,
  actorId: string
): Promise<void> {
  if (!isNonEmptyString(evidenceId)) {
    throw new ValidationError('evidenceId must be a non-empty string');
  }
  if (!isNonEmptyString(reason)) {
    throw new ValidationError('reason must be a non-empty string');
  }
  if (!isNonEmptyString(actorId)) {
    throw new ValidationError('actorId must be a non-empty string');
  }

  // Verify the evidence revision exists
  const evidence = await repository.getEvidenceRevisionById(evidenceId);
  if (!evidence) {
    throw new NotFoundError('EvidenceRevision', evidenceId);
  }

  // Update the evidence status to STALE
  await repository.updateEvidenceRevisionStatus(evidenceId, 'STALE');

  // Log the staleness action
  await repository.insertAuditLog({
    action_type: ActionType.EVIDENCE_MARKED_STALE,
    entity_type: 'evidence_revision',
    entity_id: evidenceId,
    actor_account_id: actorId,
    detail: { reason },
  });
}

/**
 * Marks a review decision as stale because its underlying source has changed.
 *
 * @param reviewId - The review decision ID to mark as stale.
 * @param reason - A human-readable explanation.
 * @throws {ValidationError} If parameters are invalid.
 * @throws {NotFoundError} If the review decision doesn't exist.
 */
export async function markReviewDecisionStale(
  reviewId: string,
  reason: string
): Promise<void> {
  if (!isNonEmptyString(reviewId)) {
    throw new ValidationError('reviewId must be a non-empty string');
  }
  if (!isNonEmptyString(reason)) {
    throw new ValidationError('reason must be a non-empty string');
  }

  const review = await repository.getReviewDecisionById(reviewId);
  if (!review) {
    throw new NotFoundError('ReviewDecision', reviewId);
  }

  await repository.updateReviewDecisionStatus(reviewId, 'STALE');

  await repository.insertAuditLog({
    action_type: ActionType.ASSESSMENT_MARKED_STALE,
    entity_type: 'review_decision',
    entity_id: reviewId,
    actor_account_id: 'system',
    detail: { reason },
  });
}

/**
 * Finds all review decisions that reference a particular source document.
 *
 * Used when a source changes so we can cascade staleness to all
 * decisions that were based on that source.
 *
 * @param sourceType - The type of source.
 * @param sourceId - The source document ID.
 * @returns An array of affected review decisions.
 * @throws {ValidationError} If parameters are invalid.
 */
export async function findAffectedReviews(
  sourceType: SourceType,
  sourceId: string
): Promise<ReviewDecision[]> {
  if (!isNonEmptyString(sourceId)) {
    throw new ValidationError('sourceId must be a non-empty string');
  }

  // Find all evidence revisions that reference this source
  const evidenceRevisions = await repository.getEvidenceRevisionsBySource(
    sourceType,
    sourceId
  );

  if (evidenceRevisions.length === 0) {
    return [];
  }

  // Collect evidence revision IDs
  const evidenceIds = evidenceRevisions.map((e) => e.id || e.evidence_revision_id || '');

  // Find all review decisions that reference any of these evidence revisions
  const allReviews: ReviewDecision[] = [];
  for (const evidenceId of evidenceIds) {
    const reviews = await repository.getReviewDecisionsByEvidenceId(evidenceId);
    for (const review of reviews) {
      // De-duplicate by review decision ID
      const rId = review.id || review.review_decision_id;
      if (!allReviews.some((r) => (r.id || r.review_decision_id) === rId)) {
        allReviews.push(review);
      }
    }
  }

  return allReviews;
}

/**
 * Re-checks the current version of a source document and updates
 * the stored version snapshot.
 *
 * @param sourceType - The type of source.
 * @param sourceId - The source document ID.
 * @returns The refreshed source version information.
 * @throws {ValidationError} If parameters are invalid.
 * @throws {ExternalApiError} If the source cannot be fetched.
 */
export async function refreshSourceVersion(
  sourceType: SourceType,
  sourceId: string
): Promise<SourceVersion> {
  if (!isNonEmptyString(sourceId)) {
    throw new ValidationError('sourceId must be a non-empty string');
  }

  const now = new Date().toISOString();
  let version: string;

  switch (sourceType) {
    case SourceType.CONFLUENCE: {
      const versionInfo = await confluenceService.getPageVersion(sourceId);
      version = String(versionInfo.version);
      break;
    }

    case SourceType.JIRA: {
      const issue = await jiraService.getIssue(sourceId);
      const contentForFingerprint = [
        issue.fields.summary || '',
        typeof issue.fields.description === 'string'
          ? issue.fields.description
          : '',
      ].join('\n');
      version = computeFingerprint(contentForFingerprint);
      break;
    }

    default:
      throw new ValidationError(`Unsupported source type: ${String(sourceType)}`);
  }

  // Update the stored version snapshot
  await repository.updateSourceVersion(sourceType, sourceId, version, now);

  return {
    sourceType,
    sourceId,
    version,
    checkedAt: now,
  };
}

/**
 * Returns the timestamp of the last staleness check for a source.
 *
 * @param sourceType - The type of source.
 * @param sourceId - The source document ID.
 * @returns ISO-8601 timestamp string, or null if never checked.
 * @throws {ValidationError} If sourceId is empty.
 */
export async function getLastCheckedTime(
  sourceType: SourceType,
  sourceId: string
): Promise<string | null> {
  if (!isNonEmptyString(sourceId)) {
    throw new ValidationError('sourceId must be a non-empty string');
  }

  const snapshot = await repository.getSourceVersionSnapshot(sourceType, sourceId);
  if (!snapshot) {
    return null;
  }

  return snapshot.checked_at ?? snapshot.last_checked_at ?? null;
}
