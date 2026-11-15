# ANDON — Architecture Decisions & Interview Notes

> Use these notes to explain each major technical decision aloud during presentations or judge interviews.

---

### 1. Fail-Closed vs. Optimistic Evaluation
- **Question:** *"Why does an empty Teamwork Graph result or API timeout cause an UNKNOWN instead of assuming the change is safe?"*
- **Answer:** In industrial robotics, building maintenance often alters environmental assumptions (lighting, floor finish, reflectance) that robots rely upon. If Teamwork Graph returns empty, we cannot assume there is no dependency—the graph may simply have lagged or the user may lack permissions. "Graph returned nothing. That is not the same as no relationship."

### 2. Exact NFKC Substring Grounding vs. Document Hallucination
- **Question:** *"Why enforce exact NFKC quote verification?"*
- **Answer:** LLM summarization often paraphrases or introduces subjective risk language ("hazardous braking", "imminent collision"). ANDON treats ticket and Confluence text strictly as untrusted data. Any claim whose quote is not an exact NFKC substring of the source document is dropped immediately.

### 3. Deterministic Set-Membership Core vs. Probabilistic LLM
- **Question:** *"Why doesn't the AI decide whether there is a coverage gap?"*
- **Answer:** Safety-critical engineering decisions cannot depend on stochastic language models. The LLM is used only at the intake edge to extract candidate physical attribute mentions. Once an authorized engineer verifies the match, the coverage evaluation is executed by pure deterministic TypeScript code: *"The selected baseline does not establish coverage of the planned high-gloss condition."*

### 4. Human Qualified Reviewer Seals & Idempotent Handoff
- **Question:** *"How does ANDON dispatch engineering follow-up work?"*
- **Answer:** ANDON requires explicit 3-seal human confirmation (Location, Deployment, Attribute) before any follow-up task is dispatched. When approved, a linked Jira task is created in the target robotics project using deterministic SHA-256 idempotency keys (`change_intent_id::deployment_id`), guaranteeing zero duplicate tasks across network retries.
