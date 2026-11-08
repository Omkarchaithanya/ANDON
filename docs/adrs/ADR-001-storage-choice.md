# ADR-001: Storage Strategy for Clearance Records & Active Overrides

## Context
Keel requires persistent storage for:
1. Clearance snapshots and evaluation input hashes (`hash(evidence-set)`).
2. Human-approved Overrides (ADRs) with actor identity, overruled finding IDs, relation, and expiry timestamp.
3. Action lifecycle records (`pending`, `confirmed`, `outcome_uncertain`) for idempotent multi-surface writes.
4. Audit logs for state transitions.

Atlassian Forge provides two primary storage mechanisms:
- **Forge KVS (`@forge/api` storage):** Key-value and query API. Scoped per installation. Documented 32KB value size limit per key. Fast, zero-migration schema, high availability across tenants.
- **Forge SQL (`@forge/sql`):** Relational MySQL database scoped per app installation. Requires DDL migrations, has query row limits, and does not support multi-statement transactions.

## Options Considered
1. **Forge SQL only:** Strong relational schema, but complex startup DDL migration timing and installation-readiness overhead.
2. **Forge KVS only:** Key-value store with query API. Encapsulates snapshots, overrides, and action records as serialized JSON documents. Simple recovery, no migration failures on fresh installations.
3. **Hybrid (KVS for snapshots & active overrides, SQL for relational audit log if needed):** Redundant operational complexity for an MVP.

## Decision
**We choose Forge KVS (`storage`) as the primary storage mechanism for Keel**, backed by structured Zod schemas in `/domain`:
- Key namespace: `clearance:snapshot:<issueKey>` -> `ClearanceRecord`
- Key namespace: `clearance:override:<issueKey>` -> `Override`
- Key namespace: `clearance:action:<actionId>` -> `ActionRecord` (`pending` | `confirmed` | `outcome_uncertain`)
- Key namespace: `clearance:hash:<inputHash>` -> Cached status

## Consequences
- **Positive:** Zero migration delay during fresh tenant install; 100% resilient across dev, staging, and production-like environments.
- **Positive:** Bitemporal records are stored as complete, immutable JSON snapshots with verifiable input hashes.
- **Constraint:** Snapshots must remain under 32KB. The cap of at most five findings on the card guarantees that serialized payloads remain well under 5KB.

