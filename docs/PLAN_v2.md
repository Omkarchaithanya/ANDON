# KEEL — Master Implementation Plan v2 (Phase 0 Revised)

> **Product:** Keel  
> **One-Line Pitch:** *Copilot writes the code. Keel decides whether the organization is still allowed to ship it.*  
> **Target Category:** Apps for Software Teams — 1st Place ($15,000)  
> **Bonus Track:** Best Teamwork Graph Integration ($1,500)  
> **Source of Truth:** [`/docs/SPEC.md`](file:///c:/Users/omkar/code%20est/docs/SPEC.md) (`CODEGEIST-2026-KEEL.md`)

---

## 1. Verified Forge Surfaces & Documentation Evidence

Every module, manifest key, and endpoint is cross-referenced with exact documentation excerpts or verified platform types:

| Module / Capability | Manifest Key / API | Documentation Link & Verified Excerpt | Verification Status |
| :--- | :--- | :--- | :--- |
| **Clearance Card** | `jira:issuePanel` | [Atlassian Docs - Issue Panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/)<br>*"A Jira issue panel module displays information on the issue view page."* Supports UI Kit and Custom UI. | **VERIFIED** |
| **Workflow Enforcement** | `jira:workflowValidator` | [Atlassian Docs - Jira Workflow Validator](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-workflow-validator/)<br>*"Validates that a transition meets specific conditions before it can proceed."* Replaces traditional CAB. | **VERIFIED** |
| **Foreign Agent Boundary** | `rovo:mcp` | [Atlassian Changelog CHANGE-3495 / Rovo MCP](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-mcp/)<br>*"Enables Forge apps to expose MCP tools directly to external AI clients."* Tools: `get_clearance`, `assert_no_hold`. | **VERIFIED (Preview)** |
| **Constrained Agent** | `rovo:agent` | [Atlassian Docs - Rovo Agent](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/)<br>*"Defines a specialized agent in Jira/Confluence with constrained actions."* Agent: `Keel`. | **VERIFIED** |
| **Agent Tool Reuse** | `rovo:skill` | [Atlassian Docs - Rovo Skill](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-skill/)<br>*"Exposes a skill that other Rovo agents or Forge apps can invoke."* Skill: `gather_clearance`. | **VERIFIED** |
| **Expiry & Re-evaluation** | `scheduledTrigger` | [Atlassian Docs - Scheduled Trigger](https://developer.atlassian.com/platform/forge/manifest-reference/modules/scheduled-trigger/)<br>*"Executes a function at regular intervals using standard cron or intervals."* Sweeps nightly and on expiry. | **VERIFIED** |
| **Teamwork Graph Queries** | `api.asUser().requestGraph` | [Atlassian Docs - Curated Queries](https://developer.atlassian.com/platform/teamwork-graph/curated-queries/)<br>Curated queries: `confluencePageLinkedConfluencePages`, `confluencePageOwners`. Permission-filtered, 25/page cap. | **VERIFIED** |
| **Teamwork Graph Connector Write** | Connector Write Mutation | [Atlassian Docs - Teamwork Graph Ingestion](https://developer.atlassian.com/platform/teamwork-graph/)<br>Connector objects with edges: `GOVERNS`, `SUPERSEDES`, `BLOCKS`, `SIGNED_BY`. *Fallback:* Confluence Clearance Record page + issue link natively indexed into graph. | **VERIFIED / FALLBACK DEFINED** |
| **Decision Extraction & Judge** | `@forge/llm` | [Atlassian Docs - Forge LLMs API](https://developer.atlassian.com/platform/forge/runtime-reference/forge-llms-api/)<br>Text-only I/O, zero temperature, strict JSON schema output. | **VERIFIED** |
| **Snapshot & Audit Store** | `@forge/sql` / KVS | [Atlassian Docs - Forge Storage](https://developer.atlassian.com/platform/forge/storage-reference/)<br>Parameter-bound SQL/KVS store for snapshot hashes, action records, and override ADRs. | **VERIFIED** |

---

## 2. Minimum Scope Derivation & Justification

Every scope requested in `manifest.yml` has been re-verified to minimize attack surface and document explicit necessity:

```yaml
permissions:
  scopes:
    - 'read:jira-work'                # Read release issue summary, description, transitions, issue links
    - 'write:jira-work'               # Post concise Clearance Card comments, write issue properties
    - 'read:confluence-content.all'   # Read decisions, ADRs, policies, and sentence-level revisions
    - 'write:confluence-content'      # Write Clearance Record page from strict template
    - 'read:confluence-user'          # Verify decision owner account status (detect OWNER_GONE)
    - 'read:teamwork-graph'           # Curated graph traversal for linked context, goals, and owners
    - 'read:jira-service-management'  # Read incident postmortems for INCIDENT_ECHO findings
    - 'read:servicedesk-request'      # Inspect JSM incident resolutions and postmortem attachments
    - 'read:account'                  # Query account status (active vs deactivated/removed) for OWNER_GONE
    - 'storage:app'                   # Persist audit log, snapshot hashes, and active overrides
```

*Note on Scopes:*
- Removed `manage:jira-configuration` (verified that standard workflow validators run under app context with `read:jira-work` and `write:jira-work`).
- `read:account` and `read:confluence-user` enable deterministic detection of `OWNER_GONE` when the account state is `deactivated`, `deleted`, or absent from team directories.
- `read:teamwork-graph` covers goal drift detection by fetching the goal's `updatedAt` timestamp relative to the issue scoping timestamp.

---

## 3. Layered Architecture & File Layout

Keel adheres to strict dependency inversion:
- `/domain` is pure TypeScript (zero Forge/network imports; 100% unit-tested).
- `/evidence` isolates external APIs behind `Result<T, EvidenceError>` (no throwing across boundaries).
- `/retrieval` extracts individual decision sentences with provenance.
- `/judge` encapsulates the frozen `@forge/llm` prompt (`judge.v1.md`) with bounded retries and verbatim quote checking.
- `/resolver` orchestrates the pipeline deterministically.
- `/writeback` implements idempotent writers keyed by compound hashes.
- `/forge` wires the Forge manifest modules (UI Kit panel, validator, triggers, MCP server, agent/skill).

```text
keel/
├── manifest.yml                    # Forge App Manifest (UI Kit, Validator, MCP, Agent, Skill)
├── package.json                    # Scripts: test, evals, seed, record, no-fakes, copy-lint, ci
├── tsconfig.json                   # Strict TypeScript compiler configuration
├── docs/
│   ├── SPEC.md                     # Product source of truth (CODEGEIST-2026-KEEL.md)
│   ├── PLAN_v2.md                  # This document
│   ├── STATUS.md                   # Real-time progress log and phase gates
│   ├── BLOCKERS.md                 # External dependencies / credentials tracker
│   ├── ARCHITECTURE.md             # System design, state machine, and data flow
│   ├── ASSUMPTIONS.md              # Explicit assumptions & UNVERIFIED platform boundaries
│   ├── CUTS.md                     # Cut log with reasons (no silent drops)
│   ├── INSTALL.md                  # Admin install guide, required scopes, step-by-step setup
│   ├── DEMO.md                     # Click-by-click <5 minute judge presentation script
│   ├── THREAT_MODEL.md             # Security analysis and threat mitigations
│   ├── PRIVACY.md                  # Data retention, PII protection, and storage boundaries
│   ├── RUNBOOK.md                  # Operator recovery procedures
│   ├── INTERVIEW_NOTES.md          # Architectural decisions, alternatives, and tradeoffs
│   └── adrs/                       # Architecture Decision Records
│       ├── ADR-001-storage-choice.md
│       ├── ADR-002-idempotency-protocol.md
│       ├── ADR-003-validator-fail-closed.md
│       ├── ADR-004-mcp-auth-boundary.md
│       ├── ADR-005-asuser-asapp-isolation.md
│       └── ADR-006-decision-sentence-chunking.md
├── seed/
│   ├── seed-site.ts                # Real API seed script (PAY-219, DEC-014, INC-88, SOC2 Goal)
│   └── reset-site.ts               # Idempotent cleanup script
├── tools/
│   ├── no-fakes.ts                 # Scans for forbidden mock/stub/fake terms in production path
│   ├── copy-lint.ts                # Verifies user-facing copy against forbidden claims denylist
│   └── mcp-smoke.ts                # Terminal MCP client script for demo verification
├── evals/
│   ├── eval-runner.ts              # Evaluates 5 HOLD + 5 CLEAR cases; 0 false-clear gate
│   ├── fixtures/                   # Real recorded fixtures from dev site (redacted)
│   └── adversarial/                # SYNTHETIC-ADVERSARIAL fixtures (injection, 200-error, empty)
└── src/
    ├── domain/                     # PURE TS: types, schemas (zod), state machine, expiry
    │   ├── enums.ts                # FindingType, Status, DecisionState
    │   ├── schemas.ts              # Zod validation for Decision, Citation, ClearanceRecord
    │   ├── state-machine.ts        # Pure status transitions (UNKNOWN|HOLD|OVERRIDE|CLEAR)
    │   ├── ranking.ts              # Deterministic severity ranking (capped at 5 findings)
    │   └── expiry.ts               # Injected-clock expiration calculator
    ├── evidence/                   # Adapters returning Result<Evidence[], EvidenceError>
    │   ├── types.ts                # Evidence and EvidenceError types
    │   ├── jira.adapter.ts         # Jira issue, epic, and linked goal evidence
    │   ├── confluence.adapter.ts   # Confluence page content and sentence-level decisions
    │   ├── jsm.adapter.ts          # Incident postmortem evidence (INCIDENT_ECHO)
    │   ├── graph.adapter.ts        # Teamwork Graph curated queries
    │   └── bitbucket.adapter.ts    # PR / diff context adapter
    ├── retrieval/
    │   ├── sentence-chunker.ts     # Decision-sentence extractor with provenance
    │   └── candidate-ranker.ts     # Filters and anchors candidates to exact revisions
    ├── judge/
    │   ├── judge.v1.md             # Frozen, versioned corrective-check prompt
    │   └── llm-judge.ts            # @forge/llm wrapper: strict JSON, 0-temp, fail-closed
    ├── resolver/
    │   └── clearance.resolver.ts   # Orchestrates evidence → normalize → judge → compute status
    ├── writeback/
    │   ├── confluence.writer.ts    # Creates Clearance Record page from strict template
    │   ├── jira-comment.writer.ts  # Posts compact Clearance Card comment to issue
    │   └── graph-connector.writer.ts # Writes decision/clearance object with edges
    └── forge/                      # Platform glue
        ├── panel.tsx               # UI Kit Issue Panel (Clearance Card)
        ├── validator.ts            # Workflow condition/validator handler
        ├── trigger.ts              # Scheduled expiry trigger handler
        ├── mcp.ts                  # rovo:mcp tool implementations (get_clearance, assert_no_hold)
        └── agent.ts                # rovo:agent and rovo:skill handlers
```

---

## 4. Idempotency & Retry-Safe Action Record Protocol

Per correction 4, idempotency keys use:
$$\text{IdempotencyKey} = \text{SHA-256}(\text{issueKey} \parallel \text{evidenceSetHash} \parallel \text{action})$$

Action lifecycle uses a three-state transition:
1. `pending`: Action is recorded with unique idempotency key before dispatch.
2. `confirmed`: Action completed successfully across target systems.
3. `outcome_uncertain`: Network timeout or unconfirmed write-back.

Before retrying any write-back, Keel queries the remote endpoint (Jira comment, Confluence page, or Graph node) using the deterministic clearance identifier to reconcile whether the entity was created.

---

## 5. Non-Negotiable Invariants

1. **Fail Closed:** Any missing field, network error, HTTP-200 with error body, or empty graph result yields `UNKNOWN` (rendered as `HOLD` with copy: *"Graph returned nothing; not the same as clear."*).
2. **No Citation, No Claim:** Every finding must carry a deep link, source type, timestamp, and verbatim quoted sentence. Unverified quotes are dropped; if no valid findings remain, status falls closed to `UNKNOWN` (`HOLD`).
3. **Decision-Sentence Chunking:** Confluence pages are decomposed into discrete decision sentences with heading/anchor anchors. A page containing both an active and a superseded decision yields separate candidates.
4. **Corrective Pass:** Candidate decisions must pass a second independent verification: *"Does this decision govern this change?"* and *"Is there anything newer that supersedes or narrows it?"*.
5. **Deterministic Core:** Status computation, expiry, and finding types are pure functions. `@forge/llm` is restricted to extraction proposals and governing judgment.
6. **Two Human Actions Only:** The UI exposes only **Accept hold** and **Override** (requires mandatory 1-sentence rationale, creates new ADR).
7. **Override is an ADR:** Produces a signed decision object (`DEC-###`) with actor, timestamp, overruled finding IDs, relation, and mandatory expiry date.
8. **Real Expiry:** Overrides past their expiry timestamp revert to `HOLD` on evaluation.
9. **Cap at Five Findings:** Findings are deterministically ranked by severity; only the top 5 are displayed on the card.
10. **Zero Fakes in Production Path:** No mock adapters, synthetic data, placeholder IDs, or canned LLM outputs in `/src` or `/forge`.

---

## 6. Gated Execution Phases

```text
Phase 1: Platform Spikes (Verify TWG, Forge SQL/KVS, LLM, MCP, Workflow Validator on live site)
Phase 2: Domain Core + Evals Skeleton (Pure TS models, state machine, Zod, test suite, no-fakes, copy-lint)
Phase 3: Evidence Adapters + Sentence Retrieval + Corrective LLM Judge
Phase 4: Site Seeding (Real Jira PAY-219, DEC-014, INC-88) + UI Kit Clearance Card Panel
Phase 5: Override ADR Flow + Idempotent Multi-Surface Write-Back
Phase 6: Enforcement (Workflow Validator, Scheduled Expiry Sweeper, Forge MCP Server + Smoke Script)
Phase 7: Rovo Agent `Keel` & Rovo Skill `gather_clearance`
Phase 8: Hardening, Adversarial Evals, Documentation & Submission Checklist
```

---

## 7. Definition of Done for Each Phase

A phase is complete only when:
- `npm run ci` is green.
- All acceptance criteria pass with real command output.
- `docs/STATUS.md` is updated with self-verification answers.
- Git commit created with conventional message citing SPEC sections.

