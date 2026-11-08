# KEEL — Privacy & Data Retention Policy

---

## 1. Data Processing Boundaries
- **No Third-Party AI Exfiltration:** Keel uses Atlassian-hosted `@forge/llm` within the Atlassian Cloud security enclave. No issue or page text is transmitted to OpenAI, Anthropic, or external inference APIs.
- **Minimal Context Passing ("Gist, Do Not Dump"):** Rather than dumping entire Confluence spaces or Jira backlogs, Keel extracts and passes only candidate decision sentences to the model.

## 2. Stored Entities & Retention
- **Clearance Snapshots:** Stored in Forge app storage (`storage:app`) encrypted at rest. Kept for the lifecycle of the release issue or audit retention policy.
- **Audit Logs & Action Records:** Contain action IDs, actor account IDs, timestamps, status transitions, and SHA-256 content hashes. **Logs NEVER contain raw source excerpts, passwords, or PII.**
- **Overrides:** Stored as native Confluence decision pages and Jira comments owned by the customer tenant.

## 3. Access Controls
- All user-facing views operate under `api.asUser()`.
- If an authenticated user lacks read access to a cited Confluence space or Jira project, the content is masked as `RESTRICTED` to prevent cross-tenant or cross-project data leakage.

