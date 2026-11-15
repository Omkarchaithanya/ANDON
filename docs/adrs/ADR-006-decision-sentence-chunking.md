# ADR-006: Declarative Condition Registry & Pure Set-Membership Comparator

## Status
Accepted

## Context
Hardcoding scenario rules in code (e.g. `if (value === 'high_gloss')`) or letting an LLM guess whether a physical environment is safe violates safety-critical engineering standards. Industrial environments require extensible, auditable attribute schemas without code modifications.

## Decision
1. **Declarative Condition Registry:** Environmental conditions (`surface_finish`, `lighting_configuration`, etc.) are declared as structured schemas with canonical values and synonyms.
2. **Pure Deterministic Set-Membership:** Coverage evaluation is executed by pure TypeScript set comparison:
   - When proposed value matches declared scope: `COVERED`.
   - When proposed value is outside declared baseline: `GAP` (*"The selected baseline does not establish coverage of the planned condition"*).
   - When attribute is not present in declared baseline: `UNKNOWN`.
3. **Zero Fabricated Physical Claims:** The engine never generates subjective claims like *"robot will slip"* or *"unsafe floor"*; it strictly reports coverage findings against declared baseline evidence.
