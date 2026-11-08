# ADR-006: Decision-Sentence Chunking vs. Document-Level RAG

## Context
Standard Retrieval-Augmented Generation (RAG) chunks documents into arbitrary 500-token blocks or processes entire pages.
In enterprise Confluence pages (e.g., engineering guidelines or architecture wikis), a single page frequently contains:
- An active, live architectural decision (e.g., *"Never log PANs or full payment payloads"*).
- An older, superseded decision on the same page (e.g., *"Temporary: Debug with full logs during beta testing"*).
- Unrelated team policies.

If an LLM or retrieval pipeline ingests the entire page, it risks surfacing the superseded clause and erroneously declaring a change cleared, or confusing two contradictory statements on one page.

## Decision
1. **Sentence-Level Chunking at the Decision:**
   Keel extracts discrete decision sentences with heading and anchor provenance (`pageId`, `pageVersion`, `sentenceAnchor`).
2. **Independent Candidate Evaluation:**
   Each candidate decision sentence is evaluated individually by the corrective judge (`judge.v1.md`).
3. **Corrective Check:**
   A candidate decision survives only if a second check verifies:
   - Does this exact decision sentence govern this change?
   - Is there anything newer on record that supersedes or narrows it?

## Consequences
- Prevents false-clears caused by superseded text co-located on active pages.
- Enables verbatim quote citations down to the exact sentence anchor.

