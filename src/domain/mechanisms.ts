/**
 * @module domain/mechanisms
 * @description The 7 Generic Algorithmic Mechanisms of ANDON.
 *
 * 1. Declarative Condition Registry (defined in condition-registry.ts)
 * 2. Parametrized Extraction & Schema Validation
 * 3. Exact NFKC + Whitespace-Collapsed Quote Grounding with Character Offset Mapping
 * 4. Pure Deterministic Set-Membership Coverage Comparator
 * 5. Registry-Only Identity Resolution
 * 6. Compound Action Idempotency Hashing & Three-State Reconciliation
 * 7. Bitemporal Timeline Evaluation & Staleness Verification
 */

import * as crypto from 'crypto';
import { defaultConditionRegistry, ConditionRegistry } from './condition-registry';

// ---------------------------------------------------------------------------
// Mechanism 3: NFKC Substring Verification with Monotonic Character Offset Map
// ---------------------------------------------------------------------------

export interface NormalizedOffsetMap {
  normalized: string;
  offsetMap: number[]; // maps normalized index to original raw string index
}

/**
 * Normalizes text with NFKC, collapses whitespace runs to single space,
 * and maintains a 1-to-1 character offset projection back to the raw string.
 */
export function normalizeWithOffsetMap(text: string): NormalizedOffsetMap {
  if (!text) {
    return { normalized: '', offsetMap: [] };
  }

  const nfkc = text.normalize('NFKC');
  const offsetMap: number[] = [];
  let normalized = '';

  let inWhitespace = false;
  for (let i = 0; i < nfkc.length; i++) {
    const char = nfkc[i];
    if (/\s/.test(char)) {
      if (!inWhitespace) {
        if (normalized.length > 0) {
          normalized += ' ';
          offsetMap.push(i);
        }
        inWhitespace = true;
      }
    } else {
      normalized += char;
      offsetMap.push(i);
      inWhitespace = false;
    }
  }

  // Trim trailing space if any
  if (normalized.endsWith(' ')) {
    normalized = normalized.slice(0, -1);
    offsetMap.pop();
  }

  return { normalized, offsetMap };
}

export interface QuoteVerificationResult {
  verified: boolean;
  startIndex: number;
  endIndex: number;
  rawStartIndex: number;
  rawEndIndex: number;
  revision?: string | number;
}

/**
 * Verifies that a quote candidate is an exact NFKC substring of source text.
 */
export function verifyQuoteSubstring(
  sourceText: string,
  quote: string,
  revision?: string | number
): QuoteVerificationResult {
  if (!sourceText || !quote) {
    return { verified: false, startIndex: -1, endIndex: -1, rawStartIndex: -1, rawEndIndex: -1, revision };
  }

  const normSource = normalizeWithOffsetMap(sourceText);
  const normQuote = normalizeWithOffsetMap(quote);

  if (!normQuote.normalized) {
    return { verified: false, startIndex: -1, endIndex: -1, rawStartIndex: -1, rawEndIndex: -1, revision };
  }

  const idx = normSource.normalized.indexOf(normQuote.normalized);
  if (idx < 0) {
    return { verified: false, startIndex: -1, endIndex: -1, rawStartIndex: -1, rawEndIndex: -1, revision };
  }

  const normEnd = idx + normQuote.normalized.length;
  const rawStart = normSource.offsetMap[idx];
  const rawEnd = normSource.offsetMap[normEnd - 1] + 1;

  return {
    verified: true,
    startIndex: idx,
    endIndex: normEnd,
    rawStartIndex: rawStart,
    rawEndIndex: rawEnd,
    revision,
  };
}

/**
 * Enforces quote grounding on extracted candidates; drops unverified claims to UNKNOWN.
 */
export function enforceGroundedExtraction(
  candidate: {
    attribute?: string | null;
    proposedValue?: string | null;
    attributeQuote?: string | null;
    valueQuote?: string | null;
  },
  sourceText: string,
  registry: ConditionRegistry = defaultConditionRegistry
): {
  grounded: boolean;
  verifiedQuote: string | null;
  status: 'VALID' | 'UNKNOWN';
} {
  let verifiedQuote: string | null = null;

  if (candidate.valueQuote) {
    const check = verifyQuoteSubstring(sourceText, candidate.valueQuote);
    if (check.verified) {
      verifiedQuote = candidate.valueQuote;
    }
  }

  if (!verifiedQuote && candidate.attributeQuote) {
    const check = verifyQuoteSubstring(sourceText, candidate.attributeQuote);
    if (check.verified) {
      verifiedQuote = candidate.attributeQuote;
    }
  }

  if (!verifiedQuote) {
    return { grounded: false, verifiedQuote: null, status: 'UNKNOWN' };
  }

  const validation = registry.validateExtractedCandidate(candidate);
  if (!validation.isValid) {
    return { grounded: false, verifiedQuote: null, status: 'UNKNOWN' };
  }

  return { grounded: true, verifiedQuote, status: 'VALID' };
}

// ---------------------------------------------------------------------------
// Mechanism 4: Deterministic Set-Membership Coverage Comparator
// ---------------------------------------------------------------------------

export type CoverageOutcome =
  | 'Prospective coverage gap'
  | 'Supported within declared scope'
  | 'Unknown';

export interface CoverageEvaluationResult {
  outcome: CoverageOutcome;
  findingSentence: string;
  attribute: string;
  proposedValue: string | null;
  declaredValues: string[];
}

/**
 * Deterministic set-membership comparator: compares a proposed condition against declared baseline scope.
 * Never uses fuzzy heuristics or LLM evaluation.
 */
export function compareDeclaredScope(
  attribute: string,
  proposedValue: string | null,
  declaredConditions: Array<{ attribute_name: string; declared_value?: string; attribute_value?: string }>,
  alternativeEquivalence?: Array<{ attribute_name: string; accepted_value: string }>,
  registry: ConditionRegistry = defaultConditionRegistry
): CoverageEvaluationResult {
  const family = registry.get(attribute);

  if (!family || !proposedValue) {
    return {
      outcome: 'Unknown',
      findingSentence: `Attribute "${attribute}" or proposed value is not specified or unregistered.`,
      attribute,
      proposedValue,
      declaredValues: [],
    };
  }

  const resolvedProposed = registry.resolveAllowedValue(family.attribute, proposedValue);
  if (!resolvedProposed) {
    return {
      outcome: 'Unknown',
      findingSentence: `Proposed value "${proposedValue}" is not valid for attribute "${family.attribute}".`,
      attribute: family.attribute,
      proposedValue,
      declaredValues: [],
    };
  }

  // Filter declared scope for this attribute
  const matchingDeclared = declaredConditions.filter(
    (c) => c.attribute_name.toLowerCase() === family.attribute
  );

  const declaredValues = matchingDeclared
    .map((c) => registry.resolveAllowedValue(family.attribute, c.declared_value || c.attribute_value || ''))
    .filter((v): v is string => Boolean(v));

  if (declaredValues.length === 0) {
    return {
      outcome: 'Unknown',
      findingSentence: `Attribute "${family.attribute}" is not declared in the baseline evidence scope.`,
      attribute: family.attribute,
      proposedValue: resolvedProposed,
      declaredValues: [],
    };
  }

  // Exact or Set comparison
  let isCovered = false;
  if (family.comparisonMode === 'EXACT') {
    isCovered = declaredValues.includes(resolvedProposed);
  } else {
    isCovered = declaredValues.includes(resolvedProposed);
  }

  // Check alternative equivalence evidence if available
  if (!isCovered && alternativeEquivalence && alternativeEquivalence.length > 0) {
    const equivMatch = alternativeEquivalence.some(
      (eq) =>
        eq.attribute_name.toLowerCase() === family.attribute &&
        registry.resolveAllowedValue(family.attribute, eq.accepted_value) === resolvedProposed
    );
    if (equivMatch) {
      isCovered = true;
    }
  }

  if (isCovered) {
    return {
      outcome: 'Supported within declared scope',
      findingSentence:
        family.displayTemplates?.coveredTemplate.replace('{value}', resolvedProposed) ||
        `Proposed value "${resolvedProposed}" for "${family.attribute}" is covered by declared baseline scope.`,
      attribute: family.attribute,
      proposedValue: resolvedProposed,
      declaredValues,
    };
  }

  return {
    outcome: 'Prospective coverage gap',
    findingSentence:
      family.displayTemplates?.gapTemplate ||
      `The selected baseline does not establish coverage of the planned ${resolvedProposed} condition.`,
    attribute: family.attribute,
    proposedValue: resolvedProposed,
    declaredValues,
  };
}

// ---------------------------------------------------------------------------
// Mechanism 5: Registry-Only Identity Resolution
// ---------------------------------------------------------------------------

/**
 * Resolves an extracted location against registered operating zones.
 * Never guesses or defaults to an arbitrary zone.
 */
export function resolveEntityIdentity<T extends { name: string; id: string }>(
  locationQuery: string | null | undefined,
  registeredZones: T[]
): { resolved: boolean; zone: T | null; reason?: string } {
  if (!locationQuery || !locationQuery.trim()) {
    return { resolved: false, zone: null, reason: 'No location string specified.' };
  }

  const queryNorm = locationQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const matches = registeredZones.filter((z) => {
    const zNorm = z.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return zNorm === queryNorm || zNorm.includes(queryNorm) || queryNorm.includes(zNorm);
  });

  if (matches.length === 1) {
    return { resolved: true, zone: matches[0] };
  }

  if (matches.length > 1) {
    return {
      resolved: false,
      zone: null,
      reason: `Ambiguous location query "${locationQuery}": matches multiple zones (${matches.map((m) => m.name).join(', ')}).`,
    };
  }

  return {
    resolved: false,
    zone: null,
    reason: `Location "${locationQuery}" does not match any registered zone in accessible registry.`,
  };
}

// ---------------------------------------------------------------------------
// Mechanism 6: Action Idempotency Hashing & Three-State Reconciliation
// ---------------------------------------------------------------------------

/**
 * Generates a deterministic SHA-256 compound idempotency hash for an action.
 */
export function computeActionIdempotencyHash(
  issueKey: string,
  attribute: string,
  proposedValue: string,
  evidenceSetHash: string
): string {
  const payload = `${issueKey.trim()}::${attribute.trim().toLowerCase()}::${proposedValue.trim().toLowerCase()}::${evidenceSetHash}`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Mechanism 7: Bitemporal Evaluation & Staleness Verification
// ---------------------------------------------------------------------------

export interface BitemporalEvaluation {
  isRetroactive: boolean;
  isProspective: boolean;
  effectiveFrom: Date;
  recordedAt: Date;
  status: 'VALID' | 'OUT_OF_BOUNDS';
}

/**
 * Evaluates bitemporal timestamps distinguishing Valid Time (Physical Effective) from System Time (Recorded).
 */
export function evaluateBitemporalTimestamps(
  effectiveFrom: string | Date,
  recordedAt: string | Date = new Date()
): BitemporalEvaluation {
  const eff = new Date(effectiveFrom);
  const rec = new Date(recordedAt);

  if (isNaN(eff.getTime()) || isNaN(rec.getTime())) {
    return {
      isRetroactive: false,
      isProspective: false,
      effectiveFrom: eff,
      recordedAt: rec,
      status: 'OUT_OF_BOUNDS',
    };
  }

  const isRetroactive = eff.getTime() < rec.getTime();
  const isProspective = eff.getTime() >= rec.getTime();

  return {
    isRetroactive,
    isProspective,
    effectiveFrom: eff,
    recordedAt: rec,
    status: 'VALID',
  };
}

/**
 * Verifies whether underlying source document has drifted since prior review.
 */
export function evaluateSourceStaleness(
  reviewedVersion: string | number,
  currentVersion: string | number,
  reviewedFingerprint?: string,
  currentFingerprint?: string
): boolean {
  if (String(reviewedVersion) !== String(currentVersion)) {
    return true; // Version changed
  }

  if (reviewedFingerprint && currentFingerprint && reviewedFingerprint !== currentFingerprint) {
    return true; // Content fingerprint changed
  }

  return false;
}

