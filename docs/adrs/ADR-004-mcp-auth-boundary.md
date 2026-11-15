# ADR-004: Bounded Single-Loop Pipeline vs. Free-Running Multi-Agent Systems

## Status
Accepted

## Context
Autonomous multi-agent loops with open-ended tool calling introduce non-deterministic execution paths, risk token exhaustion, and expose the system to prompt-injection escalations where adversarial ticket text could invoke unintended mutation tools.

## Decision
1. **Bounded 5-Step Pipeline:** ANDON implements a strict single-loop pipeline:
   - `INTAKE`: `@forge/llm` extracts candidate attributes with **zero write tools**.
   - `CONTEXT`: Teamwork Graph traverses curated links under `api.asUser()`.
   - `GROUND`: NFKC substring verification validates candidate quotes.
   - `COMPARE`: Pure deterministic TypeScript engine evaluates coverage.
   - `PACKAGE`: Prepares immutable review proposal for human confirmation.
2. **Zero Model Mutation Permissions:** The model has zero database write access and cannot create Jira issues. All mutations require human qualified reviewer seals.
