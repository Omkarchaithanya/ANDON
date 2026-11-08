# ANDON — Project Status & Integrity Log

> **Product:** ANDON (Shadow-Change Radar for Robotized Workplaces)  
> **Source of Truth:** `/docs/SPEC.md` (`ANDON__Shadow-change_radar_for_robotized_workplaces.md`)  
> **Design Specification:** [`/docs/DESIGN.md`](file:///c:/Users/omkar/code%20est/docs/DESIGN.md)  
> **Test Suite:** 12 Test Suites, 73 Tests Passing (100% Green)

---

## 1. Part A: Integrity Defects Audit & Resolution

| Defect # | Integrity Item | Resolution & Code Changes | Verification Test |
| :--- | :--- | :--- | :--- |
| **A-1** | Simulated bridge banner & static green status dots | Isolated simulator strictly behind `window.__isStandaloneDev` dev harness banner: `[DEV HARNESS ONLY — SIMULATING RESOLVERS FOR LOCAL UI DEVELOPMENT]`. Status lamps dynamically reflect actual live call results. Removed promo text. | Verified in `App.tsx` & `index.html` |
| **A-2** | Fabricated risk claims ("risks localized emergency stops") | Completely eradicated all causal/hazard/friction/braking claims. Replaced with verbatim SPEC finding: *"The selected baseline does not establish coverage of the planned high-gloss condition."* | `test/unit/copy-lint.test.ts` (PASS) |
| **A-3** | Invented procedures ("SOP-ROBOT-04", "SOP-ROBOT-11") | Purged invented SOP procedures. Implemented **Expert-Definition Request** state when baseline has no cataloged test procedure. | `test/unit/copy-lint.test.ts` (PASS) |
| **A-4** | Invented evidence quotes | Enforced exact verbatim SPEC quotes in all components: Facilities quote = `"Apply high-gloss clear finish to Aisle 7 next Saturday"`, Commissioning quote = `"Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish."` | `test/unit/quote-verification.test.ts` (PASS) |
| **A-5** | Fake confidence "94%" | Removed probabilistic model confidence percentages and progress bars entirely. Replaced with verifiable facts: *"2 of 2 quoted spans verified against Jira FAC-1042 and Confluence rev 3"*. | `test/unit/copy-lint.test.ts` (PASS) |
| **A-6** | Label as quote ("Intake Ticket & Baseline Record") | Replaced static label with the exact verbatim spans from the intake ticket and baseline page. | `test/unit/quote-verification.test.ts` (PASS) |
| **A-7** | Stuck "Target Zone: Inspecting..." & hardcoded look | Rendered live fields or honest `Unknown` state with reasons (e.g. `Unknown: zone not set on ticket`, `Unknown: owner not returned by graph`). | Verified across `ChangeLens.tsx` |
| **A-8** | Teamwork Graph Traceability Path | Rendered genuine traversal: `Site Registry (Page 10482)` ➔ `Zone (Aisle 7)` ➔ `Deployment (AMR-12)` ➔ `Commissioning Baseline (Page 10483 v3)` ➔ `Owner (qm:lead-robotics-eng)`. Labeled `recorded context only (not causal support)`. Cut wire for empty/failed traversal. | `test/integration/discovery-flow.test.ts` (PASS) |
| **A-9** | Mandatory SPEC UI elements | Added 3 separate confirmation stamps, mandatory non-empty dismissal reason, visible `last checked` timestamps, native revision anchors, destination project visibility notices, cross-project excerpt opt-in toggle (default OFF), action state (`PENDING` ➔ `CONFIRMED` ➔ `OUTCOME_UNCERTAIN`), and stale revision ribbons. | `test/unit/validation.test.ts` (PASS) |
| **A-10**| Banner promo text in product UI | Removed all promotional text from the UI. Documentation preserved in `README.md`. | `test/unit/copy-lint.test.ts` (PASS) |

---

## 2. Part B: 10 Signature Reusable Components

1. **`AndonLightStack.tsx`**: 3-lamp vertical tower (Discovery / Applicability / Freshness) with distinct shapes (Circle, Diamond, Hexagon) and signals (Amber, Red, Green, Hatched Unknown).
2. **`FloorPlanLocator.tsx`**: Industrial architectural schematic of Facility Alpha showing Aisle 7 and AMR-12 pinned.
3. **`RedlineSheet.tsx`**: Centerpiece dual drafting sheets with vector leader line spanning the gutter, and strike-through redline convention (`~~matte_epoxy~~` ➔ `high_gloss_clear_finish`).
4. **`EvidenceThread.tsx`**: Teamwork Graph traversal circuit with permission verification chips; cut-thread state for empty traversals.
5. **`CoverageRuler.tsx`**: Set-membership strip with declared baseline slots and proposed marker sitting outside in the hatched gap zone with authoritative finding sentence.
6. **`TwoClockTimeline.tsx`**: Bitemporal dual-track timeline: Business Time (Effective) vs System Time (Learned) with source revision ticks.
7. **`TheStamp.tsx`**: Human confirmation ceremony featuring 3 separate engineering verification seals with reviewer identity and timestamp, plus required-reason dismissal.
8. **`HandoffTag.tsx`**: Physical industrial luggage/equipment work tag for Jira task dispatch with privacy opt-in disclosure toggles and action state machine.
9. **`HatchedUnknown.tsx`**: Industrial diagonal hatch pattern communicating honest uncertainty with specific recovery steps.
10. **`StaleRibbon.tsx`**: High-visibility diagonal warning banner on modified sources, one-click revision diff viewer, and confirmation lock.
11. **`StatesGallery.tsx`**: Developer harness gallery showcasing all 8 formal states required by the SPEC.

---

## 3. Test Suite Summary

- Total Test Suites: 12 passed, 12 total (100%)
- Total Tests: 73 passed, 73 total (100%)
- Build: `tsc && vite build` clean (0 errors, 2.10s)
