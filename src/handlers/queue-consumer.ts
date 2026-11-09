/**
 * @module queue-consumer
 * @description Async queue consumer processing Jira issue events and discovery pipeline.
 *
 * NOTE (Platform Constraint): Teamwork Graph queries (api.asUser().requestTeamworkGraph())
 * require an active user session context and cannot be queried unattended in an async
 * event queue consumer. When preloaded graph pages are passed in the job payload,
 * the bounded pipeline executes. Otherwise, the consumer records status UNKNOWN and stops,
 * requiring synchronous discovery execution via the resolver in a user session.
 */

import { executeBoundedPipeline } from '../agent/brain';

export async function processQueueEvent(event: any): Promise<void> {
  console.log('[ANDON Queue Consumer] Received event:', JSON.stringify(event));

  const payload = event?.payload || event;
  const issueKey = payload?.issueKey || payload?.issue?.key;
  const graphPages = payload?.graphPages;

  if (!issueKey) {
    console.warn('[ANDON Queue Consumer] Missing issueKey in payload, skipping.');
    return;
  }

  if (!graphPages || !Array.isArray(graphPages) || graphPages.length === 0) {
    console.info(
      `[ANDON Queue Consumer] Event for ${issueKey} has no preloaded graph pages. ` +
      `As documented in ADR-007 and PLAN_v2, Teamwork Graph queries require user session context (asUser), ` +
      `so unattended queue processing without preloaded pages yields UNKNOWN. ` +
      `Synchronous discovery via user resolver is the authoritative path.`
    );
    return;
  }

  try {
    const result = await executeBoundedPipeline(issueKey, graphPages);
    console.log('[ANDON Queue Consumer] Bounded pipeline execution finished:', result.status);
  } catch (err: any) {
    console.error(`[ANDON Queue Consumer] Pipeline failed for ${issueKey}:`, err?.message || err);
    throw err;
  }
}

