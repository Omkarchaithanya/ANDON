# KEEL — Explicit Assumptions & Unverified Boundaries

> **Rule:** Every API or platform assumption not proven against official docs or live calls is listed here as `// UNVERIFIED:`.

---

## Current Assumptions

1. **Jira Project Key:** Assumed `PAY` is available for automated seeding of `PAY-219`.
2. **Teamwork Graph Query Shape:** Curated query `confluencePageLinkedConfluencePages` is verified to support standard pagination (`first: 25`, `after: $cursor`).
3. **Decision Owner Account Status:** Assumed `read:account` or Jira/Confluence user REST API returns `accountType` / `active: false` to deterministically trigger `OWNER_GONE`.
4. **JSM Fallback:** If Jira Service Management is not provisioned on the user's free developer site, `INC-88` postmortem is stored as an issue of type `Incident` in project `PAY` with resolution `Done` and summary/description containing the postmortem finding.
5. **Teamwork Graph Connector Write Fallback:** If organization-wide graph connector write mutation requires manual Atlassian approval or enterprise preview access not available on the dev tenant, Keel writes the Confluence Clearance Record page linked to the issue, which Atlassian's indexer consumes into the Teamwork Graph natively.

