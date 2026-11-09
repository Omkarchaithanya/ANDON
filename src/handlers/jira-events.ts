/**
 * @module handlers/jira-events
 * @description Event handler for Jira issue events (updated/created) to detect staleness and content changes.
 */

import { ActionType, SourceType } from '../models/enums';
import { computeFingerprint, hasContentChanged } from '../utils/content-fingerprint';
import * as repository from '../db/repository';
import * as jiraService from '../services/jira.service';
import { Queue } from '@forge/events';

/**
 * Handles Jira issue updated/created events.
 * Note: Unattended background handlers do not have user context, so they only perform local DB reconciliation.
 */
export async function onJiraEvent(event: any, context: any): Promise<void> {
  const issueKey = event?.issue?.key || event?.issueKey;
  const issueId = event?.issue?.id || event?.issueId;

  if (!issueId && !issueKey) return;

  try {
    const existingIntents = await repository.getChangeIntentsByJiraIssueId(issueId);
    if (!existingIntents || existingIntents.length === 0) return;

    // Fetch updated issue to verify fingerprint
    const issue = await jiraService.getIssue(issueId || issueKey);
    const summary = issue.fields?.summary || (issue as any).summary || '';
    const description = issue.fields?.description || (issue as any).description || '';
    const fullText = `${summary}\n${description}`;
    const newFingerprint = computeFingerprint(fullText);

    for (const intent of existingIntents) {
      if (hasContentChanged(intent.content_fingerprint || '', fullText)) {
        // Mark candidate intent as stale
        await repository.insertAuditLog({
          action_type: ActionType.ASSESSMENT_MARKED_STALE,
          entity_type: 'change_intent',
          entity_id: intent.id,
          actor_account_id: 'system:jira-event-handler',
          detail: {
            reason: 'Jira issue description modified after discovery.',
            oldFingerprint: intent.content_fingerprint,
            newFingerprint,
          },
        });
      }
    }

    // Update tracked source version
    await repository.upsertSourceVersion(
      SourceType.JIRA_ISSUE,
      issueId,
      'modified',
      newFingerprint
    );

    // Enqueue event to andon-events queue for background pipeline processing
    try {
      const queue = new Queue({ key: 'andon-events' });
      await queue.push({
        issueId,
        issueKey,
        eventType: event?.eventType || 'jira:issue_updated',
        enqueuedAt: new Date().toISOString(),
      });
    } catch (qErr: any) {
      console.warn('[Jira Events] Could not push to andon-events queue:', qErr?.message);
    }
  } catch (err: any) {
    console.error('Error handling Jira event:', err);
  }
}

