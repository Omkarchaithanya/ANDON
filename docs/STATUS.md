# ANDON — Project Status & Integrity Log

> **Product:** ANDON (Shadow-Change Radar for Robotized Workplaces)  
> **Source of Truth:** `/docs/SPEC.md` (`ANDON__Shadow-change_radar_for_robotized_workplaces.md`)  
> **Architecture & Verifications:** Zero-fake production Forge issue panel. No synthetic demo fallbacks.

---

## 1. System Architecture & Integrity Enforcements

| Subsystem | Architecture & Invariant | Status |
| :--- | :--- | :---: |
| **Forge Issue Panel Entry** | Mounts directly to `ChangeLens` bound to live Jira issue context (`context.extension.issue`). No demo harnesses, floorplan mock shells, or fake issue payloads. | **ENFORCED** |
| **Jira ADF Parser** | Converts Atlassian Document Format (ADF) trees into clean, unformatted plain text via `adfToPlainText()`. Falls back to summary if description is absent. | **ENFORCED** |
| **Reviewer Policy & Staleness** | Storage key pinned to `REVIEWER_POLICY` across config and authorization services. Default policy is `configured_list` with `[]` (fail-closed). Staleness fingerprint computed as `sha256(plain summary + plain description)`. | **ENFORCED** |
| **Teamwork Graph Queries** | Traverses graph using `edges { node { ... on ConfluencePage { id title } } } pageInfo` scoped to `context.cloudId`. Inlined query string fallbacks and `nodes` selector removed. | **ENFORCED** |
| **Quote Verification** | Verbatim NFKC substring verification against real Jira issue text and fetched Confluence page bodies (`getPageWithVersion`). Unverified quotes drop the claim to `UNKNOWN`. | **ENFORCED** |
| **Follow-up Idempotency** | Follow-up idempotency key is persisted to `review_decisions` with status `PENDING` before external Jira issue creation. Ambiguous failures transition to `UNCERTAIN`. | **ENFORCED** |
| **Unattended Event Triggers** | `jira-events.ts` and `confluence-events.ts` perform local database reconciliation only, without attempting `api.asUser()` calls in background trigger contexts. | **ENFORCED** |
| **Zero-Fakes CI Gate** | Automated scanner (`scripts/no-fakes.js`) scans `src/`, `static/frontend/src/`, `scripts/`, and build artifacts to prevent hardcoded benchmark fixtures or simulated bridges. | **ENFORCED** |

---

## 2. Reusable Signature Components

1. **`AndonLightStack.tsx`**: 3-lamp vertical tower (Discovery / Applicability / Freshness) with distinct shapes and status signals.
2. **`FloorPlanLocator.tsx`**: Industrial architectural schematic dynamically rendering the identified zone and deployment tag.
3. **`RedlineSheet.tsx`**: Dual drafting sheets with vector leader line spanning the gutter, and strike-through redline convention.
4. **`EvidenceThread.tsx`**: Teamwork Graph traversal circuit with permission verification chips; cut-thread state for empty traversals.
5. **`CoverageRuler.tsx`**: Set-membership strip with declared baseline slots and proposed marker sitting outside in the hatched gap zone.
6. **`TwoClockTimeline.tsx`**: Bitemporal dual-track timeline: Business Time (Effective) vs System Time (Learned) with source revision ticks.
7. **`TheStamp.tsx`**: Human confirmation ceremony featuring 3 separate engineering verification seals with reviewer identity.
8. **`HandoffTag.tsx`**: Physical industrial work tag for Jira task dispatch with privacy opt-in disclosure toggles.
9. **`HatchedUnknown.tsx`**: Industrial diagonal hatch pattern communicating honest uncertainty with specific recovery steps.
10. **`StaleRibbon.tsx`**: High-visibility warning banner on modified sources, one-click revision diff viewer, and confirmation lock.
