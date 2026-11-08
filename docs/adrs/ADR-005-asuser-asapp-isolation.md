# ADR-005: Permissions Isolation (`asUser` vs `asApp`) & Restricted Citations

## Context
In Atlassian Cloud, access controls prevent unauthorized users from viewing confidential Confluence spaces, sensitive Jira tickets, or private repositories.
If Keel evaluates evidence as an elevated app superuser (`asApp`) and displays quoted findings to a user lacking read permissions, it would leak confidential information.

## Decision
1. **User Context Execution (`asUser` by default):**
   - Whenever an issue panel or action is opened by an authenticated human user, all Jira, Confluence, and Teamwork Graph calls are executed as that viewing user (`api.asUser()`).
   - If the user lacks access to a linked Confluence page containing a governing decision, Keel cannot display the quote.
2. **Restricted Citation Handling:**
   - A finding where the viewing user lacks read permission is marked with type `RESTRICTED`.
   - The citation text is masked: `"Citation text restricted by Atlassian access policy"`.
   - Crucially: **A RESTRICTED finding counts as a blocking hold reason, never as a clear!**
3. **Scheduled Trigger / Background Execution (`asApp`):**
   - Nightly re-evaluation sweeps run under `api.asApp()`.
   - Any derived record created by background processes flags that `asApp` was used, and subsequent user-facing reads independently re-verify user access before displaying quotes.

