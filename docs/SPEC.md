# ANDON: Shadow-change radar for robotized workplaces

ANDON is a proposed Forge app that finds the facilities change nobody realized was a robotics change. It connects an ordinary Jira work request to a documented operating assumption in Confluence, shows exactly where existing evidence stops covering the proposed condition, and gives the responsible people a source-linked review package before work begins.

**The pitch:** “You did not change the robot. You changed the world its approval assumed.”

The recommendation is to enter **Apps for Specialized Industries**, with a genuinely working Teamwork Graph integration as the primary bonus target; manufacturing fits that category, and consuming the Teamwork Graph API qualifies for that bonus under the official rules. ([Codegeist rules](https://codegeist2026.devpost.com/rules)) This is a first-place-oriented product strategy, not a prediction of winning or a claim that every component is unprecedented.

## The problem worth solving

The target user is a robotics integrator or warehouse automation team coordinating with facilities staff. The specific problem hypothesis is that a building-maintenance request can change a condition on which robot commissioning relied, without anyone recognizing it as an engineering change. ANDON would close that intake gap, not replace risk assessment.

This is more than an imagined connection between unrelated departments: OSHA’s robot-systems guidance explicitly says assessment should include activities in the workspace even when they are not associated with the robot application, giving “changing the overhead light” as an example. ([OSHA Technical Manual](https://www.osha.gov/otm/section-4-safety-hazards/chapter-4)) The 2026 edition of ANSI/A3 R15.08 Part 3 explicitly addresses management of change to both industrial mobile robot applications and their current operating environment. ([A3 standard description](https://www.automate.org/store/products/ansi-a3-r15-08-3-2026-american-national-standard-for-industrial-mobile-robots-safety-requirements-part-3-use-of-imr-applications-pdf-download))

There is also a credible physical reason to investigate such changes: warehouse automation integrator TGW says highly reflective flooring may interfere with vision-based navigation, and inconsistent surface coatings can introduce navigation drift. ([TGW facility-readiness guidance](https://www.tgw-group.com/en/news/detail/preparing-your-facility-for-advanced-warehouse-robots/)) This does not establish that a particular floor treatment will harm a particular robot; ANDON must compare the installed system’s documented conditions, not infer a universal hazard.

### The single demonstration scenario

Use an explicitly synthetic warehouse, not a claim about an actual customer incident. The source records should contain these exact facts:

| Record | Synthetic content |
|---|---|
| Facilities Jira request | “Apply high-gloss clear finish to Aisle 7 next Saturday.” The ticket does not mention robots, commissioning, or revalidation. |
| Confluence site registry | Aisle 7 is associated with deployment AMR-12 and links to its commissioning record and test plan. |
| Commissioning record | “Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.” |
| Test plan | A qualified owner has defined a surface-condition review and a route/perception verification procedure. |
| Existing evidence | Results are tied to the original configuration and matte-floor condition. No record establishes coverage of the proposed high-gloss finish. |

The app’s finding should be: “The selected baseline does not establish coverage of the planned high-gloss condition.” It must not say “the robot will fail,” “the floor is unsafe,” or “the deployment is now illegal.”

The difference between intent and reality is fundamental. A planned ticket creates a prospective evidence gap; it does not establish that the physical floor has changed, and it does not retroactively invalidate the original test result.

## Goals

These are proposed validation targets, not measured outcomes. Establish a manual-review baseline before reporting improvement.

- **Discover overlooked coordination:** Surface a source-grounded candidate relationship between an ordinary facilities request and a documented deployment condition, without requiring a pre-existing robotics link on the request.
- **Make the gap inspectable:** Let a reviewer identify the changed attribute, old evidence scope, physical location, source versions, and responsible owner without reading an AI essay.
- **Convert discovery into accountable work:** Create a reviewer-approved Jira follow-up containing the exact unresolved question and the applicable existing procedure, rather than a generic risk summary.
- **Preserve uncertainty:** Never translate missing evidence, missing permissions, or a missing graph edge into “unaffected” or “safe.”
- **Show complete product behavior:** Demonstrate discovery, confirmation, dismissal, source changes, duplicate-event handling, and a clean fresh installation.

## Non-goals

The hackathon app should be deliberately narrow. Its ambition is to expose a missing organizational dependency, not to impersonate a robotics safety engineer.

- **No robot control:** No emergency stops, motion commands, PLC modifications, fleet routing, or physical actuation.
- **No safety certification:** No automated risk acceptance, regulatory verdict, safety integrity calculation, or authorization to resume operation.
- **No replacement QMS or PLM:** No full asset lifecycle, CAPA suite, formal safety-case authoring system, or electronic batch release.
- **No invented physics:** No generic lighting threshold, coefficient of friction, failure probability, or assertion that all high-gloss floors are unsuitable.
- **No simulation project:** No world model training, digital twin, live camera integration, or robot purchase required.
- **No exhaustive monitoring claim:** The app can only inspect configured, accessible work and recorded conditions. Work done without records remains outside its visibility.

## The product experience

The interface should feel like an inspector’s annotated redline, not another chatbot. Its central object is a proposed “this work changes this condition” connection, with the evidence on both sides visible.

### User stories

- **Facilities coordinator:** “As the owner of a maintenance request, I want to know whether a planned change needs another team’s review before scheduling the work.”
- **Robotics engineer:** “As the deployment owner, I want the app to show the exact assumption potentially touched, so I can confirm or reject the relationship rather than trust semantic similarity.”
- **Commissioning reviewer:** “As the qualified reviewer, I want the evidence’s original scope preserved and the missing question made explicit, so I can choose the appropriate review or test.”
- **Restricted user:** “As someone without access to a linked document, I want an honest incomplete assessment, without another user’s private document being exposed.”

### The three-screen workflow

- **Change lens:** Open ANDON on the facilities ticket. Show the planned work, location, effective date if known, and “possible commissioning dependency.” Discovery is a proposal, not a confirmed impact.
- **Evidence redline:** Put the ticket’s quoted change on the left and the versioned commissioning clause on the right. Between them, show the real graph context, the proposed semantic connection, and separate controls to confirm the location, deployment, and changed attribute.
- **Review package:** After confirmation, show the selected evidence’s coverage gap, responsible reviewer, existing relevant procedures, and proposed Jira follow-up. The human chooses the target project, edits the request, and explicitly approves creation.

Include a prominent **“Not related”** action with a reason. A false candidate should be dismissible without creating a robotics incident or polluting the confirmed dependency graph.

### The state model

Keep discovery status separate from evidence applicability and separate again from the organization’s real operational authorization. Those are different decisions.

| Situation | ANDON’s proposed response |
|---|---|
| LLM suspects a relationship | `Candidate`: show quoted sources; no confirmed impact or automatic task creation. |
| Human confirms same deployment/location and changed condition | `Confirmed relationship`: evaluate the declared evidence scope. |
| Work is planned, the proposed condition is outside the selected baseline, and no accepted alternative covers it | `Prospective coverage gap`: the recorded evidence does not establish coverage of the proposed condition. |
| An authorized person confirms the change actually occurred | `Current coverage review needed`: reassess the recorded evidence’s applicability from the confirmed effective time. |
| Specification, identity, access, or evidence is missing | `Unknown`: request clarification; never convert this to a clean bill of health. |
| Reviewer rejects the proposed relationship | `Dismissed with reason`: retain the decision and its source versions. |
| New reviewed evidence covers the changed condition | `Supported within declared scope`: record the new basis without rewriting the original evidence. |
| Source content materially changes after review | `Stale assessment`: require renewed review of the affected decision. |

“Supported within declared scope” is an application finding about specified records and rules. It is not a statement that the entire deployment is safe.

## Technical requirements and architecture

The core should be a bounded workflow: contextual discovery, source-grounded extraction, human confirmation, deterministic comparison, and approved mutation. Do not build a free-running multi-agent system.

### What Atlassian does

| Component | Proposed role | Verified platform boundary |
|---|---|---|
| Forge Custom UI and backend | Jira issue panel, review workspace, resolvers, authorization checks, and typed comparison logic. | The competition requires a Forge app integrated with at least one listed Atlassian product or capability. ([Codegeist rules](https://codegeist2026.devpost.com/rules)) |
| Jira | Facilities intake, change history, accountable follow-up, and reviewer-approved issue creation. | Enhanced JQL search is available through the Jira REST API; visibility follows the caller’s project and issue-security permissions. ([Jira issue-search API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post)) |
| Confluence | Site registry, deployment conditions, commissioning records, and test procedures. | Native page reads provide page content and revision information; use the native revision, not a graph timestamp, as the source-version anchor. ([Confluence page API](https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/#api-pages-id-get)) |
| Teamwork Graph | Discover linked context and page owners from a configured site-registry page. | Curated queries include `confluencePageLinkedConfluencePages` and `confluencePageOwners`, with permission-filtered results and pagination capped at 25 per page. ([Curated queries](https://developer.atlassian.com/platform/teamwork-graph/curated-queries/)) |
| Forge LLMs | Propose changed attributes and candidate relationships from accessible text, with exact source spans. | Atlassian-hosted inference is available through `@forge/llm`; current documented model I/O is text-only. ([Forge LLMs API](https://developer.atlassian.com/platform/forge/runtime-reference/forge-llms-api/), [model capabilities](https://developer.atlassian.com/platform/forge/runtime-reference/forge-llms-models/)) |
| Forge SQL | Store the app’s own reviewed scope records, support edges, source versions, and decision history. | SQL storage is per installation; it is not a native robotics graph or a general graph database. ([Forge SQL](https://developer.atlassian.com/platform/forge/storage-reference/sql/)) |

Jira Service Management is a natural intake extension, but ordinary Jira requests are sufficient for the judged MVP. Atlassian already offers a facilities-service-management template for maintenance, moves, and related requests, so the intake workflow is sponsor-native rather than an artificial robotics-only form. ([Atlassian facilities template](https://www.atlassian.com/software/jira/templates/facilities-service-management))

### The essential distinction between two graphs

Use Teamwork Graph to answer “what recorded context is linked here, and who owns it?” Use the app-local graph to answer “which reviewed evidence relationship depends on this declared condition?”

Teamwork Graph’s documented curated traversals expose Atlassian context, not native concepts such as floor reflectivity, robot commissioning scope, or evidence sufficiency. ([Curated queries](https://developer.atlassian.com/platform/teamwork-graph/curated-queries/)) Therefore, never relabel a native page hyperlink as a proven `supports` or `affected-by` relation.

Proposed local entity types are `Site`, `Zone`, `Deployment`, `Condition`, `EvidenceRevision`, `ChangeIntent`, `ConfirmedChange`, and `ReviewDecision`. Each accepted support edge should retain source identifiers, version anchors, quoted spans, the approving actor, and its effective scope.

Use native Confluence revision numbers where available. For Jira content, retain the issue identifier, captured update/changelog information, and an app-local content fingerprint rather than pretending that every issue has a Confluence-style immutable revision number.

### Discovery without pretending the missing link already exists

Start with a configured site/zone field or a human-confirmed site mapping on the facilities request. Follow real links from that site’s Confluence registry to commissioning and test-plan pages using Teamwork Graph, then fetch the authoritative text and revisions through native APIs.

The model proposes that “high-gloss finish” may change the recorded “matte epoxy” condition for Aisle 7. The missing relationship is the connection from the work request to the commissioning assumption; it must not be secretly seeded into the demo as an existing impact edge.

Require source-grounded proposals containing the candidate deployment, zone, attribute, old/new value if available, effective-time information, and exact quotes. Validate identifiers and enums in code, reject unsupported values, and keep ambiguous identity unresolved.

### Deterministic comparison after human confirmation

Once the reviewer confirms the physical association and normalized condition, compare the proposed state with a versioned, human-approved scope record. For the MVP, use simple exact values and explicit sets, not a general scientific reasoning engine.

For example, a scope declaring that a particular result covers `surface_finish = matte_epoxy` does not establish coverage of `surface_finish = high_gloss_clear_finish`. The output should explain that coverage gap; it does not prove a performance regression.

If an existing approved equivalence assessment covers both finishes, include that as an alternative support path. If evidence is incomplete, return `Unknown`; if the test owner has not defined a relevant procedure, create an expert-definition request rather than inventing a test.

### Source changes and the two clocks

Store both the confirmed effective time of a physical change and the time the app learned about it. This adapts the bitemporal distinction between business time and system time described by Databricks, rather than treating a late-arriving ticket as a newly occurring physical event. ([Databricks bitemporal engineering](https://www.databricks.com/blog/taking-auto-cdc-next-level-solving-hardest-real-world-use-cases))

A backdated completion should open a review-only lookback over the recorded interval. Do not claim a complete list of affected robot runs unless use records actually exist, and do not rewrite what the reviewer knew at the earlier decision time.

Jira and Confluence product events can flag known local source references for refresh or mark existing assessments stale; Confluence update events include page-version information. ([Jira events](https://developer.atlassian.com/platform/forge/events-reference/jira/), [Confluence events](https://developer.atlassian.com/platform/forge/events-reference/confluence/)) Teamwork Graph calls are current-user operations, so an unattended event handler must not pretend it can re-traverse the graph as an app-wide superuser. ([Teamwork Graph request API](https://developer.atlassian.com/platform/forge/apis-reference/ui-api-bridge/requestTeamworkGraph/))

Re-check the source and permissions when an authenticated reviewer opens the assessment or confirms a write. Treat event delivery and search freshness as imperfect, add a visible “last checked” state, and reconcile known references rather than promising instantaneous surveillance.

### Mutation and disclosure boundaries

Treat ticket and page text as evidence, never as instructions to the app. The extraction model must have no Jira mutation or approval tools; the confirmation endpoint must separately verify the authenticated actor against an administrator-configured reviewer policy, not assume that a page owner is a qualified approver.

Default newly created Jira tasks to a neutral review request and a protected assessment pointer, without copying private source excerpts or titles into a broader project. Show destination visibility before creation, require explicit authorization for any excerpt disclosure, and re-check source access when someone follows the assessment pointer.

Use an action record with a stable review identifier and states such as pending, confirmed, and outcome-uncertain. If an external issue-creation response is lost, reconcile the uncertain action before permitting a retry; a local idempotency key alone must not be represented as exactly-once execution across Jira and SQL.

### P0 acceptance criteria

- **Grounded discovery:** Given an unlinked facilities request and accessible site context, when analysis runs, then every proposed relationship must show both source spans and remain unconfirmed until reviewed.
- **No physical-state inference:** Given a planned ticket, when a prospective mismatch is found, then the app must not mark the work completed or claim the current physical deployment has changed.
- **Honest unknown:** Given missing finish data, ambiguous Aisle 7 identity, or unavailable source content, when evaluated, then the app must return `Unknown`, not manufacture a match.
- **Scoped consequences:** Given one confirmed changed condition, when applicability is recalculated, then only app-local support relationships resting on that condition may change; unrelated test results remain untouched.
- **Human-only mutation:** Given an AI proposal, when no authorized user has confirmed the action, then no Jira follow-up is created and no disposition is recorded.
- **Version binding:** Given a reviewed source that changes, when the user attempts to rely on the earlier assessment, then the app must require refresh and re-review before recording a new confirmation.
- **Retry safety:** Given repeated delivery of the same source change or repeated create requests, then stable idempotency identifiers and a visible action state must prevent ordinary duplicate follow-ups.
- **Permission isolation:** Given a second reviewer without access to a source, then the app must not reveal cached text, titles, or derived sensitive findings from the first reviewer’s session.

### Engineering constraints to resolve early

Choose Jira as the required app and Confluence as an optional same-site app in the multi-app design; verify installation compatibility and shared persistence with a real spike before relying on it. Atlassian documents same-site Jira/Confluence compatibility, but platform documentation needs to be checked against actual behavior rather than assuming two independent installs share data. ([Forge app compatibility](https://developer.atlassian.com/platform/forge/app-compatibility/), [Forge SQL](https://developer.atlassian.com/platform/forge/storage-reference/sql/))

Do not design a multi-step operation around an assumed multi-statement SQL transaction. Use parameterized statements, explicit pending/confirmed action records, compare-and-update checks, and recoverable intermediate states; SQL has documented execution limits and installation-time schema-readiness considerations. ([SQL API](https://developer.atlassian.com/platform/forge/storage-reference/sql-api/), [SQL limits](https://developer.atlassian.com/platform/forge/limits-sql/), [SQL tutorial](https://developer.atlassian.com/platform/forge/storage-reference/sql-tutorial/))

The MVP should mark app-local review status and create approved Jira follow-ups, not claim to block physical work or all Jira transitions. A real transition gate requires an administrator to configure a workflow validator on the relevant transition; a display field alone is not enforcement. ([Forge workflow validator](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-workflow-validator/))

## Evaluation and success metrics

Separate the extraction model from the deterministic comparison and from the final side effects. Judge the persisted consequences, not whether an explanation sounds convincing.

Build a small expert-reviewed fixture set, then hold out a portion before tuning. Suggested targets below are release gates for the prototype, not evidence of field reliability.

| Measure | Proposed prototype target | How to evaluate |
|---|---|---|
| Candidate precision | At least 90% on the held-out, bounded fixture set. | Have an independent reviewer label whether the proposed relationship merits review; report numerator, denominator, and disagreements. |
| Candidate recall | Report separately, including every missed relevant fixture. | Do not hide misses by showing precision alone or claim real-world hazard coverage. |
| Grounding | Every displayed change assertion has an exact source span and revision. | Deterministic source-span checks plus manual review of semantic correspondence. |
| Deterministic scope behavior | All agreed positive, negative, unknown, and alternative-support cases pass. | Unit tests independent of model output. |
| Unauthorized side effects | Zero in the defined adversarial suite. | Attempt direct mutation, forged confirmation, stale-source writes, and agent-submitted approval. |
| Duplicate effects | No duplicate task in repeated-event and retry fixtures. | Replay events, interrupt the create flow, and resume from intermediate states. |
| Review usability | Five representative users can complete the task; target median under three minutes. | Timed task test against manual review; report actual results and sample size. |
| Installation | Two independent clean-site installs complete the documented setup. | Test schema readiness, permissions, seeded content, and the real graph query. |

The fixture set should include similarly named zones on different sites, negated and cancelled changes, cosmetic changes with no documented dependency, missing specifications, alternative accepted evidence, restricted pages, deleted sources, out-of-order events, backdated completion, and malicious instructions embedded in a ticket. A high score on these fixtures would still be a prototype result, not certification.

## Open questions and kill criteria

Answer these before building a polished dashboard. A visually impressive workflow is not useful if the intake gap does not exist or the graph integration cannot work.

- **Demand, product lead, blocking:** Can at least two integrators or deployment owners describe a real cross-team environmental change that escaped their normal engineering-change intake? Seek redacted artifacts, not agreement with a leading pitch.
- **Data, engineering lead, blocking:** Do target teams already record enough site, zone, owner, and commissioning context to discover the relationship without a large data-cleaning project?
- **Platform, engineering lead, blocking:** Can a clean authorized installation retrieve real linked pages and owners through Teamwork Graph, fetch exact Confluence revisions, and store/retrieve the review record?
- **Domain scope, reviewer, blocking:** Can a qualified robotics reviewer approve the demo’s condition schema and the distinction between an evidence gap and an actual adverse effect?
- **Competition, product lead, blocking:** Do existing tools already discover unstructured, previously unlinked facilities requests and route the same evidence-context review? If yes, reassess the differentiation before committing further.
- **Commercial model, founder, non-blocking:** Will an integrator pay for earlier coordination, or will customers see this as a feature their existing change-management provider should supply?

Stop or materially narrow the project if the initial interviews show that existing processes reliably capture these changes, if useful discovery needs inaccessible operational data, or if the app is merely reproducing an existing end-to-end workflow. No honest research process can eliminate all execution or novelty risk in advance.

## Why this moment, and why Atlassian should care

The timing comes from a specific combination rather than a generic “AI is growing” claim. Teamwork Graph consumption moved into public Preview on October 15, 2026, with typed curated queries and granular graph scopes, while the 2026 A3 standard’s scope explicitly includes changes to the robot application’s operating environment. ([Teamwork Graph changelog](https://developer.atlassian.com/platform/teamwork-graph/changelog/), [A3 standard description](https://www.automate.org/store/products/ansi-a3-r15-08-3-2026-american-national-standard-for-industrial-mobile-robots-safety-requirements-part-3-use-of-imr-applications-pdf-download))

Atlassian’s October Context Quality Score framework emphasizes completeness, connectedness, and relevance of AI context; its published description does not establish whether physical operating assumptions remain covered by evidence. ([Atlassian Context Quality Score](https://www.atlassian.com/blog/context/context-quality-score)) The strategic opportunity is therefore an application of connected context: expose a specific missing coordination relationship, then make it reviewable.

Atlassian already describes agent identities, scoped permissions, attribution, auditability, and human checkpoints in its AMP strategy, so another generic agent-governance layer would not be a convincing gap. ([Atlassian founder update](https://www.atlassian.com/blog/company-news/team26-europe-founder-update)) ANDON should use those principles, not pitch them as its invention.

The competitive baseline is similarly advanced: Microsoft describes Work IQ as organizational work context and Agent 365 as an agent-governance control plane, while Asana describes an Enterprise Work Graph, shared memory, and coordinated human-agent workflows. ([Microsoft announcement](https://blogs.microsoft.com/blog/2026/03/09/introducing-the-first-frontier-suite-built-on-intelligence-trust/), [Asana announcement](https://asana.com/press/releases/pr/asana-unveils-operating-system-for-human-agent-teams/f12f477a-7c35-4365-9771-578a294abc0d)) Therefore, compete on the demonstrated, domain-specific handoff from overlooked work to evidence review, not on an unsupported claim that only Atlassian can connect context or govern agents.

Mike Cannon-Brookes also describes Jira as a collaborative workflow engine and Atlassian as a connected meeting point between systems, rather than a control tower requiring everything to be centralized. ([Decoder interview](https://www.theverge.com/podcast/1000914/atlassian-ceo-mike-cannon-brookes-saaspocalypse-ai-enterprise-software-trello-jira)) That supports a product which coordinates the handoff to commissioning and test tools instead of trying to replace them.

### Make the organizer’s technology the demonstrated hero

The decisive demo moment should be a real Teamwork Graph traversal that connects the facilities request’s site context to previously unconsulted commissioning pages and their owner. Jira then becomes the shared work record, Confluence supplies the versioned engineering knowledge, and Forge carries the trusted workflow and state.

Do not claim this is technologically impossible outside Atlassian. The stronger claim is that the demonstrated value comes from Atlassian’s connected work, knowledge, permissions, ownership, and follow-through, rather than from an unrelated model wearing a Jira front end.

If removing the live graph call leaves the demonstration unchanged, redesign the demonstration. Do not seed a fake graph response and still claim the Teamwork Graph bonus.

## The novelty claim that can be defended

The proposed differentiation is **pre-engineering-change discovery**: a facilities ticket not yet recognized as robotics-relevant is connected to a documented operating assumption, confirmed by a human, and converted into a version-bound evidence-coverage review.

That is a narrower claim than “the first living safety case,” “the first evidence graph,” or “the first AI change-risk tool.” Those broader claims conflict with the prior art below.

| Existing work | What is already present | Where ANDON must demonstrate a distinct contribution |
|---|---|---|
| Saphira continuous validation | Changes to model, payload, site, task, or control strategy are connected to assumptions, hazards, tests, evidence, and human deployment decisions. ([Saphira](https://www.saphira.ai/continuous-validation)) | Demonstrate discovery before a facilities request has entered that engineering-change workflow, not a substitute safety-analysis platform. |
| Spherity PACE research architecture | Configuration- and use-bound evidence, controlled change, test requirements, and human assessment are already described in a research architecture, not established here as a released certified product. ([PACE research](https://spherity.github.io/spherity-research/physical-ai-compliance-evidence-pace.html)) | Demonstrate the missing intake relationship from an unrecognized facilities request, not claim invention of configuration-bound assurance. |
| Pantano and colleagues, 2022 | Factory-resource configuration changes can be detected and used to prompt expert risk-assessment updates; the method does not automate hazard identification or risk estimation. ([Published paper](https://elib.dlr.de/194561/1/applsci-12-05639-v2.pdf)) | Demonstrate the proposed relationship emerging from unstructured cross-team work rather than an already modeled factory-resource change. |
| Atlassian Ops Expert | Native contextual change-risk narratives, technical/operational signals, mitigation suggestions, and accepted follow-up task creation already exist. ([Ops Expert documentation](https://support.atlassian.com/jira-service-management-cloud/docs/assess-potential-risks-to-your-changes-with-rovo-ops/)) | Show the specific commissioning clause, human-confirmed condition link, version-bound coverage comparison, and explicit unknown state, not another risk narrative. |
| Seal validation and calibration workflows | Intended use, configuration, evidence scope, change review, and use-specific suitability already have close commercial implementations. ([Seal validation](https://seal.run/blueprints/qms-validation), [Seal calibration](https://seal.run/blueprints/pharmaceutical-calibration-management)) | Do not claim evidence applicability itself is new; prove the narrow cross-team intake workflow instead of building another QMS. |

The reviewed sources do not establish that this exact workflow is absent from every product or private deployment. Treat originality as a bounded, testable differentiation hypothesis and keep checking it during customer discovery.

### The older idea inside the modern one

The nostalgic product metaphor is an Andon-style attention signal: expose an abnormal condition and bring the right people together, without having the software claim authority over the machine. The technical inspiration is older truth-maintenance work, where conclusions retain their supporting assumptions and can be reconsidered when context changes; assumption-based truth maintenance was already described in the 1980s. ([AAAI historical paper](https://cdn.aaai.org/AAAI/1986/AAAI86-003.pdf))

The modern contribution is not rediscovering that theory. It is applying source-grounded language extraction and a live organizational context graph to find a relationship that no one had explicitly recorded, then handing it to a constrained, inspectable workflow.

## Technical depth borrowed from the supplied research

Use the supplied engineering ecosystem as a source of implementation patterns, not as a collection of technologies to cram into the app. These transfers have direct product consequences.

- **Retractable derived state:** Slack invalidates summaries derived from source messages tombstoned by DLP. ([Slack AI engineering](https://slack.engineering/how-we-built-slack-ai-to-be-secure-and-private/)) Apply that pattern to source-bound assessments: mark dependent findings stale when their recorded basis changes, while preserving history.
- **Explicit metadata and ownership:** Uber Databook describes typed metadata, relationships, change logging, and owner verification. ([Uber Databook](https://www.uber.com/in/en/blog/metadata-insights-databook/)) Borrow that discipline for reviewed entities and edges instead of treating an embeddings index as the authoritative model.
- **Incomplete graph means incomplete knowledge:** OpenLineage documentation warns that graph-visible tasks may still lack input/output lineage. ([OpenLineage coverage](https://airflow.apache.org/docs/apache-airflow-providers-openlineage/stable/supported_classes.html)) An absent path in ANDON must therefore mean “no recorded relationship found in accessible context,” not “no physical effect.”
- **Targeted work is not a minimal-safe-test guarantee:** Meta’s predictive test selection combines dependency information with probabilistic ranking. ([Meta test selection](https://engineering.fb.com/2018/11/21/developer-tools/predictive-test-selection/)) ANDON should suggest a bounded review package covering its documented, confirmed assumptions, subject to expert additions; it must not claim globally sufficient or safety-optimal retesting.
- **Approval is a separate capability:** Newsletter research surfaced a recent engineering argument for a deterministic substrate that applies approved proposals rather than letting the model mutate state directly. ([Stack Overflow determinism layer](https://stackoverflow.blog/2026/10/07/part-1-make-your-ai-agents-boring-the-determinism-layer/)) Apply that separation to candidate discovery and Jira writes; the approval endpoint must not be an agent-callable shortcut.

Recent Anthropic research also found substantial expert alignment with an agent’s experimentally varied lean in one causal-analysis setting; it did not prove that a particular human-first intervention fixes industrial review. ([Anthropic judgment study](https://www.anthropic.com/research/agents-judgment-calls)) The restrained design response is to show source facts before persuasive AI narrative and require explicit confirmation, not bolt an unrelated “debiasing engine” onto the MVP.

## Build plan through submission

This is a proposed schedule for a small team, not an estimate based on known team capacity. Keep one vertical, one physical condition, and one complete workflow until it works on a fresh site.

| Period | Deliverable | Exit condition |
|---|---|---|
| November 4–8 | Domain interviews, exact demo scope, and platform spike. | Real graph traversal, native source revision read, persistence, consent, and one qualified reviewer’s approval of the domain framing. |
| November 9–15 | Jira panel, site registry, seeded records, and evidence redline. | A reviewer can inspect actual source content, owner context, and versions; no placeholder graph response. |
| November 16–22 | Grounded extraction, candidate confirmation, typed scope comparison. | The unlinked floor request produces an inspectable candidate; negation, wrong-zone, and missing-specification cases behave correctly. |
| November 23–29 | Approved follow-up creation, source-change handling, and retry-safe state. | A source update marks the relevant assessment stale; replay does not create duplicate work. |
| November 30–December 6 | Held-out evaluation, access-control testing, and two clean installations. | Publish actual fixture results and fix permission leaks, stale writes, or unsupported assertions before adding features. |
| December 7–13 | Usability sessions, presentation, and setup documentation. | Representative users complete the workflow; the main demonstration fits within three minutes. |
| December 14–20 | Freeze the core, test judge setup, record final video, and prepare submission. | Public-video permissions, installation access, configuration instructions, and declared limitations are ready. |
| December 21–22 | Buffer and submit. | Submit before the official deadline, with time to resolve upload or installation problems. |

The official deadline is December 22, 2026 at noon PST, which converts to December 23 at 01:30 IST; aim to finish earlier rather than use the conversion as a last-minute target. ([Codegeist dates and rules](https://codegeist2026.devpost.com/rules)) The judging period extends through February 3, 2027, so keep the app, judge access, and dependencies working throughout that period. ([Codegeist judging schedule](https://codegeist2026.devpost.com/rules))

### Scope priority

- **P0:** Live Jira/Confluence flow, real Teamwork Graph consumption, one condition schema, grounded candidate discovery, human confirmation, deterministic coverage comparison, approved Jira work, permission checks, version binding, and reproducible installation.
- **P1:** Effective-time/learned-time lookback, richer review history, and an additional condition family such as documented lighting configuration, only after the core is reliable.
- **P2:** A Rovo conversational interface to the same read/preview capabilities, optional workflow enforcement, and external evidence-system handoff.
- **Cut entirely for this entry:** MCP infrastructure, custom graph ingestion, blockchain, autonomous revalidation, live robot telemetry, and multi-industry demonstrations.

## The demonstration judges should remember

Use a roughly 2-minute-45-second screen recording of the actual installed app. The official video limit is under five minutes, but judges are not required to watch beyond three, so the complete story belongs inside that window. ([Codegeist video rules](https://codegeist2026.devpost.com/rules))

| Time | Show | Communicate |
|---|---|---|
| 0:00–0:20 | Ordinary floor-finish request, with no robotics link. | “The robot did not change. A different team plans to change its environment.” |
| 0:20–0:50 | Real graph context loads the site’s linked commissioning record and owner. | “This facilities task was not recognized as an engineering change.” |
| 0:50–1:20 | Two source quotes, exact versions, same-zone confirmation. | “The app proposes the relationship. The engineer confirms it.” |
| 1:20–1:45 | Prospective coverage gap beside the original historical result. | “The old result still describes the old condition. It does not establish the proposed one.” |
| 1:45–2:10 | Human approves a review task using an existing procedure. | “ANDON creates accountable work, not a safety verdict.” |
| 2:10–2:30 | Change the ticket to omit the finish specification; show `Unknown`. | “Missing data produces a question, not a fabricated answer.” |
| 2:30–2:45 | Show source-version history and final product screen. | “Connected context reveals the change nobody knew was a robotics change.” |

Prepare a separate documented path for judges to seed the synthetic site and reproduce the workflow. The rules require a working installation link and all necessary configuration instructions, not just access to a polished video. ([Codegeist testing requirements](https://codegeist2026.devpost.com/rules))

### Equal attention to the five judging criteria

The rules weight implementation, design, impact, innovation, and presentation equally, with implementation considered first in a tie. ([Codegeist judging criteria](https://codegeist2026.devpost.com/rules)) Allocate effort to evidence for each criterion instead of assuming novelty compensates for a fragile build.

- **Implementation, 20%:** Real contextual graph reads, actual source revisions, tested state transitions, authorization, and recoverable writes.
- **Design, 20%:** A coherent three-screen experience, explicit unknowns, simple dismissal, visible ownership, and a readable review package.
- **Impact, 20%:** Specific interview evidence, a credible before/after workflow, and measured review performance, without invented accident-prevention claims.
- **Innovation, 20%:** Demonstrate the previously unrecorded request-to-assumption relationship, and acknowledge the existing safety/evidence platforms.
- **Presentation, 20%:** One recognizable ticket, one unexpected connection, one inspectable gap, and one completed human handoff.

## Business and founder perspective

The initial customer hypothesis is a robot integrator or warehouse deployment team already coordinating through Jira and Confluence, with responsibility spanning engineering, facilities, and operations. Do not assume this is the entire robotics market or that these tools are universal in factories.

The proposed commercial entry point is a read-only retrospective pilot: examine a small, permissioned sample of completed facilities changes and ask whether the team’s existing process caught every relevant commissioning dependency. If ANDON finds no useful overlooked relationships, that is important negative evidence, not a reason to manufacture alerts.

- **Buyer:** Start by testing integrator engineering leads and customer commissioning/automation owners; determine who owns the coordination cost before deciding whether safety or facilities has budget.
- **Sales message:** “Find environmental changes your robotics change process never saw.” Avoid selling guaranteed compliance or prevention of injuries.
- **Distribution hypothesis:** Pilot with one integrator and one customer site, then assess repeatability across that integrator’s deployments before broad Marketplace promotion.
- **Pricing hypothesis:** Test a per-site or monitored-deployment subscription rather than charging every facilities requester. No willingness-to-pay evidence or revenue forecast is assumed.
- **Unit economics:** Measure model calls per reviewed request, context-fetch volume, onboarding effort, and reviewer time. Do not hide manual scope modeling inside an apparently automated margin.
- **Growth:** Expand from surface-condition changes to other explicitly documented environmental assumptions, then to equipment configuration changes only after the evidence model proves useful.
- **Defensibility:** Seek a trusted library of reviewed condition schemas, accepted/rejected relationship examples, and reliable integration behavior. The model alone is not a moat.
- **Team culture:** Reward correct dismissals and explicit unknowns, not the number of alerts created. Assign a qualified domain reviewer real veto authority over misleading product claims.

The business case should use measured coordination time, overlooked relevant changes, false-alert burden, and review completion, not an invented total addressable market or monetary estimate of avoided accidents. A narrow, repeatable workflow is a stronger company starting point than an unsupported “platform for all physical AI.”

## Submission and research boundaries

Target Specialized Industries because the problem, vocabulary, and demonstration are specific to manufacturing and warehouse robotics, not because its participation is known to be lower. There is no verified category-level entry count supporting a “least competitive” claim.

First place is $15,000 for one winner in each of the three categories, with the stated Team 2027 tickets, blog recognition, and signed Williams Racing swag; a submission can win at most one Grand Prize and one Bonus Prize. ([Codegeist prizes](https://codegeist2026.devpost.com/rules)) Prioritize the $1,500 Teamwork Graph bonus rather than adding four technologies in pursuit of cumulative bonus payouts the rules do not permit. ([Codegeist bonus eligibility](https://codegeist2026.devpost.com/rules))

Do not pursue a Marketplace listing at the expense of judge access: Atlassian documents that Marketplace submission changes ordinary app-sharing availability, so distribution must be planned and tested if that route is added. ([Forge distribution](https://developer.atlassian.com/platform/forge/distribute-your-apps/)) Keep the submission original, use synthetic demonstration records, respect third-party licenses and marks, and obtain consent before making customer material public. ([Codegeist submission and IP rules](https://codegeist2026.devpost.com/rules))

### What the research did and did not establish

All seven supplied files were parsed and inventoried end-to-end. The audit found 15,973 valid URL mentions representing 15,253 normalized URL identities, including 6,349 YC profile pages; these are not 15,253 engineering articles or verified current companies.

The attachment-focused research read 20 selected original technical pages: five exact listed URLs and 15 relevant publisher child pages, alongside the wider official-platform, domain, competitor, leadership, research-paper, and newsletter work. It did **not** fetch every supplied URL or validate the link health of the full inventory, and no claim of exhaustive website, newsletter, or social-platform coverage is made.

The official overview, rules, resources, updates, and gallery were examined, and the official getting-started video transcript was reviewed; the latter recommends a separate development environment and the Forge tooling path. ([Codegeist overview](https://codegeist2026.devpost.com/), [official resources](https://codegeist2026.devpost.com/resources), [getting-started video](https://youtu.be/uac46B7aXmA)) No dedicated hackathon interview collection was verified, so leadership interviews were used as strategic context rather than represented as official competition interviews.

Authorized read-only Gmail research included received Hello, World! and Neatprompts issues and other relevant newsletters; public originals are cited here rather than publishing private email content. Five parallel research workstreams covered competition rules/platform feasibility, Atlassian strategy, real-world problems/prior art, attachment sources, and newsletter signals.

Universal nonexistence, commercial demand, and a first-place outcome remain unproven. The defensible recommendation is to build and validate this one narrowly differentiated workflow: **discover the shadow change, show the boundary of recorded evidence, and put the right humans back in the loop before the work proceeds.**
