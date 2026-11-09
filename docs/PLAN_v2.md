# ANDON — Master Implementation Plan v2

> **Product:** ANDON — Shadow-Change Radar for Robotized Workplaces  
> **One-Line Pitch:** *Detects overlooked robotics dependencies in facilities maintenance requests before changes break factory floor operations.*  
> **Source of Truth:** `/docs/SPEC.md`

---

## 1. Architecture & Platform Invariants

ANDON runs as an Atlassian Forge Custom UI application with a bounded single-loop pipeline:

1. **Ticket & Confluence Text as Evidence Only:**
   - Jira ticket summaries and descriptions are treated strictly as untrusted evidence, never as agent instructions.
   - Text injections ("ignore previous instructions", role manipulation) are ignored.
2. **Model Only Proposes:**
   - The LLM (`@forge/llm` active Claude model) only extracts physical attribute candidates.
   - The model has ZERO write tools and cannot mutate Jira or Confluence.
3. **Exact NFKC Substring Grounding:**
   - Extracted quotes must be exact NFKC normalized substrings of the fetched source revision. Any ungrounded claim is dropped immediately.
4. **Fail-Closed Unknowns:**
   - Empty or failing Teamwork Graph queries result in `UNKNOWN` ("Graph returned nothing. That is not the same as no relationship.").
   - Missing site registry, zone, or deployment baseline evaluates to `UNKNOWN`.
5. **Deterministic Comparison Engine:**
   - Once human confirms location, deployment, and attribute, comparison is executed by deterministic TypeScript code (`evaluateCoverage`), never an LLM.
   - For high-gloss changes without high-gloss coverage: *"The selected baseline does not establish coverage of the planned high-gloss condition."*
6. **Zero Fabricated Physical Claims:**
   - Strict ban on invented physical hazard language ("braking distance", "friction", "localized emergency stops", "crash").
7. **Cross-Tenant & Permission Isolation:**
   - All source lookups run `asUser`. Private Confluence excerpts are never copied into wider Jira projects.

---

## 2. Platform Modules & Configuration

| Module / Surface | Platform Module | Purpose |
| :--- | :--- | :--- |
| **Clearance Console** | `jira:issuePanel` | Main Custom UI dashboard (`andon-issue-panel`) |
| **Bounded Pipeline** | `src/agent/brain.ts` | 5-step bounded pipeline (INTAKE, CONTEXT, GROUND, COMPARE, PACKAGE) |
| **Async Events Queue** | `modules.consumer` | `andon-events` queue for background reconciliation |
| **Inference Engine** | `@forge/llm` | Manifest model family `claude`, active runtime model `claude-sonnet-4-6` |
| **Relational Database** | `@forge/sql` | Managed MySQL database (`engine: mysql`) with chained migrations |
| **Relationship Traversal** | `api.asUser().requestTeamworkGraph` | Curated GraphQL traversal from Site Registry to Commissioning Records |

---

## 3. Async Strategy Decision (Item 6 Resolution)

In Forge, background queue consumers execute in an unattended app context without a user session. Therefore:
- `api.asUser().requestTeamworkGraph()` cannot be called from an async queue consumer.
- **Design Choice:** Synchronous discovery is run inside user-facing resolvers (`discovery.resolver.ts`) where the authenticated user context is active. When background events arrive via `jira-events.ts`, they are enqueued to `andon-events`. The queue consumer executes the bounded pipeline when preloaded graph pages are passed in the job payload; if preloaded pages are absent, the consumer stops and logs `UNKNOWN` rather than failing open. Authoritative discovery runs in the interactive session.

---

## 4. Database Migrations & Schemas

The database layer uses `@forge/sql` with MySQL syntax and the chained migration runner:
```typescript
import { migrationRunner } from '@forge/sql';
await migrationRunner
  .enqueue('001_initial_schema', DDL_STATEMENTS)
  .run();
```
All entity schemas, foreign keys, and indexes are defined in `src/db/schema.ts`.

---

## 5. Security & Authorization

- **Fail-Closed Mode:** Default policy is `configured_list` with `allowed_account_ids: []`. Unauthorized users are denied access with `AuthorizationError`.
- **Derived Actors:** Actor account IDs are derived directly from Forge context (`context.accountId`), never trusted from frontend payloads.
- **Idempotency:** SHA-256 content fingerprints and deterministic keys prevent duplicate records across webhook retries.
