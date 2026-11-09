# ANDON — Explicit Assumptions & Unverified Boundaries

> **Rule:** Every API or platform assumption not proven against official docs or live calls is listed here as `// UNVERIFIED:`.

---

## Current Assumptions

1. **Jira Project Key:** Assumed target maintenance project is available for automated discovery and follow-up ticket creation.
2. **Teamwork Graph Query Shape:** Curated query `confluencePageLinkedConfluencePages` is verified to support standard pagination (`first: 25`, `after: $cursor`).
3. **Decision Owner Account Status:** Assumed `read:account` or Jira/Confluence user REST API returns active status to deterministically detect if a document owner is inactive.
4. **Teamwork Graph Connector Write Fallback:** If organization-wide graph connector write mutation requires manual Atlassian approval or enterprise preview access not available on the dev tenant, ANDON writes the Confluence Clearance Record page linked to the issue, which Atlassian's indexer consumes into the Teamwork Graph natively.

