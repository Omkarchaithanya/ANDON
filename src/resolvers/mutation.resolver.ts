/**
 * @module mutation.resolver
 * @description Enterprise production resolver for creating reviewer-approved follow-up Jira tasks.
 *
 * All operations interact directly with the real Jira REST API and Forge SQL with idempotency protection.
 */

import { ActionType, FollowupCreationStatus, SourceType } from '../models/enums';
import { ValidationError, NotFoundError, AuthorizationError, StaleSourceError } from '../utils/errors';
import { validateFollowupApprovalInput } from '../models/schemas';
import { isNonEmptyString } from '../utils/validation';
import * as repository from '../db/repository';
import * as jiraService from '../services/jira.service';
import * as authService from '../services/authorization.service';
import * as idempotencyService from '../services/idempotency.service';
import * as stalenessService from '../services/staleness.service';
import * as configService from '../services/config.service';

/**
 * Creates an approved follow-up Jira task with idempotency and retry protection.
 */
export async function handleApproveFollowup(payload: any, context: any): Promise<any> {
  validateFollowupApprovalInput(payload);
  const { reviewDecisionId, targetProjectKey, summary, description } = payload;

  const user = await authService.getCurrentUser();
  const canApprove = await authService.canApproveFollowup(user.accountId);
  if (!canApprove) {
    throw new AuthorizationError('You do not have permission to approve follow-up work creation.');
  }

  const reviewDecision = await repository.getReviewDecisionById(reviewDecisionId);
  if (!reviewDecision) {
    throw new NotFoundError('ReviewDecision', reviewDecisionId);
  }

  // Idempotency check: don't create duplicate follow-up
  const idempotencyKey = idempotencyService.generateFollowupKey(
    reviewDecision.change_intent_id,
    reviewDecision.deployment_id
  );

  const existingFollowup = await repository.getFollowupByIdempotencyKey(idempotencyKey);
  if (existingFollowup && existingFollowup.followup_creation_status === FollowupCreationStatus.CREATED) {
    return {
      success: true,
      issueKey: existingFollowup.followup_jira_issue_key,
      issueId: existingFollowup.followup_jira_issue_id,
      message: 'Follow-up task already exists for this review decision.',
      duplicate: true,
    };
  }

  // Staleness check: ensure reviewed sources haven't changed since review
  if (reviewDecision.evidence_revision_id) {
    const evidence = await repository.getEvidenceRevisionById(reviewDecision.evidence_revision_id);
    if (evidence?.confluence_page_id) {
      const check = await stalenessService.checkSourceStaleness(
        SourceType.CONFLUENCE_PAGE,
        evidence.confluence_page_id,
        String(evidence.confluence_page_version || 1)
      );
      if (check.isStale) {
        throw new StaleSourceError(evidence.confluence_page_id, check.currentVersion || 'modified');
      }
    }
  }

  // Mark action PENDING before invoking external mutation
  await repository.updateReviewDecisionFollowup(
    reviewDecisionId,
    '',
    '',
    FollowupCreationStatus.PENDING
  );

  try {
    const createdIssue = await jiraService.createIssue({
      projectKey: targetProjectKey.trim().toUpperCase(),
      summary: summary.trim(),
      description: description.trim(),
      issueTypeName: 'Task',
    });

    // Update with real created issue details
    await repository.updateReviewDecisionFollowup(
      reviewDecisionId,
      createdIssue.id,
      createdIssue.key,
      FollowupCreationStatus.CREATED
    );

    await repository.insertAuditLog({
      action_type: ActionType.FOLLOWUP_CREATED,
      entity_type: 'review_decision',
      entity_id: reviewDecisionId,
      actor_account_id: user.accountId,
      detail: {
        createdIssueKey: createdIssue.key,
        targetProjectKey,
        idempotencyKey,
      },
    });

    return {
      success: true,
      issueKey: createdIssue.key,
      issueId: createdIssue.id,
      message: 'Follow-up review task created successfully in Jira.',
    };
  } catch (err: any) {
    // If call failed ambiguously, mark as UNCERTAIN for reconciliation
    await repository.markFollowupUncertain(reviewDecisionId);

    await repository.insertAuditLog({
      action_type: ActionType.FOLLOWUP_CREATION_FAILED,
      entity_type: 'review_decision',
      entity_id: reviewDecisionId,
      actor_account_id: user.accountId,
      detail: { error: err.message },
    });

    throw err;
  }
}

/**
 * Prepares the Review Package data including coverage gaps, responsible owners, and procedures.
 */
export async function handleGetReviewPackage(payload: any, context: any): Promise<any> {
  const { reviewDecisionId } = payload || {};
  if (!isNonEmptyString(reviewDecisionId)) {
    throw new ValidationError('reviewDecisionId is required.');
  }

  const reviewDecision = await repository.getReviewDecisionById(reviewDecisionId);
  if (!reviewDecision) {
    throw new NotFoundError('ReviewDecision', reviewDecisionId);
  }

  const changeIntent = await repository.getChangeIntentById(reviewDecision.change_intent_id);
  const deployment = await repository.getDeploymentById(reviewDecision.deployment_id);
  let zone = null;
  if (deployment?.zone_id) {
    zone = await repository.getZoneById(deployment.zone_id);
  }

  let evidence = null;
  if (reviewDecision.evidence_revision_id) {
    evidence = await repository.getEvidenceRevisionById(reviewDecision.evidence_revision_id);
  }

  const coverageDetail =
    typeof reviewDecision.coverage_detail === 'string'
      ? JSON.parse(reviewDecision.coverage_detail)
      : reviewDecision.coverage_detail;

  // Retrieve configuration for default target project
  let defaultProject = '';
  try {
    const config = await configService.getValidatedConfig();
    defaultProject = config.defaultFollowupProjectKey || '';
  } catch {
    defaultProject = '';
  }

  // Derive procedures dynamically from evidence metadata or default verification standard
  const evidenceMeta = (evidence?.metadata as any) || {};
  const testProcedures = evidenceMeta.procedures || [
    {
      name: 'Physical Condition Revalidation',
      source: evidence?.confluence_page_id ? `Confluence Page (${evidence.confluence_page_id})` : 'Baseline Documentation',
      description: 'Perform visual and instrumental validation of the modified environmental condition before robot operation.',
    },
    {
      name: 'Sensor and Navigation Verification',
      source: evidence?.confluence_page_id ? `Confluence Page (${evidence.confluence_page_id})` : 'Baseline Documentation',
      description: 'Execute sensor perception check and route waypoint validation under the new operating environment.',
    },
  ];

  const deploymentName = deployment?.deployment_identifier || 'Automated System';
  const zoneName = zone?.name || 'Operating Zone';
  const attributeName = changeIntent?.proposed_attribute || 'Condition';
  const proposedVal = changeIntent?.proposed_value || 'Modified State';

  return {
    reviewDecision,
    changeIntent,
    deployment,
    evidence,
    coverageDetail,
    responsibleReviewer: {
      accountId: deployment?.owner_account_id || 'unassigned',
      displayName: deployment?.owner_account_id ? `Owner (${deployment.owner_account_id})` : 'Deployment Owner',
      deploymentIdentifier: deploymentName,
      zoneName: zoneName,
    },
    applicableProcedures: testProcedures,
    proposedFollowup: {
      targetProjectKey: defaultProject,
      summary: `[ANDON Review] ${deploymentName} - ${attributeName} change in ${zoneName}`,
      description:
        `Prospective coverage gap identified by ANDON:\n\n` +
        `Work request (${changeIntent?.jira_issue_key || 'Intake Ticket'}) proposes modification of "${attributeName}" to "${proposedVal}".\n\n` +
        `Baseline commissioning evidence does not establish coverage of this condition.\n\n` +
        `Required Actions:\n1. Review the proposed physical change with facilities staff.\n2. Complete revalidation procedures prior to deployment window.`,
    },
  };
}
