# ANDON — Blockers & External Dependencies

> **Status:** All core domain, validation, copy-lint, and UI components are unblocked and 100% verified locally.

---

## Active External Integrations (Platform Deployment)

| ID | Title | Status | Description / Resolution |
| :--- | :--- | :---: | :--- |
| **BLK-001** | Atlassian Cloud Site Provisioning | **NON-BLOCKING FOR DEV** | Target site deployment requires `forge register` / `forge deploy` with interactive browser login. Standalone dev harness simulates Forge resolvers locally with full fidelity. |
| **BLK-002** | Font Self-Hosting & CSP | **RESOLVED** | All typography is bundled or utilizes system technical stacks (`system-ui`, `SFMono`, `JetBrains Mono`) with zero external CDN dependencies, ensuring 100% Forge CSP compliance. |
| **BLK-003** | Live Forge Invocation & Teamwork Graph Verification | **PENDING LIVE DEPLOYMENT** | Requires interactive Atlassian Cloud site credentials (`forge login`, `forge deploy`, `forge install`) to record live Forge LLM and Teamwork Graph invocation transcripts. Standalone smoke test prepared at `test/smoke/llm-smoke.ts`. |
