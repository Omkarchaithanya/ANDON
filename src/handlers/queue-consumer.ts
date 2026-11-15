/**
 * @module queue-consumer
 * @description Async queue consumer processing Jira issue events.
 *
 * NOTE (Platform Constraint): Teamwork Graph queries (api.asUser().requestTeamworkGraph())
 * require an active user session context and cannot be queried unattended in an async
 * event queue consumer. When preloaded graph pages are passed in the job payload,
 * the bounded pipeline executes. Otherwise, the consumer logs UNKNOWN and returns
 * a structured failure, requiring synchronous discovery execution via the user resolver.
 */

import { executeBoundedPipeline } from '../agent/brain';

export async function processQueueEvent(event: any): Promise<{ status: string; reason?: string }> {
  console.log('[ANDON Queue Consumer] Received event:', JSON.stringify(event));

  const payload = event?.payload || event;
  const issueKey = payload?.issueKey || payload?.issue?.key;
  const graphPages = payload?.graphPages;

  if (!issueKey) {
    console.warn('[ANDON Queue Consumer] Missing issueKey in payload, skipping.');
    return {
      status: 'UNKNOWN',
      reason: 'Missing issueKey in event payload.',
    };
  }

  if (!graphPages || !Array.isArray(graphPages) || graphPages.length === 0) {
    const reason =
      `Unattended queue event for ${issueKey} lacks preloaded graph pages. ` +
      `Teamwork Graph traversal requires active user session context (asUser). Status is UNKNOWN.`;
    console.warn(`[ANDON Queue Consumer] UNKNOWN: ${reason}`);
    return {
      status: 'UNKNOWN',
      reason,
    };
  }

  try {
    const result = await executeBoundedPipeline(issueKey, graphPages);
    console.log('[ANDON Queue Consumer] Bounded pipeline execution result:', result.status);
    return {
      status: result.status,
      reason: result.reason,
    };
  } catch (err: any) {
    console.error(`[ANDON Queue Consumer] Pipeline failed for ${issueKey}:`, err?.message || err);
    throw err;
  }
}
