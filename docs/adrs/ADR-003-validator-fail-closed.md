# ADR-003: Fail-Closed Unknown Semantics on Empty Teamwork Graph or Missing Scope

## Status
Accepted

## Context
When querying Teamwork Graph or Confluence REST APIs for commissioning baselines, queries may return empty results due to indexing lag, permission restrictions, or unconfigured settings. In industrial robotics safety, the absence of an evidence link does NOT mean no physical dependency exists.

## Decision
1. **Strict Fail-Closed Semantics:** Empty graph traversals, missing site registry configurations, unresolved zones, unverified quotes, or empty declared scopes evaluate strictly to `UNKNOWN` (*"Graph returned nothing. That is not the same as no relationship."*).
2. **No Premature Mutation:** State is never marked covered or confirmed when evidence is missing. Reviewers must explicitly verify physical relationships.
