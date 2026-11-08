# ADR-008: Context Security, In-Handler Authorization, and ECO-1823 Defense

## Status
Accepted

## Context
Community security audits ("Forge context security: which parts can we trust, and why is it so hard to get right?") and the Forge Security Review Tool (FSRT) highlight critical vulnerabilities:
1. **Unverified Client Context:** Client-submitted payloads (issue keys, user roles, page IDs) are untrusted claims. An attacker could tamper with Custom UI bridge payloads.
2. **Decoupled Authorization Checks:** Separating permission checks from the mutating handler triggers FSRT scanner warnings and risks TOCTOU (time-of-check to time-of-use) bypasses.
3. **ECO-1823 (Transient Socket Hangs):** Forge Custom UI bridges can hang indefinitely if an unhandled socket disconnect occurs, leaving the user with an infinite loading skeleton.
4. **No Remote Compute:** Forge Remote (`requestRemote`) introduces unauthenticated browser vectors; all execution must remain on Forge-hosted compute.

## Decision
1. **Server-Side Identity Anchor (`req.context.accountId`):**
   - Every mutation handler (`confirmRelationship`, `dismissRelationship`, `approveFollowup`) relies strictly on the platform-injected `req.context.accountId`.
   - Never accept an `actingAccountId` parameter from the client payload.
2. **In-Handler Authorization (`asUser` Verification):**
   - The authorization check (verifying the caller has permission to view the Jira issue, read the Confluence baseline, and create follow-up issues in the target project) is executed **directly inside the resolver handler** immediately before executing the database write.
3. **Defense Against ECO-1823:**
   - Every frontend Custom UI hook (`useDiscovery`, `useReviewState`) implements an explicit 15-second client-side timeout.
   - If `@forge/bridge` `invoke()` does not resolve within 15 seconds, the hook cancels the pending state and surfaces an actionable error card with a visible **"Retry Resolver Call"** button. The UI never hangs indefinitely.
4. **Zero Forge Remote:**
   - All logic, deterministic coverage evaluation, and storage operations are hosted entirely within Atlassian Forge infrastructure. No external egress or remote compute is configured.
