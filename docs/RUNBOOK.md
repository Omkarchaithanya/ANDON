# ANDON — Operations & Support Runbook

> **Product:** ANDON — Shadow-Change Radar for Robotized Workplaces

---

## 1. Alert: Prospective Coverage Gap Detected
- **Symptom:** Radar identifies: *"The selected baseline does not establish coverage of the planned condition"*.
- **Diagnosis:**
  1. Open the facilities Jira work ticket.
  2. Inspect the **ANDON Shadow Radar** panel (`jira:issuePanel`).
  3. Navigate to **Evidence Redline** to inspect the quoted facilities maintenance request side-by-side with the Confluence commissioning baseline.
- **Resolution:**
  - Option A: If the maintenance work alters physical conditions beyond baseline assumptions, a qualified reviewer applies the three verification seals and clicks **"Approve & Dispatch Engineering Follow-up"** to create a linked Jira task in the designated robotics project (e.g. `ROBOT`).
  - Option B: If the proposal is not relevant, the reviewer clicks **"Dismiss Candidate"** and supplies an accountable non-empty reason.

## 2. Alert: Panel Displays Status UNKNOWN
- **Symptom:** Radar displays: *"Graph returned nothing. That is not the same as no relationship."* or *"No site registry page is configured"*.
- **Diagnosis:**
  1. Open **Administration** settings in the left navigation.
  2. Verify that **Confluence Site Registry Page ID** is populated with a valid numeric ID.
  3. Verify that the Confluence Site Registry page contains native links to Zone / Commissioning baseline pages.
  4. On newly created pages, Teamwork Graph indexing may lag by 5–15 minutes.
- **Resolution:**
  - Save configuration in Administration.
  - Re-run discovery by clicking **"Scan Context via Teamwork Graph"**.

## 3. Alert: Stale Assessment Ribbon Displayed
- **Symptom:** High-visibility diagonal ribbon appears: *"Stale assessment: Underlying Confluence page or Jira ticket changed materially after review"*.
- **Diagnosis:** The underlying Confluence page version incremented or the Jira description fingerprint changed after discovery.
- **Resolution:**
  - Click **"View Revision Diff"** to inspect what changed.
  - Re-apply the reviewer confirmation seals against the updated revision.
