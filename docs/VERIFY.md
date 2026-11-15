# ANDON Verification & Audit Report (VERIFY.md)

> **Product:** ANDON (Shadow-Change Radar for Robotized Workplaces)  
> **Verification Status:** 100% Verified (24 Test Suites, 134 Unit & Integration Tests Passing)  
> **Integrity Guarantee:** Zero fake bridges, zero simulated fallbacks, zero hardcoded benchmark fixtures.

---

## 1. Executive Summary

This verification report confirms the complete remediation and live-readiness of the ANDON Forge application (`andon-shadow-radar`). All dummy demo shells, mock fixtures, and fallback shims have been excised from the production paths. The Forge custom UI issue panel directly mounts the authoritative ANDON ChangeLens workflow bound strictly to the Jira issue context.

---

## 2. Phase-by-Phase Verification Log

### Phase 1: Stop Shipping the Dummy Product
- **Action:** Purged hybrid demo shells (Meely dashboard, 60fps floorplan editor, technician PWA) from production bundle. Moved to unimported reference harness in `demo/hybrid-harness/`.
- **Panel Entry:** Restored `static/frontend/src/App.tsx` to mount `ChangeLens` (`Screen.CHANGE_LENS`) as the sole default view. Removed keyboard shortcuts 1–4.
- **Bridge Harness:** `static/frontend/src/dev-bridge.ts` rejects synthetic mock data and reports honest bridge status: *"Forge bridge unavailable. This panel only works inside a Jira issue on an installed app."*
- **Dev Server:** `scripts/dev-server.ts` requires real Atlassian credentials (`ATLASSIAN_SITE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`) and refuses to serve in-memory synthetic scenarios.
- **UI Cleansing:** Removed hardcoded rows from `SiteRegistryView.tsx` and `DecisionHistoryView.tsx`. Refactored `FloorPlanLocator.tsx` and `StaleRibbon.tsx` to render dynamic parameters without benchmark strings. Removed `StatesGallery` from the issue panel.
- **Scanner Enforcement:** `scripts/no-fakes.js` scans `src/`, `static/frontend/src/`, `scripts/`, and build artifacts, failing CI on banned fixtures.

### Phase 2: Jira Text is Real Text
- **ADF Converter:** Implemented `src/utils/adf.ts` (`adfToPlainText`), recursively converting Jira v3 ADF document trees (headings, lists, codeblocks, mentions, hardbreaks) to clean plain text.
- **Text Binding:** Integrated `adfToPlainText` everywhere Jira descriptions are ingested: `src/agent/brain.ts`, `src/resolvers/discovery.resolver.ts`, `src/services/staleness.service.ts`, and `src/utils/content-fingerprint.ts`.
- **Fallback Rule:** If description is absent or null, summary alone is used without producing `[object Object]`.

### Phase 3: One Reviewer Policy & Confirm Staleness
- **Storage Alignment:** Pinned the storage key to `REVIEWER_POLICY` in both `src/services/config.service.ts` and `src/services/authorization.service.ts`.
- **Fail-Closed Default:** Defaults to `configured_list` with `[]` (denies all actions until explicitly configured).
- **Admin Configuration:** Updated `AdminSettingsView.tsx` to read and save `siteRegistryPageId`, `defaultFollowupProjectKey`, `reviewerPolicyMode`, and `allowedReviewerAccountIds`.
- **Fingerprint Grounding:** Fingerprints are stored as `sha256(plain summary + plain description)` via `computeJiraIssueFingerprint()`.
- **Empty Scope Guard:** If baseline evidence has an empty declared scope, `handleConfirmRelationship` returns typed `{ status: "unknown", coverage_result: CoverageResult.UNKNOWN, reason: "..." }` without mutating database or generating fake review IDs.

### Phase 4: Discovery Must Read the Graph and the Page
- **Teamwork Graph Queries:** Formatted queries to request Relay edges only (`edges { node { ... on ConfluencePage { id title } } } pageInfo { hasNextPage endCursor }`) scoped to `context.cloudId`.
- **Deleted Shims:** Removed `nodes` selectors and `requestGraph` string interpolation fallback.
- **Page Fetching:** Ingests live Confluence page bodies via `getPageWithVersion` for the registry page and linked pages.
- **Location & Zone Resolution:** Location matches only against zones present in the Confluence site registry page or human-registered zones. Unmapped/ambiguous zones return `UNKNOWN`.
- **Panel Context Authority:** In `discovery.resolver.ts`, panel context issue ID and key take strict precedence over payload parameters.

### Phase 5: Authorization and Follow-up
- **Source Access Enforcement:** In `handleGetChangeIntent`, checked `canAccessSource` and redacted quotes if user lacks Jira/Confluence permissions.
- **Dismissal Policy:** `handleDismissRelationship` enforces reviewer authorization policy and rejects empty or whitespace-only reasons.
- **Pre-Mutation Idempotency:** In `handleApproveFollowup`, the idempotency key is persisted to the `review_decisions` table with status `PENDING` before calling `jiraService.createIssue()`. Ambiguous failures transition to `UNCERTAIN`.
- **Schema Alignment:** Changed `followup_creation_status` default to `not_started` in `src/db/schema.ts`. Aligned review stale status to enum value `stale`.
- **Bug Fixes:** Removed dead `getZoneByName(siteName)` in `admin.resolver.ts` and dead `getZoneById(site.id)` in `comparison.resolver.ts`.

### Phase 6: Events and Queue Without Pretending
- **Unattended Execution:** `src/handlers/jira-events.ts` and `src/handlers/confluence-events.ts` perform local database reconciliation only (`stale` flags and audit logs) without making illegal `api.asUser()` calls.
- **Queue Consumer:** `src/handlers/queue-consumer.ts` logs `UNKNOWN` and returns structured failure if graph pages are not preloaded.
- **Router Cleansing:** Deleted the simulated `processQueueEvent` stub from `src/resolvers/index.ts`.

### Phase 7: Manifest, Scopes & Documentation
- **Manifest:** Verified `jira:issuePanel`, SQL engine (`mysql`), LLM (`claude`), functions, triggers, and consumer.
- **Marketplace Scopes:** Documented and verified granular scopes (`read:graph:page:confluence`, `read:graph:user:atlassian`). Removed obsolete references to `read:teamwork-graph`.
- **Documentation:** Updated `docs/STATUS.md`, `docs/SCOPES.md`, `docs/BLOCKERS.md`, `docs/CUTS.md`, and `docs/INSTALL.md`.

---

## 3. Automated Test Verification Results

### Backend Unit & Integration Test Suite (`npm test`)
```text
Test Suites: 24 passed, 24 total
Tests:       134 passed, 134 total
Snapshots:   0 total
Time:        15.387 s
```

### TypeScript Backend Typecheck (`npm run typecheck`)
```text
> andon-shadow-radar@1.0.0 typecheck
> tsc --noEmit
Exit code: 0 (Zero errors)
```

### Frontend Production Build (`npm --prefix static/frontend run build`)
```text
> andon-frontend@1.0.0 build
> tsc && vite build
✓ 179 modules transformed.
build/index.html                   0.53 kB
build/assets/index-BAn4Z9wH.css   22.74 kB
build/assets/index-FEH6G271.js   251.81 kB
✓ built in 1.07s
```

### Zero-Fakes Scanner (`node scripts/no-fakes.js`)
```text
[NO-FAKES] Scanning source directories: src, static/frontend/src, scripts
[NO-FAKES] Scanning build output directory: static/frontend/build
[NO-FAKES PASSED] Clean: 0 fake, simulation, or hardcoded benchmark patterns found.
```
