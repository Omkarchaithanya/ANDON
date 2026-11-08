/**
 * @module handlers/confluence-events
 * @description Event handler for Confluence page events to detect evidence document staleness.
 */

import { ActionType, SourceType } from '../models/enums';
import * as repository from '../db/repository';

/**
 * Handles Confluence page updated events.
 */
export async function onConfluenceEvent(event: any, context: any): Promise<void> {
  const pageId = event?.page?.id || event?.contentId;
  const newVersion = event?.page?.version?.number || event?.version;

  if (!pageId) return;

  try {
    // Check if any evidence revisions reference this page
    const affectedEvidence = await repository.getEvidenceRevisionsBySource(
      SourceType.CONFLUENCE_PAGE,
      pageId
    );

    if (affectedEvidence.length > 0) {
      for (const ev of affectedEvidence) {
        await repository.updateEvidenceRevisionStatus(
          ev.id,
          'stale',
          `Confluence page updated to version ${newVersion || 'unknown'}`
        );

        // Find dependent review decisions
        const affectedReviews = await repository.getReviewDecisionsByEvidenceId(ev.id);
        for (const review of affectedReviews) {
          await repository.updateReviewDecisionStatus(review.id, 'stale');

          await repository.insertAuditLog({
            action_type: ActionType.ASSESSMENT_MARKED_STALE,
            entity_type: 'review_decision',
            entity_id: review.id,
            actor_account_id: 'system:confluence-event-handler',
            detail: {
              confluencePageId: pageId,
              newPageVersion: newVersion,
              evidenceRevisionId: ev.id,
            },
          });
        }
      }

      await repository.upsertSourceVersion(
        SourceType.CONFLUENCE_PAGE,
        pageId,
        String(newVersion || 'updated')
      );
    }
  } catch (err: any) {
    console.error('Error handling Confluence event:', err);
  }
}

