# Codegeist 2026 Submission Readiness Checklist (SUBMISSION_CHECKLIST.md)

This checklist tracks compliance with official Codegeist 2026 hackathon guidelines and Atlassian Marketplace app approval requirements.

---

## 1. Judging Criteria Mapping (20% Each)

| Criteria | Weight | How ANDON Satisfies It | Evidence & Documentation |
|---|---|---|---|
| **Technological Implementation** | 20% | Built on modern Forge (Custom UI, `@forge/resolver`, Forge SQL, async events consumer, Teamwork Graph GraphQL API). 0 hardcoded values, fail-closed state machines. | Full test suite (12 suites, 73 tests), zero-egress architecture, `ADR-001` through `ADR-008`. |
| **Design & User Experience** | 20% | High-fidelity cyber-physical mission control with ANSI/ISO drafting sheet standards. Interactive warehouse floor plan with animated sonar ping, side-by-side redline diff, 3-seal human confirmation ceremony, and physical work handoff tag. | [`DESIGN.md`](file:///c:/Users/omkar/code%20est/docs/DESIGN.md), [`globals.css`](file:///c:/Users/omkar/code%20est/static/frontend/src/styles/globals.css), live dev preview at `http://localhost:5173`. |
| **Potential Impact** | 20% | Solves critical shadow-change gap in robotized workplaces where facilities maintenance modifies assumptions (e.g. floor friction, reflectance) that robots rely upon, avoiding costly factory downtime and re-commissioning delays. | Real-world problem statement in [`SPEC.md`](file:///c:/Users/omkar/code%20est/docs/SPEC.md), zero fabricated physical claims. |
| **Quality of Idea** | 20% | Novel paradigm: *"You did not change the robot. You changed the world its approval assumed."* Bridges facilities management (Jira) to engineering robotics commission baselines (Confluence). | Thesis statement, fail-closed deterministic clearance engine. |
| **Presentation & Submission** | 20% | Clear walkthrough video, comprehensive documentation, literal searchable tagline, dedicated support channel, and complete setup instructions. | [`SUPPORT.md`](file:///c:/Users/omkar/code%20est/docs/SUPPORT.md), [`INSTALL.md`](file:///c:/Users/omkar/code%20est/docs/INSTALL.md), [`COSTS.md`](file:///c:/Users/omkar/code%20est/docs/COSTS.md). |

---

## 2. Bonus Category Target: Best Teamwork Graph Integration
- **Integration:** Uses Teamwork Graph to traverse recorded context paths: Facilities Ticket ➔ Site Registry (Page 10482) ➔ Zone (Aisle 7) ➔ Deployment (AMR-12) ➔ Commissioning Record (Page 10483 rev 3).
- **Semantics:** Follows strict recorded-context semantics; graph traversal empty/failure returns safe `UNKNOWN`.

---

## 3. Submission Artifacts Checklist

- [x] **Searchable Tagline:** *"Shadow-change radar for robotized workplaces: detects unconsulted facilities changes that intersect robot commissioning baselines."*
- [x] **Minimum Scopes with Justifications:** Documented in [`SCOPES.md`](file:///c:/Users/omkar/code%20est/docs/SCOPES.md).
- [x] **Support Channel:** Public generic address (`support-andon@robotics-clearance.org`) and SLA documented in [`SUPPORT.md`](file:///c:/Users/omkar/code%20est/docs/SUPPORT.md).
- [x] **Zero Hardcoded Secrets / Credentials:** Verified by automated CI scanner [`scripts/secret-scan.js`](file:///c:/Users/omkar/code%20est/scripts/secret-scan.js).
- [x] **Zero Fabricated Physical Claims:** Verified by automated AST copy-linter [`test/unit/copy-lint.test.ts`](file:///c:/Users/omkar/code%20est/test/unit/copy-lint.test.ts).
- [x] **Verbatim Quote Verification:** Verified by automated quote checker [`test/unit/quote-verification.test.ts`](file:///c:/Users/omkar/code%20est/test/unit/quote-verification.test.ts).
- [x] **Walkthrough Script & Seed Scenario:** Documented in [`SPEC.md`](file:///c:/Users/omkar/code%20est/docs/SPEC.md).
- [ ] **Demonstration Video:** 3-minute video recording showing full happy path on live Forge dev site (Pending live video recording).
- [ ] **Dev Site Credentials:** Dedicated test credentials for submission judges (Pending tenant provisioning).
