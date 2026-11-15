# ADR-005: `asUser()` Permission Isolation & Cross-Project Excerpt Redaction

## Status
Accepted

## Context
Facilities tickets in Jira and robot commissioning records in Confluence often reside in spaces and projects with different access policies. A facilities contractor viewing a ticket must not be granted unintended read access to restricted engineering spaces.

## Decision
1. **User Context Enforcement:** All Jira, Confluence, and Teamwork Graph reads execute under `api.asUser()`.
2. **Restricted Content Masking:** If the user lacks access to a referenced Confluence page, `canAccessSource` returns false, and the quote is masked with a clear permission notice.
3. **Cross-Project Protection:** `ReviewPackage` defaults excerpt inclusion to `OFF` (pointer-only), preventing sensitive engineering quotes from being copied into wider Jira facilities projects without explicit opt-in.
