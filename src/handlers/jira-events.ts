/**
 * @module handlers/jira-events
 * @description Event handler for Jira issue events (updated/created) to detect staleness.
 * Unattended background event handlers run without an active user session, so they perform
 * local database reconciliation only without making user-scoped API calls.
 */

import { ActionType, DiscoveryStatus, SourceType } from '../models/enums';
import * as repository from '../db/repository';
import { computeJiraIssueFingerprint } from '../utils/content-fingerprint';
import { adfToPlainText } from '../utils/adf';

/**
 * Handles Jira issue updated/created events.
 * Recomputes content fingerprint and marks change intents stale ONLY when the fingerprint changed.
 */
export async function onJiraEvent(event: any, _context?: any): Promise<void> {
  const issueKey = event?.issue?.key || event?.issueKey;
  const issueId = event?.issue?.id || event?.issueId;

  if (!issueId && !issueKey) return;

  try {
    const targetId = issueId || issueKey;
    const existingIntents = await repository.getChangeIntentsByJiraIssueId(targetId);
    if (!existingIntents || existingIntents.length === 0) return;

    const summary = event?.issue?.fields?.summary ?? event?.issue?.summary;
    const rawDescription = event?.issue?.fields?.description ?? event?.issue?.description;

    if (summary !== undefined || rawDescription !== undefined) {
      const plainDescription = adfToPlainText(rawDescription);
      const newFingerprint = computeJiraIssueFingerprint(summary || '', plainDescription);

      for (const intent of existingIntents) {
        if (
          intent.content_fingerprint &&
          intent.content_fingerprint !== newFingerprint &&
          intent.discovery_status === DiscoveryStatus.CANDIDATE
        ) {
          await repository.updateChangeIntentStatus(intent.id, DiscoveryStatus.STALE);
          await repository.insertAuditLog({
            action_type: ActionType.ASSESSMENT_MARKED_STALE,
            entity_type: 'change_intent',
            entity_id: intent.id,
            actor_account_id: 'system:jira-event-handler',
            detail: {
              reason: 'Jira issue updated event detected content fingerprint change.',
              previousFingerprint: intent.content_fingerprint,
              newFingerprint,
            },
          });
        }
      }
    }

    await repository.upsertSourceVersion(
      SourceType.JIRA_ISSUE,
      targetId,
      'evaluated'
    );
  } catch (err: any) {
    console.error('[Jira Events] Error recording source staleness for Jira event:', err);
  }
}
