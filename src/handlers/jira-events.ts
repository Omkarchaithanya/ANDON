/**
 * @module handlers/jira-events
 * @description Event handler for Jira issue events (updated/created) to detect staleness.
 * Unattended background event handlers run without an active user session, so they perform
 * local database reconciliation only without making user-scoped API calls.
 */

import { ActionType, DiscoveryStatus, SourceType } from '../models/enums';
import * as repository from '../db/repository';

/**
 * Handles Jira issue updated/created events.
 * Marks existing local change intents as stale and records source revision status.
 */
export async function onJiraEvent(event: any, _context?: any): Promise<void> {
  const issueKey = event?.issue?.key || event?.issueKey;
  const issueId = event?.issue?.id || event?.issueId;

  if (!issueId && !issueKey) return;

  try {
    const targetId = issueId || issueKey;
    const existingIntents = await repository.getChangeIntentsByJiraIssueId(targetId);
    if (!existingIntents || existingIntents.length === 0) return;

    for (const intent of existingIntents) {
      // Mark candidate intent as stale upon source ticket modification
      await repository.updateChangeIntentStatus(intent.id, DiscoveryStatus.STALE);

      await repository.insertAuditLog({
        action_type: ActionType.ASSESSMENT_MARKED_STALE,
        entity_type: 'change_intent',
        entity_id: intent.id,
        actor_account_id: 'system:jira-event-handler',
        detail: {
          reason: 'Source Jira issue was modified. Re-discovery required.',
          issueKey,
          issueId,
        },
      });
    }

    // Update tracked source version in local repository
    await repository.upsertSourceVersion(
      SourceType.JIRA_ISSUE,
      targetId,
      'modified'
    );
  } catch (err: any) {
    console.error('[Jira Events] Error recording source staleness for Jira event:', err);
  }
}
