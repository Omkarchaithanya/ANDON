/**
 * @module workflow.resolver
 * @description Jira workflow validator that blocks transitions while ANDON clearance is HOLD.
 */

import * as repository from '../db/repository';
import { CoverageResult, ReviewStatus } from '../domain/enums';

export async function blockRelease(payload: any): Promise<{ result: boolean; errorMessage?: string }> {
  const issueId = payload?.issue?.id || payload?.issueId;
  if (!issueId) {
    // If no issue context, allow transition to avoid blocking unrelated workflows
    return { result: true };
  }

  const intents = await repository.getChangeIntentsByJiraIssueId(issueId);
  if (!intents || intents.length === 0) {
    // No ANDON change intent on this issue -> allow transition
    return { result: true };
  }

  const latest = intents[0];
  const reviews = await repository.getReviewDecisionsByChangeIntentId(latest.id);
  const latestReview = reviews?.[0];

  if (!latestReview) {
    return {
      result: false,
      errorMessage: 'ANDON review pending. Operating assumption relationship has not been evaluated.',
    };
  }

  if (latestReview.review_status === ReviewStatus.STALE) {
    return {
      result: false,
      errorMessage: 'ANDON review is stale. Source specifications have changed; please re-verify.',
    };
  }

  if (latestReview.coverage_result === CoverageResult.GAP && latestReview.review_status !== ReviewStatus.CONFIRMED_COVERED) {
    return {
      result: false,
      errorMessage: 'ANDON clearance is HOLD: prospective coverage gap detected without confirmed override.',
    };
  }

  return { result: true };
}
