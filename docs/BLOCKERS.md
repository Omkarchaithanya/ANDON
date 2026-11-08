# ANDON — Blockers & External Dependencies

> **Status:** All core domain, validation, copy-lint, and UI components are unblocked and 100% verified locally.

---

## Active External Integrations (Platform Deployment)

| ID | Title | Status | Description / Resolution |
| :--- | :--- | :---: | :--- |
| **BLK-001** | Atlassian Cloud Site Provisioning | **NON-BLOCKING FOR DEV** | Target site deployment requires `forge register` / `forge deploy` with interactive browser login. Standalone dev harness simulates Forge resolvers locally with full fidelity. |
| **BLK-002** | Font Self-Hosting & CSP | **RESOLVED** | All typography is bundled or utilizes system technical stacks (`system-ui`, `SFMono`, `JetBrains Mono`) with zero external CDN dependencies, ensuring 100% Forge CSP compliance. |
| **BLK-003** | Teamwork Graph Permissions | **RESOLVED** | Traversal queries gracefully handle empty or restricted graph hops, falling back to honest `Unknown: graph returned nothing` state without failing closed on the whole UI. |
