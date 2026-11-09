# ANDON — Code Audit, 12 Verified Gaps, and Implementation Plan

Repo audited: `github.com/Omkarchaithanya/ANDON` @ `280f835` (cloned and run in a sandbox).
Method: read `manifest.yml`, `package.json`, all services/resolvers I cite, `schema.sql`, frontend hooks/screens, tests, and docs; ran `npm ci`, `tsc --noEmit`, and `jest`; checked each platform call against current Atlassian docs.

## Read this first: scope and limits of this audit
- **Not found:** the "three files", the "Autonomous AI Agent Team Architecture (Single-Loop Brain + 4 Scoped Domain Skills)" document, and the HLD/LLD/Mechanisms specification are not in the repo and were not uploaded. Section 4 proposes an architecture from the SPEC and the platform docs.
- **Not done:** I did not run anything on a live Atlassian site (no access), and I cannot install software on your machine. Sub-agents: no sub-agent tool exists in this chat. Section 5 is written as work packages you can hand to separate Antigravity agents.
- **Read in depth:** manifest, graph service, LLM service, discovery/confirmation resolvers, auth service (headers + fail-open path), migrations/schema, frontend hooks and dev harness, test setup. **Skimmed only:** staleness, idempotency, scope-comparison, mutation resolver, most UI components. Gaps may exist there too.
- "Oracle Confluence policies" is read as **Atlassian Confluence / Forge platform policies** (egress, data, scopes).
- Local state is better than it looks: `tsc` is clean and 14 suites / 92 tests pass. The problems below are exactly the kind that green local tests hide.

## 1. What the integrations do today, versus what the docs require

| Integration | What the code does | What the current docs say | Result |
|---|---|---|---|
| Teamwork Graph | `api.asUser().requestGraph(query)` with raw page IDs and a string-built query asking for `nodes { id title }` (`teamwork-graph.service.ts:117,183`) | Backend call is `api.asUser().requestTeamworkGraph(query, variables)`. Curated query args take **ARIs**. Results are Relay connections: `edges { node { ... on ConfluencePage { id title } } } pageInfo`. Preview API. | Would error or return nothing on a real site |
| TWG scope | `read:teamwork-graph` in `manifest.yml` | Scopes follow `read:graph:<object>:<product>`, e.g. `read:graph:page:confluence`, `read:graph:user:atlassian`. A **missing scope returns a successful empty result, not an error**. | Scope does not exist; empty results misreported as "no linked pages" |
| Forge LLM | `import { forge } from '@forge/llm'`; `forge.llm.generate({responseFormat})` (`llm.service.ts:169`) | `import { chat } from '@forge/llm'`; `chat({ model, messages })`; read `response.choices[0].message.content`. Manifest needs an `llm` module with `model: [claude]` or lint fails. | Package not even installed; call shape invented |
| Forge SQL | no `sql` module; `sql.executeDDL` on statements read from `schema.sql` via `fs` (`migrations.ts:18,42`); SQLite DDL (`datetime('now')`) | Manifest needs `sql: - key: main, engine: mysql`. Schema changes go through `migrationRunner` from `@forge/sql` (enqueue DDL, run from an install/upgrade trigger or scheduled trigger). Engine is MySQL-compatible (TiDB). | Persistence cannot initialize |
| Async queue | `processQueueEvent` returns `{ processed: true, event }` (`resolvers/index.ts:92`) | Long LLM work belongs in a queue consumer with extended timeout plus Forge Realtime to push the result | Stub that claims success |

## 2. The 12 verified architectural gaps and hardcoded shortcuts

**G1. The app was never deployed or registered; everything is proven only against a local simulator.**
Evidence: `docs/BLOCKERS.md` BLK-001 says the "standalone dev harness simulates Forge resolvers locally with full fidelity"; `manifest.yml` app id `ari:cloud:ecosystem::app/andon-shadow-radar` looks like a placeholder, not a registered id.
Fix: `forge register`, `forge deploy`, `forge install` on a real dev site; all acceptance evidence from that site.

**G2. The UI is hardcoded to one scenario and silently falls back to it.**
Evidence: `FAC-1042`, `AMR-12`, `Page 10482/10483` appear in `useDiscovery.ts`, `useReviewState.ts`, `ChangeLens.tsx`, `EvidenceRedline.tsx`, `ReviewPackage.tsx`, `SiteRegistryView.tsx`, `DecisionHistoryView.tsx`, `FloorPlanLocator.tsx`, many as `value || 'AMR-12'` fallbacks. `index.html` contains a bridge simulator returning a fabricated `demo-intent-aisle7`. A failed live call therefore shows demo data as if real. `SiteRegistryView` and `DecisionHistoryView` are static tables.
Fix: remove every `||` fallback to scenario constants (unresolved fields render `Unknown` with a reason); delete the simulator from the production bundle (keep it only behind a build flag that cannot ship); drive the two static views from resolvers.

**G3. Teamwork Graph integration is wrong in four ways** (API name, ARI arguments, response shape, scope). See table. Also the query is built by string interpolation (`id: "${pageId}"`), which is a GraphQL-injection pattern; use variables. The platform docs also say apps should name operations with a company prefix; the curated-query docs show prefixed names such as `companyName_assignedWork`.
Fix: ARI builder for pages (see `understanding-aris` doc), `requestTeamworkGraph` with variables, parse edges/nodes with `__typename`, request `read:graph:page:confluence` and `read:graph:user:atlassian`, and treat `empty` as **ambiguous** (no data vs scope not granted): surface "Graph returned nothing; this is not the same as no relationship" plus a scope check hint. Check the TWG schema on your site (`GET .../gateway/api/graphql/twg/schema`) before coding, as the docs recommend.

**G4. The LLM layer cannot run, and its outputs are never verified in code.**
Evidence: wrong API; `@forge/llm` is absent from `node_modules`, and `src/types/forge-llm.d.ts` is a hand-written shim that makes `tsc` pass anyway; manifest has no `llm` module (adding it triggers a major version upgrade and admin re-consent); no model id chosen. `llm.service.ts` returns quotes without checking them, and `discovery.resolver.ts` stores `proposal.source_quotes?.[0]?.quoted_text || summary` as `source_quoted_text`. The "quote verification" test only compares string constants to themselves (`test/unit/quote-verification.test.ts`).
Fix: install `@forge/llm`, delete the shim, add the `llm` module, use `chat`, parse with zod, and add a **runtime** verifier: every quote must be a verbatim substring (Unicode-normalized) of the fetched source at the stated revision, else the claim is dropped. Retries max 2, then `Unknown`.

**G5. Persistence layer is SQLite-flavored and cannot initialize on Forge SQL.**
Evidence: no `sql` module in manifest; `schema.sql` uses `datetime('now')`, `TEXT PRIMARY KEY`; `fs.readFileSync(schema.sql)` at runtime reads a file that is not part of the bundled function; `manifest.yml` lists `schema` under `resources` (that block is for UI static resources).
Fix: MySQL-compatible DDL, queued with `migrationRunner.enqueue(...)`, run from an `avi:forge:installed:app` / `upgraded:app` trigger plus a scheduled retry; one `migrationRunner` invocation in the app; no runtime file reads.

**G6. Manifest does not match the docs and was never linted.**
Evidence: invalid scope; `consumer` declared with `resolver: {function, method}` whereas the docs' consumer examples use `queue` + `function`; no `llm`/`sql` modules; no evidence that `forge lint` ever ran. `package.json` `ci` does not run `forge lint`.
Fix: run `forge lint`, correct each module against its reference page, add CI step, record output in `PLATFORM_COMPLIANCE.md`.

**G7. Authorization fails open and trusts client-supplied IDs.**
Evidence: default reviewer policy is `any_authenticated`; on a storage read failure the code "fail[s] open to default policy" (`authorization.service.ts:59,296`). Resolvers take `payload?.issueId` ahead of platform context (`discovery.resolver.ts:26,76`). `handleGetChangeIntent` fetches by id with no ownership/permission check (IDOR). This contradicts your own ADR-008 and the SPEC (admin-configured reviewer policy; permission re-check on open; fail closed).
Fix: default policy = `configured_list` that is empty (nobody can confirm until an admin configures it); storage failure = deny; derive actor from platform `accountId` only; re-fetch the issue as the acting user to authorize every read and write; add IDOR tests.

**G8. The async path is a stub, and heavy work runs inside a single resolver.**
Evidence: `processQueueEvent` does nothing. Discovery calls the graph, fetches every linked page, then runs one LLM call per page **sequentially** inside one resolver invocation.
Fix: resolver enqueues a job; a queue consumer with an extended timeout runs discovery; the UI subscribes via Forge Realtime and shows progress/`Unknown` on timeout. Check invocation, async-event, and LLM limit pages and record numbers in an ADR. Parallelize with a concurrency cap.

**G9. The LLM creates registry entities and defaults hide uncertainty.**
Evidence: `discovery.resolver.ts` auto-inserts a `Zone` from model output (`autoRegisteredFromDiscovery: true`), defaults to `'Operating Zone'`, `'surface_finish'`, and `'unknown'`, and gates on a model-reported `confidence >= 0.5` that is also stored. The SPEC says ambiguous identity stays unresolved and forbids implied reliability.
Fix: zones/deployments come only from the human-approved site registry; unresolved location = `Unknown` candidate requiring human mapping; drop the confidence gate (use verified-quote count and schema validity as gates); do not store or display model confidence.

**G10. Confirmation flow is non-atomic and can degrade to a wrong answer.**
Evidence: `confirmation.resolver.ts` marks the intent `CONFIRMED` (line 51) **before** it loads the deployment (line 54) and may then throw; missing evidence falls back to `{ conditions: [] }`.
Fix: validate everything first, then write inside a single action record (`pending → confirmed | outcome_uncertain`); an empty/missing scope must yield `Unknown`, with a test.

**G11. Tests prove glue, not integration, and there is no eval harness.**
Evidence: all three integration tests `jest.mock` the Jira, Confluence, Graph, LLM, repository, and auth modules, so none of the real calls is ever exercised; no `/evals`, no held-out set, no recorded fixtures, no `no-fakes` or copy-lint script in CI (`scripts/` has only `check-node.js`, `secret-scan.js`); copy-lint is a unit test, not a scan of shipped strings. `STATUS.md` says 73 tests; the suite has 92 (stale docs).
Fix: contract tests from recorded real responses (`npm run record`), a live smoke test against the dev site, an eval runner with a locked held-out split and precision/recall reported separately, and the CI gates listed in section 6.

**G12. The "autonomous agent team" is not implemented, and the docs overstate what exists.**
Evidence: no orchestrator, no tool schemas, no `rovo:agent`/`rovo:skill`/`rovo:mcp` modules, no per-skill scoping; `docs/CUTS.md` and `docs/ASSUMPTIONS.md` are still titled **KEEL** (copied from the other project); `BLOCKERS.md` marks BLK-003 "RESOLVED" without a live call; docs contain `file:///c:/Users/omkar/...` links; `STATUS.md` presents `Page 10482` traversal as verified.
Fix: implement section 4, and correct the docs so every claim points to evidence from a real run.

## 3. Real frameworks and tools: use these instead of building from scratch

| Need | Use | Status |
|---|---|---|
| LLM calls | `@forge/llm` (`chat`, tool definitions, `usage`), `llm` manifest module | verified |
| Graph | `api.asUser().requestTeamworkGraph` (backend), `requestTeamworkGraph` from `@forge/bridge` (frontend), curated queries | verified |
| Persistence | `@forge/sql` with `migrationRunner`, `sql` module `engine: mysql` | verified |
| Queue + long jobs | `@forge/events` queue consumer (extended timeout), `@forge/realtime` for progress | verified |
| Structured output / validation | `zod` (already in repo); `z.toJSONSchema` for tool schemas | zod present; schema export to verify in v4 |
| Agent loop | Thin in-repo orchestrator over `@forge/llm` tool calling. Do **not** add LangChain/LangGraph: heavy, and all model traffic must go through `@forge/llm` (no external egress). | proposal |
| Docs lookup for the coding agent | Forge MCP Server / Forge AI Plugin / Forge skills (AI development toolkit page) | listed in docs; install steps to confirm |
| Security scan | FSRT as referenced in the community Marketplace thread; `forge lint` | find exact command |
| UI testing | `@playwright/test` against the installed Forge app (screenshots, a11y with `@axe-core/playwright`) | proposal |
| Lint/format | `eslint` + `typescript-eslint`, `prettier` | proposal |
| Mutation safety / retries | Hand-written action-record protocol (already designed); no extra library needed | n/a |

## 4. Target architecture

**Single-loop brain, scoped skills, human gate.** One bounded loop in `/src/agent/brain.ts`. It is a state machine, not a free agent: each step picks one skill, validates the output with zod, and stops on `Unknown`, a failed gate, or a step cap.

```
trigger (user opens ticket) → enqueue job → consumer runs brain loop → Realtime → UI
brain: INTAKE → CONTEXT → GROUND → COMPARE → PACKAGE → (stop; human gate)
```

Four scoped skills:
1. **Intake skill**: LLM, no tools. Ticket text in, typed candidate out (attribute, old/new value, timing, location, quotes).
2. **Context skill**: **no LLM.** Graph traversal and registry resolution as the current user; returns only what is accessible, plus permission outcome per hop. Empty result is flagged ambiguous (no data vs scope).
3. **Grounding skill**: **no LLM.** Verbatim-quote verification against fetched page revisions; binds revision numbers; drops unverifiable claims.
4. **Comparison skill**: **pure deterministic code.** Set-membership against the approved scope record; emits `Prospective coverage gap | Supported within declared scope | Unknown`.

## 5. Work packages

- **WP0**: Platform foundation (`forge register`, manifest modules, scopes, `forge lint` clean, CI pipeline)
- **WP1**: Persistence (MySQL DDL, `migrationRunner`, install/upgrade triggers, repository queries)
- **WP2**: Teamwork Graph (ARIs, `requestTeamworkGraph` with variables and connection parsing, scope checks)
- **WP3**: LLM & Bounded Loop (`@forge/llm` `chat`, runtime quote verifier, queue consumer, remove confidence gates/LLM zones)
- **WP4**: Security (fail-closed authorization, actor from context only, re-fetch as user, IDOR protection)
- **WP5**: Frontend (remove scenario fallbacks `|| 'AMR-12'`, real resolvers, Unknown states, separate dev simulator)
- **WP6**: Tests, evals, CI (`no-fakes` scanner, copy-lint script, eval harness with locked split, contract tests)
- **WP7**: Docs integrity (fix KEEL references, remove local links, update all documentation with real evidence)
