/**
 * @module queue-consumer
 * @description Async queue consumer processing Jira issue events and discovery pipeline.
 */

import { executeBoundedPipeline } from '../agent/brain';

export async function processQueueEvent(event: any): Promise<void> {
  console.log('[ANDON Queue Consumer] Received event:', JSON.stringify(event));

  const payload = event?.payload || event;
  const issueKey = payload?.issueKey || payload?.issue?.key;

  if (!issueKey) {
    console.warn('[ANDON Queue Consumer] Missing issueKey in payload, skipping.');
    return;
  }

  try {
    const result = await executeBoundedPipeline(issueKey);
    console.log('[ANDON Queue Consumer] Bounded pipeline execution finished:', result.status);
  } catch (err: any) {
    console.error(`[ANDON Queue Consumer] Pipeline failed for ${issueKey}:`, err?.message || err);
    throw err;
  }
}
