/**
 * @module confirmation.resolver
 * @description Resolvers for human confirmation and dismissal of candidate change relationships.
 */

import { DiscoveryStatus, ActionType, ReviewStatus, CoverageResult, FollowupCreationStatus, SourceType } from '../models/enums';
import { ReviewDecision } from '../models/entities';
import { ValidationError, NotFoundError, AuthorizationError, StaleSourceError } from '../utils/errors';
import { validateConfirmationInput, validateDismissalInput } from '../models/schemas';
import * as repository from '../db/repository';
import * as authService from '../services/authorization.service';
import * as scopeComparisonService from '../services/scope-comparison.service';
import * as stalenessService from '../services/staleness.service';

/**
 * Handles human confirmation of candidate relationship, runs deterministic coverage comparison, and stores review decision.
 */
export async function handleConfirmRelationship(
  payload: any,
  context: any
): Promise<ReviewDecision | { status: 'unknown'; coverage_result: CoverageResult; reason: string }> {
  validateConfirmationInput(payload);
  const { changeIntentId, deploymentId, confirmedAttribute, confirmedValue } = payload;

  // Derive actor account ID from Forge context, never from payload
  const actorAccountId = context?.localAccountId || context?.accountId || (await authService.getCurrentUser()).accountId;
  if (!actorAccountId) {
    throw new AuthorizationError('No authenticated actor account ID found in context.');
  }

  const canConfirm = await authService.canConfirmRelationship(actorAccountId, deploymentId);
  if (!canConfirm) {
    throw new AuthorizationError('User does not have permission to confirm change relationships.');
  }

  const intent = await repository.getChangeIntentById(changeIntentId);
  if (!intent) {
    throw new NotFoundError('ChangeIntent', changeIntentId);
  }

  if (intent.discovery_status !== DiscoveryStatus.CANDIDATE) {
    throw new ValidationError(`Cannot confirm change intent with status "${intent.discovery_status}".`);
  }

  // Verify that source document has not become stale
  if (intent.jira_issue_id) {
    const check = await stalenessService.checkSourceStaleness(
      SourceType.JIRA_ISSUE,
      intent.jira_issue_id,
      intent.content_fingerprint || ''
    );
    if (check.isStale) {
      throw new StaleSourceError(intent.jira_issue_id, check.currentVersion || 'modified');
    }
  }

  // 1. Load deployment and its evidence revisions FIRST
  const deployment = await repository.getDeploymentById(deploymentId);
  if (!deployment) {
    throw new NotFoundError('Deployment', deploymentId);
  }

  const evidenceRevisions = await repository.getEvidenceRevisionsByDeploymentId(deploymentId);
  const currentEvidence = evidenceRevisions.find((e) => e.status === 'current') || evidenceRevisions[0];

  // 2. Validate declared scope. If scope is missing or empty, return typed Unknown without inserting a review decision or fake id.
  const declaredScope = currentEvidence?.declared_scope as any;
  if (
    !declaredScope ||
    !Array.isArray(declaredScope.conditions) ||
    declaredScope.conditions.length === 0
  ) {
    return {
      status: 'unknown',
      coverage_result: CoverageResult.UNKNOWN,
      reason: 'Baseline evidence has no declared operating condition scope. Coverage cannot be determined.',
    };
  }

  // 3. Deterministic Coverage Comparison (PURE CODE, NO LLM)
  const evaluation = scopeComparisonService.evaluateCoverage(
    {
      attribute_name: confirmedAttribute,
      proposed_value: confirmedValue || intent.proposed_value || '',
    },
    declaredScope,
    evidenceRevisions
  );

  const coverageDetail = scopeComparisonService.buildCoverageDetail(evaluation);

  // 4. WRITE ONLY AFTER VALIDATION
  await repository.confirmChangeIntent(changeIntentId, actorAccountId);

  const reviewDecision = await repository.insertReviewDecision({
    change_intent_id: changeIntentId,
    deployment_id: deploymentId,
    evidence_revision_id: currentEvidence?.id || null,
    coverage_result: evaluation.result,
    coverage_detail: coverageDetail,
    reviewer_account_id: actorAccountId,
    review_status:
      evaluation.result === CoverageResult.GAP
        ? ReviewStatus.CONFIRMED_GAP
        : evaluation.result === CoverageResult.COVERED
        ? ReviewStatus.CONFIRMED_COVERED
        : ReviewStatus.PENDING,
    source_versions_at_review: {
      sources: [
        {
          source_type: SourceType.JIRA_ISSUE,
          source_id: intent.jira_issue_id,
          version: intent.content_fingerprint || '1',
          checked_at: new Date().toISOString(),
        },
      ],
    },
  });

  // 5. Audit Log
  await repository.insertAuditLog({
    action_type: ActionType.RELATIONSHIP_CONFIRMED,
    entity_type: 'change_intent',
    entity_id: changeIntentId,
    actor_account_id: actorAccountId,
    detail: {
      deploymentId,
      confirmedAttribute,
      confirmedValue,
      coverageResult: evaluation.result,
      reviewDecisionId: reviewDecision.id,
    },
  });

  return reviewDecision;
}

/**
 * Handles human dismissal of a candidate relationship.
 * Enforces reviewer authorization policy and rejects empty reasons.
 */
export async function handleDismissRelationship(payload: any, context: any): Promise<{ success: boolean }> {
  validateDismissalInput(payload);
  const { changeIntentId, reason } = payload;

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    throw new ValidationError('A non-empty dismissal reason is required.');
  }

  const actorAccountId = context?.localAccountId || context?.accountId || (await authService.getCurrentUser()).accountId;
  if (!actorAccountId) {
    throw new AuthorizationError('No authenticated actor account ID found in context.');
  }

  const intent = await repository.getChangeIntentById(changeIntentId);
  if (!intent) {
    throw new NotFoundError('ChangeIntent', changeIntentId);
  }

  // Enforce reviewer policy fail-closed
  const canDismiss = await authService.canConfirmRelationship(actorAccountId, (intent as any).deployment_id);
  if (!canDismiss) {
    throw new AuthorizationError('User does not have permission to dismiss change relationships under active reviewer policy.');
  }

  await repository.dismissChangeIntent(changeIntentId, actorAccountId, reason.trim());

  await repository.insertAuditLog({
    action_type: ActionType.RELATIONSHIP_DISMISSED,
    entity_type: 'change_intent',
    entity_id: changeIntentId,
    actor_account_id: actorAccountId,
    detail: { reason: reason.trim() },
  });

  return { success: true };
}
