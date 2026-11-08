# ADR-003: Workflow Validator Fail-Closed Policy vs. Availability

## Context
Keel enforces release gating via `jira:workflowValidator` on transitions to `Done` or `Ready for release`.
When a transition occurs, the validator must evaluate whether the release is clear to ship.

During this evaluation, upstream dependencies may encounter:
- Network timeouts to Confluence or Teamwork Graph.
- Rate-limiting or transient 502/503 errors.
- Unhandled schema anomalies or empty graph results.

## Decision
**Keel adheres to an absolute Fail-Closed policy:**
If any evaluation fails, times out, receives an empty graph result, or cannot verify evidence:
1. The validator rejects the workflow transition.
2. The clearance status is computed as `UNKNOWN`, which renders as `HOLD`.
3. The rejection error message explicitly states:
   *"Transition blocked by Keel: clearance status is HOLD (reason: Graph returned nothing or verification incomplete; not the same as clear)."*

## Tradeoffs
- **Availability Tradeoff:** If Atlassian Teamwork Graph or Confluence is experiencing an outage, releases cannot proceed automatically.
- **Safety Justification:** In safety-critical, compliance-regulated, or enterprise software release control, shipping unverified code can cause catastrophic incidents (e.g., logging PANs or violating SOC2). A temporary delay during an outage is infinitely preferable to an unverified, illegal release.
- **Escape Hatch:** If an emergency production fix must ship during an external service disruption, an authorized human engineer can submit an explicit 1-sentence **Override** directly in the Jira issue panel, which transitions the status to `OVERRIDE` and unblocks the validator.

