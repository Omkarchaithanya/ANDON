/**
 * @module scope-comparison.service
 * @description THE CORE ALGORITHM — Deterministic evidence coverage comparison.
 *
 * This service compares a proposed condition change against declared evidence
 * scope. NO AI is involved — this is pure deterministic logic.
 *
 * The comparison determines whether a proposed change to an operating
 * condition is already covered by existing evidence, has a coverage gap,
 * or is in an unknown state.
 */

import {
  CoverageResult,
} from '../models/enums';
import {
  EvidenceRevision,
  DeclaredScope,
  CoverageDetail,
} from '../models/entities';
import { ValidationError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A proposed condition change to evaluate against evidence scope.
 */
export interface ProposedCondition {
  /** The attribute name being changed (e.g., "floor_loading_capacity"). */
  attribute_name: string;
  /** The proposed new value for this attribute. */
  proposed_value: string;
  /** The current / existing value, if known. */
  current_value?: string;
}

/**
 * The full evaluation result of comparing a proposed condition against evidence.
 */
export interface CoverageEvaluation {
  /** The overall coverage result. */
  result: CoverageResult;
  /** Conditions that are fully matched by the declared scope. */
  matched: Array<{ attribute: string; value: string }>;
  /** Conditions where the declared scope has a different value than proposed. */
  unmatched: Array<{ attribute: string; expected: string; actual: string }>;
  /** Conditions where the attribute is not present in the declared scope at all. */
  missing: Array<{ attribute: string }>;
  /** If an alternative evidence revision covers the proposed change. */
  alternative_evidence_id?: string;
  /** Human-readable explanation of the evaluation. */
  explanation: string;
}

/**
 * Result of comparing a single condition value.
 */
export interface ConditionMatch {
  /** Whether the values match. */
  matches: boolean;
  /** Explanation of why they match or don't. */
  reason: string;
}

/**
 * Result of searching for alternative evidence that covers the proposed change.
 */
export interface AlternativeCoverage {
  /** The evidence revision ID that provides alternative coverage. */
  evidence_id: string;
  /** Whether this evidence covers both the old and new values. */
  covers_both: boolean;
  /** Whether the old/current value is covered by this evidence. */
  old_value_covered: boolean;
  /** Whether the new/proposed value is covered by this evidence. */
  new_value_covered: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a string for case-insensitive, whitespace-insensitive comparison.
 *
 * @param value - The value to normalise.
 * @returns Trimmed, lowercased, collapsed-whitespace string.
 */
function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Parses the declared scope into a map of attribute → value for lookup.
 *
 * The DeclaredScope entity contains conditions as an array of
 * `{ attribute_name, declared_value }` pairs. This flattens them into
 * a lookup map keyed by normalised attribute name.
 *
 * @param scope - The declared evidence scope.
 * @returns A map from normalised attribute name to declared value.
 */
function buildScopeLookup(scope: DeclaredScope): Map<string, string> {
  const lookup = new Map<string, string>();

  if (scope && scope.conditions && Array.isArray(scope.conditions)) {
    for (const condition of scope.conditions) {
      const val = condition.declared_value !== undefined ? condition.declared_value : condition.attribute_value;
      if (condition.attribute_name && val !== undefined) {
        lookup.set(normalise(condition.attribute_name), val);
      }
    }
  }

  return lookup;
}

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------

    /**
     * Evaluates whether a proposed condition change is covered by the declared
     * evidence scope, has a coverage gap, or is in an unknown state.
     *
     * Algorithm:
     * 1. Parse the evidence's declared_scope to get covered conditions.
     * 2. For each proposed condition attribute:
     *    a. Find matching attribute in declared scope.
     *    b. If attribute exists: exact-match the value.
     *    c. If attribute missing: mark as missing.
     * 3. If proposed value ≠ declared value → GAP
     * 4. If proposed value = declared value → COVERED
     * 5. If attribute missing from scope → UNKNOWN
     * 6. If any value is null/undefined → UNKNOWN
     * 7. If alternative evidence covers both values → ALTERNATIVE_PATH
     *
     * @param proposedCondition - The condition change being proposed.
     * @param evidenceScope - The declared scope of existing evidence.
     * @param alternativeEvidence - Optional additional evidence revisions to check.
     * @returns A CoverageEvaluation with the comparison results.
     * @throws {ValidationError} If proposedCondition is invalid.
     */
    export function evaluateCoverage(
      proposedCondition: ProposedCondition,
      evidenceScope: DeclaredScope,
      alternativeEvidence?: EvidenceRevision[]
    ): CoverageEvaluation {
      if (!proposedCondition || !isNonEmptyString(proposedCondition.attribute_name)) {
        throw new ValidationError(
          'proposedCondition must have a non-empty attribute_name'
        );
      }

      const matched: Array<{ attribute: string; value: string }> = [];
      const unmatched: Array<{ attribute: string; expected: string; actual: string }> = [];
      const missing: Array<{ attribute: string }> = [];

      // Handle null/undefined proposed value → UNKNOWN
      if (
        proposedCondition.proposed_value === null ||
        proposedCondition.proposed_value === undefined ||
        proposedCondition.proposed_value.trim() === ''
      ) {
        return {
          result: CoverageResult.UNKNOWN,
          matched,
          unmatched,
          missing: [{ attribute: proposedCondition.attribute_name }],
          explanation: `Proposed value for "${proposedCondition.attribute_name}" is empty or undefined. Cannot evaluate coverage.`,
        };
      }

      // Build lookup from declared scope
      const scopeLookup = buildScopeLookup(evidenceScope);
      const normalisedAttribute = normalise(proposedCondition.attribute_name);

      // Check if the attribute exists in the declared scope
      if (!scopeLookup.has(normalisedAttribute)) {
        // Attribute not in scope — check for alternative evidence
        if (alternativeEvidence && alternativeEvidence.length > 0) {
          const altCoverage = findAlternativeCoverage(
            proposedCondition,
            alternativeEvidence
          );
          if (altCoverage && altCoverage.new_value_covered) {
            matched.push({
              attribute: proposedCondition.attribute_name,
              value: proposedCondition.proposed_value,
            });
            return {
              result: CoverageResult.ALTERNATIVE_PATH,
              matched,
              unmatched,
              missing,
              alternative_evidence_id: altCoverage.evidence_id,
              explanation:
                `Attribute "${proposedCondition.attribute_name}" is not in the primary evidence scope, ` +
                `but alternative evidence (${altCoverage.evidence_id}) covers the proposed value "${proposedCondition.proposed_value}".`,
            };
          }
        }

        missing.push({ attribute: proposedCondition.attribute_name });
        return {
          result: CoverageResult.UNKNOWN,
          matched,
          unmatched,
          missing,
          explanation:
            `Attribute "${proposedCondition.attribute_name}" is not declared in the evidence scope. ` +
            `Cannot determine coverage.`,
        };
      }

      // Attribute exists — compare values
      const declaredValue = scopeLookup.get(normalisedAttribute)!;

      // Handle null/undefined declared value → UNKNOWN
      if (
        declaredValue === null ||
        declaredValue === undefined ||
        declaredValue.trim() === ''
      ) {
        missing.push({ attribute: proposedCondition.attribute_name });
        return {
          result: CoverageResult.UNKNOWN,
          matched,
          unmatched,
          missing,
          explanation:
            `Declared value for "${proposedCondition.attribute_name}" is empty. Cannot determine coverage.`,
        };
      }

      const conditionMatch = compareConditionValue(
        proposedCondition.attribute_name,
        proposedCondition.proposed_value,
        proposedCondition.attribute_name,
        declaredValue
      );

      if (conditionMatch.matches) {
        matched.push({
          attribute: proposedCondition.attribute_name,
          value: proposedCondition.proposed_value,
        });
        return {
          result: CoverageResult.COVERED,
          matched,
          unmatched,
          missing,
          explanation:
            `Proposed value "${proposedCondition.proposed_value}" for "${proposedCondition.attribute_name}" ` +
            `matches declared scope value "${declaredValue}". ${conditionMatch.reason}`,
        };
      }

      // Values don't match — check for alternative evidence before declaring GAP
      if (alternativeEvidence && alternativeEvidence.length > 0) {
        const altCoverage = findAlternativeCoverage(
          proposedCondition,
          alternativeEvidence
        );
        if (altCoverage && (altCoverage.covers_both || altCoverage.new_value_covered)) {
          matched.push({
            attribute: proposedCondition.attribute_name,
            value: proposedCondition.proposed_value,
          });
          return {
            result: CoverageResult.ALTERNATIVE_PATH,
            matched,
            unmatched,
            missing,
            alternative_evidence_id: altCoverage.evidence_id,
            explanation:
              `Proposed value "${proposedCondition.proposed_value}" differs from primary scope ` +
              `value "${declaredValue}" for "${proposedCondition.attribute_name}", but alternative ` +
              `evidence (${altCoverage.evidence_id}) covers the proposed value.`,
          };
        }
      }

      // No alternative coverage — this is a GAP
      unmatched.push({
        attribute: proposedCondition.attribute_name,
        expected: proposedCondition.proposed_value,
        actual: declaredValue,
      });

      return {
        result: CoverageResult.GAP,
        matched,
        unmatched,
        missing,
        explanation:
          `The selected baseline does not establish coverage of the proposed "${proposedCondition.proposed_value}" condition ` +
          `(declared: "${declaredValue}" for "${proposedCondition.attribute_name}"). This is a prospective coverage gap that requires review.`,
      };
    }

    /**
     * Compares a single proposed condition value against a declared condition value.
     *
     * Performs exact string comparison after normalisation (case-insensitive,
     * whitespace-collapsed).
     *
     * @param proposedAttribute - The name of the proposed attribute.
     * @param proposedValue - The proposed value.
     * @param declaredAttribute - The name of the declared attribute.
     * @param declaredValue - The declared value in the evidence scope.
     * @returns A ConditionMatch indicating whether the values match.
     */
    export function compareConditionValue(
      proposedAttribute: string,
      proposedValue: string,
      declaredAttribute: string,
      declaredValue: string
    ): ConditionMatch {
      const normProposed = normalise(proposedValue);
      const normDeclared = normalise(declaredValue);

      if (normProposed === normDeclared) {
        return {
          matches: true,
          reason:
            `Values match: proposed "${proposedValue}" equals declared "${declaredValue}" ` +
            `(after normalisation).`,
        };
      }

      return {
        matches: false,
        reason:
          `Values differ: proposed "${proposedValue}" (normalised: "${normProposed}") ` +
          `does not equal declared "${declaredValue}" (normalised: "${normDeclared}").`,
      };
    }

    /**
     * Searches alternative evidence revisions for one that covers the proposed
     * condition change.
     *
     * An alternative evidence revision covers the change if:
     * - It declares the same attribute
     * - Its declared value matches the proposed new value
     * - Optionally: it also covers the old/current value
     *
     * @param proposedCondition - The condition being proposed.
     * @param allEvidence - All available evidence revisions to search.
     * @returns An AlternativeCoverage if found, or null.
     */
export function findAlternativeCoverage(
  proposedCondition: ProposedCondition,
  allEvidence: EvidenceRevision[]
): AlternativeCoverage | null {
  if (!allEvidence || allEvidence.length === 0) {
    return null;
  }

  const normAttribute = normalise(proposedCondition.attribute_name);
  const normProposedValue = normalise(proposedCondition.proposed_value);
  const normCurrentValue = proposedCondition.current_value
    ? normalise(proposedCondition.current_value)
    : null;

  for (const evidence of allEvidence) {
    const scope: any = typeof evidence.declared_scope === 'string'
      ? (() => { try { return JSON.parse(evidence.declared_scope as string); } catch { return null; } })()
      : evidence.declared_scope;

    if (!scope || !scope.conditions || !Array.isArray(scope.conditions)) {
      continue;
    }

    const matchingConditions = scope.conditions.filter(
      (c: any) => normalise(c.attribute_name || '') === normAttribute
    );

    if (matchingConditions.length === 0) {
      continue;
    }

    const coveredValues = matchingConditions.map((c: any) => {
      const val = c.declared_value !== undefined ? c.declared_value : c.attribute_value;
      return normalise(val || '');
    });

    const newValueCovered = coveredValues.includes(normProposedValue);
    const oldValueCovered = normCurrentValue !== null ? coveredValues.includes(normCurrentValue) : false;

    if (newValueCovered) {
      const evidenceId = evidence.id || (evidence as any).evidence_revision_id || '';
      return {
        evidence_id: evidenceId,
        covers_both: newValueCovered && (normCurrentValue === null || oldValueCovered),
        old_value_covered: oldValueCovered,
        new_value_covered: true,
      };
    }
  }

  return null;
}

/**
 * Builds a structured CoverageDetail from a CoverageEvaluation.
 *
 * Transforms the raw evaluation into the CoverageDetail entity format
 * suitable for storage and API response.
 *
 * @param evaluation - The coverage evaluation result.
 * @returns A CoverageDetail entity with structured breakdown.
 */
export function buildCoverageDetail(
  evaluation: CoverageEvaluation
): CoverageDetail {
  const matchedConditions = evaluation.matched.map((m) => ({
    attribute_name: m.attribute,
    status: 'MATCHED' as const,
    declared_value: m.value,
    proposed_value: m.value,
    detail: `Value "${m.value}" is covered by the declared evidence scope.`,
  }));

  const unmatchedConditions = evaluation.unmatched.map((u) => ({
    attribute_name: u.attribute,
    status: 'GAP' as const,
    declared_value: u.actual,
    proposed_value: u.expected,
    detail: `The selected baseline does not establish coverage of the proposed "${u.expected}" condition (declared: "${u.actual}").`,
  }));

  const missingConditions = evaluation.missing.map((m) => ({
    attribute_name: m.attribute,
    status: 'MISSING' as const,
    declared_value: null,
    proposed_value: null,
    detail: `Attribute "${m.attribute}" is not declared in the evidence scope.`,
  }));

  let explanation = evaluation.explanation;
  if (evaluation.result === CoverageResult.GAP && !explanation.includes('does not establish coverage of the proposed')) {
    const primaryUnmatched = evaluation.unmatched[0];
    const proposed = primaryUnmatched ? primaryUnmatched.expected : '';
    explanation = `The selected baseline does not establish coverage of the proposed "${proposed}" condition. ${explanation}`;
  }

  return {
    result: evaluation.result,
    matched_conditions: evaluation.matched,
    unmatched_conditions: evaluation.unmatched,
    missing_conditions: evaluation.missing,
    conditions: [...matchedConditions, ...unmatchedConditions, ...missingConditions],
    alternative_evidence_id: evaluation.alternative_evidence_id ?? null,
    alternative_evidence_ids: evaluation.alternative_evidence_id ? [evaluation.alternative_evidence_id] : [],
    explanation,
    evaluated_at: new Date().toISOString(),
  };
}
