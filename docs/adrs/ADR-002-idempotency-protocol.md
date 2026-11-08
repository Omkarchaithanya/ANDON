# ADR-002: Idempotent Action Protocol & Multi-Surface Write Reconciliation

## Context
When an authorized engineer accepts a hold or provides a 1-sentence override, Keel produces a **Clearance Record** across three distinct external surfaces:
1. Confluence page template (linked to the issue)
2. Jira comment (compact Clearance Card)
3. Teamwork Graph connector object (or native graph link indexer)

Network interruptions, lambda execution timeouts, or transient 500 errors can cause partial failure where one write succeeds while another is uncertain. Naive retries could produce duplicate Confluence pages, spam Jira comments, or duplicate graph nodes.

Furthermore, `hash(issueKey + evaluatedAt)` is not retry-safe because retrying at a later timestamp produces a different key.

## Decision
1. **Compound Idempotency Key:**
   $$\text{IdempotencyKey} = \text{SHA-256}(\text{issueKey} \parallel \text{evidenceSetHash} \parallel \text{action})$$
   where `evidenceSetHash` is the normalized SHA-256 hash of the gathered evidence IDs and revisions. Retrying the same action on the same evidence produces an identical key regardless of clock time.

2. **Action Record Protocol:**
   Every mutating write-back transitions through three explicit states:
   - `pending`: Action record created with the idempotency key prior to external calls.
   - `confirmed`: All target surfaces confirmed creation.
   - `outcome_uncertain`: An external call timed out or returned an ambiguous HTTP response.

3. **Reconciliation Loop:**
   Before initiating a new or retried write, Keel queries the remote endpoints (Jira issue comments and Confluence page search) using the deterministic clearance identifier. If the entity already exists, the state is marked `confirmed` and duplicate creation is prevented.

## Consequences
- Guaranteed zero duplicate comments or pages upon event replay or network retry.
- Visible, honest write-back status in the panel rather than assuming fake exactly-once execution.

