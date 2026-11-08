/**
 * @module confirmation.resolver
 * @description Resolvers for human confirmation and dismissal of candidate change relationships.
 */

import { DiscoveryStatus, ActionType, ReviewStatus } from '../models/enums';
import { ReviewDecision } from '../models/entities';
import { ValidationError, NotFoundError, AuthorizationError, StaleSourceError } from '../utils/errors';
import { validateConfirmationInput, validateDismissalInput } from '../models/schemas';
import * as repository from '../db/repository';
import * as authService from '../services/authorization.service';
import * as scopeComparisonService from '../services/scope-comparison.service';
import * as stalenessService from '../services/staleness.service';
import { SourceType } from '../models/enums';

/**
 * Handles human confirmation of candidate relationship, runs deterministic coverage comparison, and stores review decision.
 */
export async function handleConfirmRelationship(payload: any, context: any): Promise<ReviewDecision> {
  validateConfirmationInput(payload);
  const { changeIntentId, deploymentId, confirmedAttribute, confirmedValue } = payload;

  const user = await authService.getCurrentUser();
  const canConfirm = await authService.canConfirmRelationship(user.accountId);
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

  // 1. Mark intent as CONFIRMED
  await repository.confirmChangeIntent(changeIntentId, user.accountId);

  // 2. Fetch deployment and its evidence revisions
  const deployment = await repository.getDeploymentById(deploymentId);
  if (!deployment) {
    throw new NotFoundError('Deployment', deploymentId);
  }

  const evidenceRevisions = await repository.getEvidenceRevisionsByDeploymentId(deploymentId);
  const currentEvidence = evidenceRevisions.find((e) => e.status === 'current') || evidenceRevisions[0];

  // 3. Deterministic Coverage Comparison (PURE CODE, NO LLM)
  const evaluation = scopeComparisonService.evaluateCoverage(
    {
      attribute_name: confirmedAttribute,
      proposed_value: confirmedValue || intent.proposed_value || '',
    },
    currentEvidence?.declared_scope as any || { conditions: [] },
    evidenceRevisions
  );

  const coverageDetail = scopeComparisonService.buildCoverageDetail(evaluation);

  // 4. Create review decision record
  const reviewDecision = await repository.insertReviewDecision({
    change_intent_id: changeIntentId,
    deployment_id: deploymentId,
    evidence_revision_id: currentEvidence?.id || null,
    coverage_result: evaluation.result,
    coverage_detail: coverageDetail,
    reviewer_account_id: user.accountId,
    review_status: ReviewStatus.CONFIRMED_GAP,
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
    actor_account_id: user.accountId,
    detail: {
      deploymentId,
      confirmedAttribute,
      confirmedValue,
      coverageResult: evaluation.result,
    },
  });

  return reviewDecision;
}

/**
 * Handles explicit human dismissal of a candidate relationship with an audit reason.
 */
export async function handleDismissRelationship(payload: any, context: any): Promise<{ success: boolean; message: string }> {
  validateDismissalInput(payload);
  const { changeIntentId, reason } = payload;

  const user = await authService.getCurrentUser();
  const intent = await repository.getChangeIntentById(changeIntentId);
  if (!intent) {
    throw new NotFoundError('ChangeIntent', changeIntentId);
  }

  await repository.dismissChangeIntent(changeIntentId, user.accountId, reason);

  await repository.insertAuditLog({
    action_type: ActionType.RELATIONSHIP_DISMISSED,
    entity_type: 'change_intent',
    entity_id: changeIntentId,
    actor_account_id: user.accountId,
    detail: { reason },
  });

  return {
    success: true,
    message: 'Candidate relationship dismissed successfully.',
  };
}

