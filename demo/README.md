# ANDON: Synthetic Demonstration Data Boundary

> **IMPORTANT COMPLIANCE NOTICE:**
> The files in this `demo/` directory contain strictly synthetic demonstration records created specifically for Codegeist 2026 hackathon evaluation and isolated testing.
> They do **not** represent any real customer incident, and they are completely decoupled from production resolvers, runtime migrations, and real enterprise installations.

---

## 1. What This Scenario Demonstrates

The synthetic Aisle 7 demonstration implements the exact facts from the challenge specification:
- **Facilities Jira Ticket:** *"Apply high-gloss clear finish to Aisle 7 next Saturday"*
- **Confluence Site Registry:** Associates Aisle 7 with deployment `AMR-12`
- **Commissioning Baseline:** *"Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish."*
- **Test Plan:** Defines surface-condition review and route/perception verification
- **Existing Evidence:** Covers `surface_finish = matte_epoxy`; no record covers `high_gloss_clear_finish`

ANDON's finding:
> *"The selected baseline does not establish coverage of the proposed high-gloss condition."*

ANDON does **not** assert:
- *"The robot will fail"*
- *"The floor is unsafe"*
- *"The deployment is now illegal"*

---

## 2. How to Load the Demo for Evaluation

In an isolated developer test site:
```bash
# From the project root:
npx ts-node demo/import-synthetic-demo.ts
```

This populates the local test database with the synthetic site registry, deployment AMR-12, baseline condition, and commissioning scope.

---

## 3. Production Isolation

A fresh production installation:
- Contains **no** synthetic records
- Prompts the user to configure their real Confluence Site Registry Page ID via the **Settings** panel
- Operates entirely against real, live Atlassian Cloud data

