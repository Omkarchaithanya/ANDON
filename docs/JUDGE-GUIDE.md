# ANDON: Codegeist 2026 Judge Walkthrough Guide

> **Category:** Apps for Specialized Industries  
> **Target Bonus:** Teamwork Graph Integration ($1,500)  
> **Pitch:** *"You did not change the robot. You changed the world its approval assumed."*

---

## 3-Minute Demonstration Scenario

Follow these steps to observe the full end-to-end lifecycle in under three minutes:

### Step 1: Open the Facilities Request (Change Lens)
- Navigate to the sample facilities issue (e.g. `MAINT-1234`):
  > *"Apply high-gloss clear finish to Aisle 7 next Saturday"*
- Notice that this ordinary facilities maintenance request does not mention robots, revalidation, or engineering change procedures.
- Open the **ANDON Shadow Radar** issue panel.
- Click **"Run Discovery"**.
- Teamwork Graph traverses the site registry to locate the linked Confluence commissioning page for `AMR-12` and its owner (`Jane Smith`).
- ANDON surfaces a candidate relationship:
  - **Status:** `CANDIDATE`
  - **Proposed Change:** `surface_finish: high_gloss_clear_finish` vs documented `matte_epoxy`
  - **Confidence:** `0.94`

### Step 2: Side-by-Side Redline (Evidence Redline)
- Click **"Inspect Redline"** on the candidate card.
- View the side-by-side evidence:
  - **Left:** The quoted Jira facilities request (Version 2).
  - **Right:** The versioned clause from Confluence Commissioning Record v3 (*"Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish."*).
  - **Center:** Teamwork Graph provenance path connecting Site Registry → Zone → Commissioning Page → Owner.
- Review and check the three confirmation criteria:
  - ☑ Location matches: Aisle 7
  - ☑ Deployment: AMR-12
  - ☑ Changed attribute: `surface_finish`
- Click **"Confirm & Evaluate Coverage"**.

### Step 3: Accountable Follow-Up (Review Package)
- The deterministic comparison engine executes (no LLM guesswork).
- Finding: **PROSPECTIVE COVERAGE GAP**
  > *"The selected baseline does not establish coverage of the planned high-gloss condition."*
- View the responsible owner (`Jane Smith`) and applicable revalidation procedure (*"Surface-condition review and route/perception verification"* from the AMR-12 Test Plan).
- Review destination visibility notice.
- Click **"Create Accountable Follow-Up Task"**.
- Jira issue `ROBOT-456` is created with source-grounded references and assigned for review before work begins.

---

## Testing Key Edge Cases

1. **Explicit Unknown State:**
   - Modify ticket description to omit the finish: *"Perform routine maintenance in Aisle 7."*
   - ANDON reports `UNKNOWN` instead of manufacturing an artificial failure or giving an unwarranted clean bill of health.

2. **False Candidate Dismissal:**
   - Click **"Not Related"** on any candidate card.
   - Enter a technical reason (e.g., *"Work is confined to elevated ceiling conduit"*).
   - Candidate is dismissed, decision is permanently recorded in the audit log, and no unwanted robotics tickets are created.

3. **Staleness Protection:**
   - When a Confluence commissioning page is updated, dependent assessments are automatically flagged as `STALE`, requiring renewed human review before mutation.

