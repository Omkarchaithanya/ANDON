# KEEL — Architecture Decisions & Interview Notes

> Use these notes to explain each major technical decision aloud during presentations or judge interviews.

---

### 1. Fail-Closed vs. Optimistic Evaluation
- **Question:** *"Why does an empty graph result or API timeout cause a HOLD instead of allowing the release?"*
- **Answer:** In enterprise systems and regulatory audits (e.g. SOC2, PCI-DSS, ISO 27001), missing evidence is never equivalent to safety. If our graph traversal fails or returns empty, the only responsible action is to hold the release and ask for verification. "Graph returned nothing; not the same as clear."

### 2. Decision-Sentence Chunking vs. Document RAG
- **Question:** *"Why not just pass the whole Confluence page to an LLM?"*
- **Answer:** Real Confluence architecture wikis contain multiple decisions written at different times. A single page frequently holds an active policy (*"Never log PANs"*) right next to an older deprecated note (*"Debug with full payloads during initial integration"*). Document-level RAG confuses the model. By parsing at the sentence level with heading anchors and timestamps, Keel evaluates individual decisions independently and performs a corrective pass to detect which one is actually in force.

### 3. Pure Deterministic Core vs. Autonomous LLM
- **Question:** *"Why doesn't the AI decide whether to clear the ticket?"*
- **Answer:** LLMs hallucinate and drift. Status computation, finding type categorization, and expiration checks are 100% deterministic, pure TypeScript functions backed by formal unit tests. The LLM is used only at the edges: (a) extracting candidate decision sentences, and (b) answering a strict boolean: *"Does this decision sentence govern this change?"*. The status state machine is pure math.

### 4. Overrides as Architectural Decision Records (ADRs)
- **Question:** *"Why require a sentence to override a hold?"*
- **Answer:** A simple "Dismiss" or "Bypass" button turns governance into dark patterns where engineers click through warnings without reading. In Keel, overriding a hold is an explicit, accountable engineering act: you must supply a rationale and an expiry date. That sentence becomes a new ADR (`DEC-###`) stored in Confluence and the Teamwork Graph, ensuring that exceptions are transparent, time-bounded, and auditable.

### 5. Foreign Agent Control via Model Context Protocol (MCP)
- **Question:** *"How does Keel stop coding agents in Cursor or Copilot?"*
- **Answer:** External coding agents operate in IDEs outside Jira. Through Forge's `rovo:mcp` server, Keel exposes `assert_no_hold(issueKey)`. When an agent attempts to ship or open a PR, it calls `assert_no_hold`. If Keel detects a conflict, it returns a hard `HOLD` with the exact cited reasons. Keel becomes the organizational control plane for all agents.

