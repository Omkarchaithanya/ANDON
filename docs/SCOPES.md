# Atlassian Marketplace Permissions Justification (SCOPES.md)

This document contains the official scope justifications required for Atlassian Marketplace submission per the Forge app approval guidelines (`https://developer.atlassian.com/platform/marketplace/app-approval-guidelines/`).

---

## Declared Manifest Scopes & Individual Justifications

| Scope | Category | One-Line Justification |
|---|---|---|
| `read:jira-work` | Jira REST API | Required to read the active facilities maintenance issue summary, description, target zone, and scheduled window to discover unconsulted robotics operating dependencies. |
| `write:jira-work` | Jira REST API | Required to create the confirmed follow-up engineering task with version-bound provenance pointers when an authorized reviewer approves the review package. |
| `read:confluence-content.all` | Confluence REST API | Required to inspect the authoritative robotics commissioning baseline record (Page 10483) and compare declared operating design domain (ODD) conditions against planned maintenance changes. |
| `read:confluence-space.summary` | Confluence REST API | Required to resolve and validate space boundaries for the linked facility site registry and verify that baseline records belong to authorized facility engineering spaces. |
| `read:confluence-user` | Confluence REST API | Required to verify the account status and identity of the robotics commissioning lead author to detect ownership drift (`OWNER_GONE`) or deactivated accounts. |
| `read:teamwork-graph` | Teamwork Graph API | Required to traverse recorded relationship paths between the facilities issue, the facility site registry, the specific target zone (Aisle 7), and the active robot deployment (AMR-12). |

---

## Form Submission Text (Consolidated Marketplace Form Response)

> ANDON: Shadow-Change Radar for Robotized Workplaces connects facilities maintenance requests in Jira to robot commissioning baselines in Confluence via the Atlassian Teamwork Graph. The requested scopes are strictly minimal to fulfill this clearance workflow:
>
> 1. `read:jira-work` & `write:jira-work`: ANDON reads facilities tickets (e.g. floor resurfacing) to extract planned physical modifications, and writes approved follow-up engineering issues to the qualified robotics squad only after explicit human reviewer confirmation.
> 2. `read:confluence-content.all` & `read:confluence-space.summary`: ANDON reads versioned commissioning baseline pages to extract documented operating assumptions (e.g. approved floor surface finish) and verifies space permissions.
> 3. `read:confluence-user`: ANDON checks the commissioning document owner's account status to ensure valid operational stewardship and flag organizational turnover.
> 4. `read:teamwork-graph`: ANDON traverses recorded context nodes linking facilities zones to commissioned robot deployments to provide an inspectable provenance thread.
>
> No external network egress is declared or used. All data processing occurs on Forge-hosted compute and is isolated per tenant.
