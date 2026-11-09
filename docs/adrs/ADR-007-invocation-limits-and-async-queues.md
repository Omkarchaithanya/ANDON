# ADR-007: Platform Invocation Limits, Timeout Budgets, and Async Event Queues

## Status
Accepted

## Context
Official Atlassian Forge limits documentation (see `https://developer.atlassian.com/platform/forge/platform-quotas-and-limits/` and `https://developer.atlassian.com/platform/forge/limits-invocation/`) defines hard execution boundaries:
- Standard resolver / Custom UI bridge invocation time limit: **25 seconds**.
- Long-running functions / Async event consumer (`modules.consumer`): **55 seconds**.
- Forge SQL query execution timeout: **5 seconds per query**.
- Scheduled triggers: maximum frequency 1/hour, **55 seconds execution**.

If an integration traversal (Jira work request ➔ Confluence Site Registry Page 10482 ➔ Teamwork Graph ➔ Robot Commissioning Baseline Page 10483) experiences upstream latency, a naive synchronous pipeline risks hitting the 25s deadline, throwing an unhandled timeout error to the user.

## Decision
1. **Synchronous UI Resolvers (`getDiscoveryContext`, `getEvidenceRedline`, `getReviewPackage`):**
   - Strictly bounded to an internal 10-second timeout budget per external fetch.
   - If any upstream call exceeds the budget or fails, the resolver **fails closed** returning status `UNKNOWN` or `OUTCOME_UNCERTAIN`. It never hangs until the 25s Forge platform cutoff.
2. **Background Re-evaluation via Async Event Queues (`modules.consumer`):**
   - Whenever a Jira issue or Confluence baseline page is updated (`trigger.events`), the event handler pushes an idempotent task onto the `andon-events` queue.
   - The queue consumer processes background revalidation under the 55-second long-running budget without blocking the interactive UI.
3. **Fail-Closed Resilience:**
   - A slow or unresponsive upstream dependency produces a deterministic `Unknown` finding with an inspectable reason, preserving the safety rule: *Unknown is never cleared without explicit human confirmation.*

