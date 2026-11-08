/**
 * @module idempotency.service
 * @description Idempotency and duplicate prevention for ANDON operations.
 *
 * Ensures that repeated processing of the same Jira issue, the same
 * proposed change, or the same follow-up action does not create duplicate
 * records. Also handles "uncertain" state reconciliation when an external
 * API call (e.g., Jira issue creation) succeeded but the response was lost.
 */

import { ActionType } from '../models/enums';
import { ValidationError } from '../utils/errors';
import { isNonEmptyString, generateIdempotencyKey } from '../utils/validation';
import * as repository from '../db/repository';
import * as jiraService from './jira.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of an idempotency check.
 */
export interface IdempotencyResult {
  /** Whether this operation has already been performed. */
  isDuplicate: boolean;
  /** The ID of the existing entity if this is a duplicate. */
  existingEntityId?: string;
  /** The current status of the existing entity if this is a duplicate. */
  existingStatus?: string;
}

/**
 * Result of reconciling an uncertain follow-up action.
 */
export interface ReconciliationResult {
  /** Whether the reconciliation was able to resolve the uncertainty. */
  resolved: boolean;
  /** The action taken to resolve. */
  action: 'found_existing' | 'confirmed_missing' | 'still_uncertain';
  /** The Jira issue key if the follow-up was found to exist. */
  jiraIssueKey?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Prefix for change intent idempotency keys. */
const CHANGE_INTENT_KEY_PREFIX = 'ci';

/** Prefix for follow-up idempotency keys. */
const FOLLOWUP_KEY_PREFIX = 'fu';

/** ANDON Jira entity property key used to store idempotency metadata. */
const ANDON_IDEMPOTENCY_PROPERTY = 'andon:idempotency';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Checks whether a change intent has already been created for the given
 * Jira issue + attribute + value combination.
 *
 * This prevents duplicate change intents when the same webhook fires
 * multiple times or a user manually triggers re-processing.
 *
 * @param jiraIssueId - The Jira issue ID that triggered the change intent.
 * @param proposedAttribute - The attribute being changed.
 * @param proposedValue - The proposed new value.
 * @returns An IdempotencyResult indicating whether this is a duplicate.
 * @throws {ValidationError} If any parameter is empty.
 */
export async function checkChangeIntentIdempotency(
  jiraIssueId: string,
  proposedAttribute: string,
  proposedValue: string
): Promise<IdempotencyResult> {
  if (!isNonEmptyString(jiraIssueId)) {
    throw new ValidationError('jiraIssueId must be a non-empty string');
  }
  if (!isNonEmptyString(proposedAttribute)) {
    throw new ValidationError('proposedAttribute must be a non-empty string');
  }
  if (!isNonEmptyString(proposedValue)) {
    throw new ValidationError('proposedValue must be a non-empty string');
  }

  const idempotencyKey = generateChangeIntentKey(
    jiraIssueId,
    proposedAttribute,
    proposedValue
  );

  const existing = await repository.getChangeIntentByIdempotencyKey(idempotencyKey);

  if (existing) {
    return {
      isDuplicate: true,
      existingEntityId: existing.id,
      existingStatus: existing.discovery_status,
    };
  }

  return {
    isDuplicate: false,
  };
}

/**
 * Checks whether a follow-up action has already been created for the given
 * change intent + deployment combination.
 *
 * This prevents duplicate follow-up Jira issues when a review decision
 * is processed multiple times.
 *
 * @param changeIntentId - The change intent ID.
 * @param deploymentId - The deployment ID.
 * @returns An IdempotencyResult indicating whether this is a duplicate.
 * @throws {ValidationError} If any parameter is empty.
 */
export async function checkFollowupIdempotency(
  changeIntentId: string,
  deploymentId: string
): Promise<IdempotencyResult> {
  if (!isNonEmptyString(changeIntentId)) {
    throw new ValidationError('changeIntentId must be a non-empty string');
  }
  if (!isNonEmptyString(deploymentId)) {
    throw new ValidationError('deploymentId must be a non-empty string');
  }

  const idempotencyKey = generateFollowupKey(changeIntentId, deploymentId);

  const existing = await repository.getFollowupByIdempotencyKey(idempotencyKey);

  if (existing) {
    return {
      isDuplicate: true,
      existingEntityId: existing.id,
      existingStatus: existing.review_status,
    };
  }

  return {
    isDuplicate: false,
  };
}

/**
 * Generates a deterministic idempotency key for a change intent.
 *
 * The key is built from the Jira issue ID, proposed attribute, and
 * proposed value, ensuring the same combination always produces the
 * same key.
 *
 * @param jiraIssueId - The Jira issue ID.
 * @param attribute - The attribute being changed.
 * @param value - The proposed new value.
 * @returns A deterministic idempotency key string.
 */
export function generateChangeIntentKey(
  jiraIssueId: string,
  attribute: string,
  value: string
): string {
  const normalised = [
    jiraIssueId.trim().toLowerCase(),
    attribute.trim().toLowerCase(),
    value.trim().toLowerCase(),
  ].join('|');

  return generateIdempotencyKey(CHANGE_INTENT_KEY_PREFIX, normalised);
}

/**
 * Generates a deterministic idempotency key for a follow-up action.
 *
 * @param changeIntentId - The change intent ID.
 * @param deploymentId - The deployment ID.
 * @returns A deterministic idempotency key string.
 */
export function generateFollowupKey(
  changeIntentId: string,
  deploymentId: string
): string {
  const normalised = [
    changeIntentId.trim().toLowerCase(),
    deploymentId.trim().toLowerCase(),
  ].join('|');

  return generateIdempotencyKey(FOLLOWUP_KEY_PREFIX, normalised);
}

/**
 * Reconciles a follow-up action that was left in an "uncertain" state.
 *
 * This handles the case where a Jira API call to create a follow-up issue
 * succeeded on the Jira side but the response was lost (e.g., network
 * timeout). The method searches Jira for the issue using the idempotency
 * metadata stored as an issue entity property.
 *
 * Reconciliation logic:
 * 1. Look up the uncertain action record from the database.
 * 2. If it has a Jira project key + idempotency key, search Jira for
 *    issues with the matching entity property.
 * 3. If found: update our record with the Jira issue key → resolved.
 * 4. If not found: mark as confirmed_missing → the action can be retried.
 * 5. If search fails: leave as still_uncertain.
 *
 * @param actionId - The follow-up action ID (or review decision ID) to reconcile.
 * @returns A ReconciliationResult describing the outcome.
 * @throws {ValidationError} If actionId is empty.
 */
export async function reconcileUncertainAction(
  actionId: string
): Promise<ReconciliationResult> {
  if (!isNonEmptyString(actionId)) {
    throw new ValidationError('actionId must be a non-empty string');
  }

  // Look up the uncertain action record
  const actionRecord = await repository.getUncertainAction(actionId);
  if (!actionRecord) {
    return {
      resolved: false,
      action: 'still_uncertain',
    };
  }

  const idempotency_key = actionRecord.followup_idempotency_key;
  const project_key = (actionRecord as any).project_key || 'ROBOT';
  const followup_jira_issue_key = actionRecord.followup_jira_issue_key;

  // If we already have the Jira issue key, it's already resolved
  if (followup_jira_issue_key) {
    return {
      resolved: true,
      action: 'found_existing',
      jiraIssueKey: followup_jira_issue_key,
    };
  }

  // Search Jira for an issue with our idempotency metadata
  if (!project_key || !idempotency_key) {
    return {
      resolved: false,
      action: 'still_uncertain',
    };
  }

  try {
    // Search for issues in the project that might be our follow-up.
    // We use JQL to narrow the search, then check entity properties.
    const jql = `project = "${project_key}" AND summary ~ "ANDON" ORDER BY created DESC`;
    const candidates = await jiraService.searchIssues(jql, ['summary']);

    for (const candidate of candidates) {
      try {
        const property = await jiraService.getIssueProperty(
          candidate.key,
          ANDON_IDEMPOTENCY_PROPERTY
        );

        if (
          property &&
          typeof property === 'object' &&
          (property as Record<string, unknown>).idempotency_key === idempotency_key
        ) {
          // Found the matching issue — update our record
          await repository.resolveUncertainAction(actionId, candidate.key);

          return {
            resolved: true,
            action: 'found_existing',
            jiraIssueKey: candidate.key,
          };
        }
      } catch {
        // Property read failed for this candidate — skip it
        continue;
      }
    }

    // No matching issue found — confirm it's missing
    await repository.markActionConfirmedMissing(actionId);

    return {
      resolved: true,
      action: 'confirmed_missing',
    };
  } catch {
    // Search itself failed — we still can't tell
    return {
      resolved: false,
      action: 'still_uncertain',
    };
  }
}

/**
 * Marks a follow-up creation action as "uncertain" — meaning we sent
 * the Jira API request but lost the response.
 *
 * This allows later reconciliation via {@link reconcileUncertainAction}.
 *
 * @param reviewDecisionId - The review decision ID whose follow-up is uncertain.
 * @throws {ValidationError} If reviewDecisionId is empty.
 */
export async function markActionUncertain(
  reviewDecisionId: string
): Promise<void> {
  if (!isNonEmptyString(reviewDecisionId)) {
    throw new ValidationError('reviewDecisionId must be a non-empty string');
  }

  await repository.markFollowupUncertain(reviewDecisionId);

  await repository.insertAuditLog({
    action_type: ActionType.ASSESSMENT_MARKED_STALE,
    entity_type: 'review_decision',
    entity_id: reviewDecisionId,
    actor_account_id: 'system',
    detail: {
      action: 'MARK_UNCERTAIN',
      reason: 'Follow-up Jira issue creation response was lost. Marked as uncertain for later reconciliation.',
    },
  });
}
