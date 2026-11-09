/**
 * @module authorization.service
 * @description Authorization layer for ANDON operations.
 *
 * Determines whether users are permitted to perform specific ANDON actions:
 * reviewing deployments, confirming relationships, approving follow-ups,
 * and accessing source documents.
 *
 * For MVP, the authorization model supports three modes:
 * - `owner_only`: Only the deployment owner can review.
 * - `configured_list`: A static list of account IDs can review.
 * - `any_authenticated`: Any authenticated user can review.
 */

import api, { route } from '@forge/api';
import { ActionType, SourceType } from '../models/enums';
import {
  AuthorizationError,
  ExternalApiError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';
import * as repository from '../db/repository';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Defines the reviewer policy for ANDON review actions.
 */
export interface ReviewerPolicy {
  /** The authorization mode. */
  mode: 'owner_only' | 'configured_list' | 'any_authenticated';
  /** Account IDs allowed to review (only used when mode is 'configured_list'). */
  allowed_account_ids?: string[];
}

/**
 * Represents the current authenticated user.
 */
export interface CurrentUser {
  /** The Atlassian account ID. */
  accountId: string;
  /** The user's display name. */
  displayName: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** App property key for storing the reviewer policy. */
const REVIEWER_POLICY_PROPERTY_KEY = 'andon:reviewer-policy';

/** Default policy when no configuration exists: fail closed. */
const DEFAULT_REVIEWER_POLICY: ReviewerPolicy = {
  mode: 'configured_list',
  allowed_account_ids: [],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Gets the currently authenticated user from the Forge invocation context.
 *
 * Uses the Atlassian `/rest/api/3/myself` endpoint to resolve the calling
 * user's account ID and display name.
 *
 * @returns The current user's account ID and display name.
 * @throws {AuthorizationError} If no user context is available (e.g., in an event handler).
 * @throws {ExternalApiError} If the Atlassian API call fails.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  let response: any;
  try {
    response = await api.asUser().requestJira(route`/rest/api/3/myself`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new AuthorizationError(
      `Failed to get current user — this may be an event handler without user context: ${message}`
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthorizationError(
      'No authenticated user context available. Event handlers cannot determine the current user.'
    );
  }

  if (!response.ok) {
    throw new ExternalApiError(
      `Jira API returned HTTP ${response.status} for /myself`
    );
  }

  const data = (await response.json()) as {
    accountId: string;
    displayName: string;
  };

  if (!data.accountId) {
    throw new AuthorizationError('User context is missing accountId');
  }

  return {
    accountId: data.accountId,
    displayName: data.displayName || 'Unknown User',
  };
}

/**
 * Checks whether a user is authorized to review a specific deployment.
 *
 * The authorization check depends on the configured reviewer policy:
 * - `owner_only`: Only the deployment's owner (creator) can review.
 * - `configured_list`: Must be in the static allowed list.
 * - `any_authenticated`: Any authenticated user can review.
 *
 * @param accountId - The Atlassian account ID of the user.
 * @param deploymentId - The deployment ID to check review access for.
 * @returns True if the user is authorized to review.
 * @throws {ValidationError} If accountId or deploymentId is empty.
 */
export async function isAuthorizedReviewer(
  accountId: string,
  deploymentId: string
): Promise<boolean> {
  if (!isNonEmptyString(accountId)) {
    throw new ValidationError('accountId must be a non-empty string');
  }
  if (!isNonEmptyString(deploymentId)) {
    throw new ValidationError('deploymentId must be a non-empty string');
  }

  const policy = await getReviewerPolicy();

  switch (policy.mode) {
    case 'any_authenticated':
      return true;

    case 'configured_list': {
      const allowedIds = policy.allowed_account_ids ?? [];
      return allowedIds.includes(accountId);
    }

    case 'owner_only': {
      // Look up the deployment to find the owner
      const deployment = await repository.getDeploymentById(deploymentId);
      if (!deployment) {
        throw new NotFoundError(`Deployment ${deploymentId} not found`);
      }
      return deployment.owner_account_id === accountId;
    }

    default:
      // Fail-closed: if the mode is unrecognised, deny access
      return false;
  }
}

/**
 * Checks whether a user is authorized to confirm a relationship
 * (i.e., accept or reject an LLM-proposed relationship between
 * a change intent and a condition).
 *
 * For MVP, any authenticated user can confirm relationships.
 *
 * @param accountId - The Atlassian account ID of the user.
 * @returns True if the user can confirm relationships.
 * @throws {ValidationError} If accountId is empty.
 */
export async function canConfirmRelationship(
  accountId: string
): Promise<boolean> {
  if (!isNonEmptyString(accountId)) {
    throw new ValidationError('accountId must be a non-empty string');
  }

  // MVP: any authenticated user can confirm relationships
  return true;
}

/**
 * Checks whether a user is authorized to approve follow-up creation
 * (i.e., trigger the creation of a follow-up Jira issue from a
 * review decision).
 *
 * For MVP, any authenticated user can approve follow-ups.
 *
 * @param accountId - The Atlassian account ID of the user.
 * @returns True if the user can approve follow-up creation.
 * @throws {ValidationError} If accountId is empty.
 */
export async function canApproveFollowup(
  accountId: string
): Promise<boolean> {
  if (!isNonEmptyString(accountId)) {
    throw new ValidationError('accountId must be a non-empty string');
  }

  // MVP: any authenticated user can approve follow-ups
  return true;
}

/**
 * Verifies that a user can access the referenced source document.
 *
 * For Confluence sources, attempts a user-context page fetch.
 * For Jira sources, attempts a user-context issue read.
 * Returns true only if the fetch succeeds (HTTP 200).
 *
 * @param accountId - The Atlassian account ID of the user (used for audit, not auth check).
 * @param sourceType - The type of source (CONFLUENCE or JIRA).
 * @param sourceId - The source document ID (page ID or issue key).
 * @returns True if the user can access the source.
 * @throws {ValidationError} If any parameter is invalid.
 */
export async function canAccessSource(
  accountId: string,
  sourceType: SourceType,
  sourceId: string
): Promise<boolean> {
  if (!isNonEmptyString(accountId)) {
    throw new ValidationError('accountId must be a non-empty string');
  }
  if (!isNonEmptyString(sourceId)) {
    throw new ValidationError('sourceId must be a non-empty string');
  }

  try {
    switch (sourceType) {
      case SourceType.CONFLUENCE: {
        const response = await api
          .asUser()
          .requestConfluence(route`/wiki/api/v2/pages/${sourceId}`);
        return response.ok;
      }

      case SourceType.JIRA: {
        const response = await api
          .asUser()
          .requestJira(route`/rest/api/3/issue/${sourceId}?fields=summary`);
        return response.ok;
      }

      default:
        // Unknown source type — fail-closed
        return false;
    }
  } catch {
    // Network or API failure — user cannot access
    return false;
  }
}

/**
 * Gets the configured reviewer policy from app storage.
 *
 * Falls back to the default policy (`any_authenticated`) if no
 * policy is configured.
 *
 * @returns The configured ReviewerPolicy.
 */
export async function getReviewerPolicy(): Promise<ReviewerPolicy> {
  try {
    const stored = await repository.getAppConfig(REVIEWER_POLICY_PROPERTY_KEY);

    if (!stored) {
      return DEFAULT_REVIEWER_POLICY;
    }

    const parsed = (typeof stored === 'string' ? JSON.parse(stored) : stored) as Partial<ReviewerPolicy>;

    // Validate the stored policy
    if (
      parsed.mode === 'owner_only' ||
      parsed.mode === 'configured_list' ||
      parsed.mode === 'any_authenticated'
    ) {
      return {
        mode: parsed.mode,
        allowed_account_ids: Array.isArray(parsed.allowed_account_ids)
          ? parsed.allowed_account_ids.filter(
              (id): id is string => typeof id === 'string'
            )
          : undefined,
      };
    }

    // Invalid mode — fail closed
    return DEFAULT_REVIEWER_POLICY;
  } catch (err: unknown) {
    // Storage read failure — fail closed, never fail open
    const message = err instanceof Error ? err.message : String(err);
    throw new AuthorizationError(
      `Failed to read reviewer policy from storage; failing closed: ${message}`
    );
  }
}

/**
 * Validates that a user is permitted to perform a specific action on an entity.
 *
 * Throws an AuthorizationError if the user is not permitted. This is the
 * primary guard used by resolvers before executing mutations.
 *
 * @param accountId - The Atlassian account ID of the actor.
 * @param action - The action being attempted.
 * @param entityId - The target entity ID (deployment, review, etc.).
 * @throws {ValidationError} If accountId or entityId is empty.
 * @throws {AuthorizationError} If the user is not permitted.
 */
export async function validateActorForAction(
  accountId: string,
  action: ActionType,
  entityId: string
): Promise<void> {
  if (!isNonEmptyString(accountId)) {
    throw new ValidationError('accountId must be a non-empty string');
  }
  if (!isNonEmptyString(entityId)) {
    throw new ValidationError('entityId must be a non-empty string');
  }

  let authorized = false;

  switch (action) {
    case ActionType.RELATIONSHIP_CONFIRMED:
      authorized = await canConfirmRelationship(accountId);
      break;

    case ActionType.FOLLOWUP_APPROVED:
      authorized = await canApproveFollowup(accountId);
      break;

    default:
      authorized = await isAuthorizedReviewer(accountId, entityId);
      break;
  }

  if (!authorized) {
    throw new AuthorizationError(
      `User ${accountId} is not authorized to perform action "${action}" on entity ${entityId}`
    );
  }
}
