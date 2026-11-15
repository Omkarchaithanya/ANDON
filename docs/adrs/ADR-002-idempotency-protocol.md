# ADR-002: Compound Idempotency Hashing & Three-State Action Reconciliation

## Status
Accepted

## Context
Network timeouts, webhooks re-deliveries, and transient platform errors can cause lost responses or duplicate action dispatches when creating Jira follow-up tasks or recording human reviews. Naive retries risk creating duplicate Jira issues in engineering projects.

## Decision
1. **Deterministic Idempotency Keys:** Follow-up Jira issue creation uses deterministic SHA-256 compound keys:
   `idempotencyKey = hash(changeIntentId + '::' + deploymentId)`
2. **Three-State Action Lifecycle:** Actions transition through explicit states:
   - `PENDING`: Action recorded before remote dispatch.
   - `CONFIRMED`: Successful remote response (HTTP 201).
   - `OUTCOME_UNCERTAIN`: Network failure or timeout before response receipt.
3. **Reconciliation Protocol:** Before any retry, `reconcileUncertainAction` checks existing follow-up records by key. If the task was already created, the existing reference is linked rather than duplicated.
