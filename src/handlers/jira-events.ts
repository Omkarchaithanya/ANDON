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

    // Do not mark candidate intent stale on arbitrary Jira update (comments, status changes).
    // Set needs_refresh flag; fingerprint will be recomputed when the reviewer next opens the issue.
    await repository.upsertSourceVersion(
      SourceType.JIRA_ISSUE,
      targetId,
      'needs_refresh'
    );
  } catch (err: any) {
    console.error('[Jira Events] Error recording source staleness for Jira event:', err);
  }
}
