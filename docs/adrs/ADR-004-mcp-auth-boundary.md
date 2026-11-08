# ADR-004: Model Context Protocol (MCP) Boundary & Authorization

## Context
Keel exposes Model Context Protocol tools (`get_clearance` and `assert_no_hold`) to external coding agents (Cursor, Claude Code, GitHub Copilot).
Foreign agents running locally on developer workstations invoke these tools before merging or tagging releases.

## Decision
1. **Tool Schema:**
   - `get_clearance(issueKey: string)`: Returns `{ status: "CLEAR" | "HOLD" | "OVERRIDE" | "UNKNOWN", findings: Finding[], override?: Override, evaluatedAt: string }`
   - `assert_no_hold(issueKey: string)`: Returns `{ status: "CLEAR" | "HOLD" | "OVERRIDE" | "UNKNOWN", reasons: Array<{ type: string, ref: string }> }`

2. **Fail-Closed on Unauthenticated / Failed Calls:**
   If an external caller lacks authentication, passes an invalid issue key, or encounters an internal timeout, `assert_no_hold` **MUST NEVER** return an error that a naive script could interpret as a pass.
   It returns `{ status: "HOLD", reasons: [{ type: "UNVERIFIED_CALLER", ref: "Auth/System failure; not clear to ship" }] }`.

3. **Rate Limiting & Bounded Execution:**
   MCP tool invocations are bounded to a maximum 10-second timeout, utilizing cached clearance snapshots when available (`hash(evidenceSet)`).

