# KEEL — Operations & Support Runbook

---

## 1. Alert: Transition Blocked by Workflow Validator
- **Symptom:** Jira user receives error: *"Transition blocked by Keel: clearance status is HOLD"*.
- **Diagnosis:**
  1. Open the issue in Jira.
  2. Inspect the **Keel Clearance Card** on the right issue panel.
  3. Identify which of the 5 findings is blocking (e.g. `IN_FORCE DEC-014`, `INCIDENT_ECHO INC-88`, `OWNER_GONE`).
- **Resolution:**
  - Option A: Scope the change to comply with the in-force decision (e.g., remove full payload logging, use tokenized IDs). Re-evaluate card.
  - Option B: If the change is an authorized temporary exception (e.g. sandbox only), an authorized engineer submits an **Override** (1 mandatory sentence + expiry date). Status flips to `OVERRIDE` and unblocks transition.

## 2. Alert: Card Displays Status UNKNOWN (Renders as HOLD)
- **Symptom:** Card displays: *"Graph returned nothing; not the same as clear."*
- **Diagnosis:**
  1. Teamwork Graph query or Confluence REST API returned empty or timed out.
  2. Network connection between Forge backend and Atlassian platform experienced jitter.
- **Resolution:**
  - Click **"Re-evaluate Clearance"** button on the card.
  - Check Atlassian Status (`status.atlassian.com`) for Teamwork Graph service health.

## 3. Alert: Override Expired
- **Symptom:** Release that had status `OVERRIDE` reverts to `HOLD`.
- **Diagnosis:** The override's `expiresAt` timestamp has elapsed.
- **Resolution:** Scheduled trigger or user re-evaluation detected expiration. The team must either complete re-certification or enter a renewed Override ADR.

