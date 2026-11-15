# ANDON — Privacy, Security & Data Handling Policy

> **Product:** ANDON — Shadow-Change Radar for Robotized Workplaces  
> **Standard:** Atlassian Cloud Security Requirements & Marketplace App Guidelines

---

## 1. Zero External Egress & AI Boundaries
- **No Third-Party AI Exfiltration:** ANDON uses Atlassian-hosted `@forge/llm` executing entirely within the Atlassian Cloud security enclave. No issue or page text is transmitted to OpenAI, Anthropic, or external inference APIs.
- **Content as Evidence, Not Instructions:** Source text from Jira issues and Confluence pages is strictly treated as untrusted data input, parsed within frozen delimiters (`<SOURCE_TEXT>`).
- **Minimal Context Extraction:** Rather than dumping entire Confluence spaces or Jira backlogs, ANDON extracts only candidate physical attribute clauses and exact NFKC substrings.

## 2. Stored Entities & Data Retention
- **Relational Storage:** Persisted in Forge SQL (`@forge/sql`) using isolated tenant databases. Data is never shared across Atlassian Cloud tenants.
- **Audit Logs & Action Records:** Contain action IDs, actor account IDs, timestamps, status transitions, and SHA-256 content hashes. **Logs NEVER contain raw customer credentials, passwords, or PII.**
- **Bitemporal Tracking:** Stores valid/business effective timestamps and system recorded timestamps for verifiable audit trails.

## 3. Access Controls & Permission Isolation
- **User-Context Execution:** All user-facing views, Confluence evidence retrievals, and Teamwork Graph traversals operate under `api.asUser()`.
- **Restricted Access Masking:** If an authenticated user lacks read access to a cited Confluence space or page, the content is masked as `[Restricted document: You do not have permission to view this Confluence page]`.
- **Cross-Project Protection:** `ReviewPackage` defaults excerpt inclusion to `OFF` (pointer-only) to prevent unintended cross-project data disclosure.
