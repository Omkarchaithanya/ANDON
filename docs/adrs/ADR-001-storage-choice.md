# ADR-001: Forge SQL (`@forge/sql` MySQL/TiDB) vs. Forge KVS for Evidence Graph Persistence

## Status
Accepted

## Context
ANDON requires relational storage for facility sites, operating zones, robot deployments, baseline condition clauses, bitemporal evidence revisions, fingerprinted change intents, idempotent review decisions, and immutable action audit logs.

Atlassian Forge provides two storage mechanisms:
1. **Forge KVS (`@forge/api` storage):** Key-value store scoped per installation with a hard 32KB value size limit per key.
2. **Forge SQL (`@forge/sql`):** Tenant-isolated relational MySQL database engine with parameterized queries (`sql.prepare().bindParams().execute()`) and chained migration runner (`migrationRunner.enqueue().run()`).

## Decision
We choose **Forge SQL (`@forge/sql`)** as the primary storage mechanism for ANDON:
- Eliminates the 32KB per-key limit of Forge KVS.
- Supports indexed relational lookups by `zone_id`, `deployment_id`, `jira_issue_id`, and `idempotency_key UNIQUE`.
- Schema DDL statements are defined in-memory in `src/db/schema.ts` and applied via `migrationRunner` in `src/handlers/install.ts`, preventing runtime file-system dependency issues in the Forge sandbox.
- Referential integrity is enforced in `src/db/repository.ts` and `src/services/` (accommodating TiDB foreign key limitations).
