/**
 * @file scripts/verify-backend.ts
 * @description Live end-to-end verification script proving that the ANDON backend
 * algorithms, deterministic comparison engine, quote verifier, and SHA-256
 * fingerprinting are 100% real, functional, and executing in Node.js.
 */

import { evaluateCoverage, ProposedCondition } from '../src/services/scope-comparison.service';
import { verifyExactQuote } from '../src/utils/quote-verifier';
import { findSpanByQuote } from '../src/utils/source-span';
import { computeFingerprint, hasContentChanged } from '../src/utils/content-fingerprint';
import { DeclaredScope } from '../src/models/entities';
import { CoverageResult } from '../src/models/enums';

async function runLiveBackendVerification() {
  console.log('======================================================================');
  console.log('🚀 ANDON BACKEND LIVE EXECUTION & DETERMINISTIC ENGINE VERIFICATION');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: Real Ticket Intake & NFKC Quote Grounding
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Real Ticket Text & Exact NFKC Substring Grounding ---');
  const realJiraTicketDescription =
    'Facilities work order: Floor team will apply high-gloss clear finish to Aisle 7 next Saturday morning.';
  const extractedQuote = 'apply high-gloss clear finish to Aisle 7 next Saturday';

  console.log('Input Jira Ticket:\n  "', realJiraTicketDescription, '"');
  console.log('Extracted Candidate Quote:\n  "', extractedQuote, '"');

  const quoteVerification = verifyExactQuote(realJiraTicketDescription, extractedQuote);
  console.log('NFKC Substring Verification Result:', quoteVerification);
  if (!quoteVerification.verified) {
    throw new Error('FAILED: Quote failed NFKC verification!');
  }
  const span = findSpanByQuote(realJiraTicketDescription, extractedQuote);
  console.log(`✓ Quote verified at span indices [${span?.start}..${span?.end}]\n`);

  // -------------------------------------------------------------------------
  // Test 2: Deterministic Scope Comparison Engine (PROSPECTIVE GAP)
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Deterministic Coverage Evaluation (High-Gloss vs Matte Epoxy) ---');
  const declaredCommissioningScope: DeclaredScope = {
    conditions: [
      {
        attribute_name: 'surface_finish',
        declared_value: 'matte_epoxy',
      },
    ],
  };

  const proposedConditionGap: ProposedCondition = {
    attribute_name: 'surface_finish',
    proposed_value: 'high_gloss_clear_finish',
  };

  console.log('Declared Baseline Scope:', JSON.stringify(declaredCommissioningScope, null, 2));
  console.log('Proposed Condition:', JSON.stringify(proposedConditionGap, null, 2));

  const gapEvaluation = evaluateCoverage(proposedConditionGap, declaredCommissioningScope);
  console.log('\nEngine Coverage Result:', gapEvaluation.result);
  console.log('Engine Authoritative Finding Sentence:');
  console.log('  "', gapEvaluation.explanation, '"');

  if (gapEvaluation.result !== CoverageResult.GAP) {
    throw new Error(`Expected GAP, got ${gapEvaluation.result}`);
  }
  if (
    gapEvaluation.explanation !==
    'The selected baseline does not establish coverage of the planned high-gloss condition.'
  ) {
    throw new Error('Finding sentence did not match SPEC verbatim standard!');
  }
  console.log('✓ PASS: Deterministic comparison detected prospective gap without hallucination.\n');

  // -------------------------------------------------------------------------
  // Test 3: Deterministic Scope Comparison Engine (COVERED)
  // -------------------------------------------------------------------------
  console.log('--- TEST 3: Deterministic Coverage Evaluation (Matte Epoxy vs Matte Epoxy) ---');
  const proposedConditionCovered: ProposedCondition = {
    attribute_name: 'surface_finish',
    proposed_value: 'matte_epoxy',
  };
  const coveredEvaluation = evaluateCoverage(proposedConditionCovered, declaredCommissioningScope);
  console.log('Proposed Condition:', proposedConditionCovered.proposed_value);
  console.log('Engine Coverage Result:', coveredEvaluation.result);
  console.log('Engine Finding Sentence:\n  "', coveredEvaluation.explanation, '"');
  if (coveredEvaluation.result !== CoverageResult.COVERED) {
    throw new Error(`Expected COVERED, got ${coveredEvaluation.result}`);
  }
  console.log('✓ PASS: Deterministic comparison confirmed coverage for matching baseline.\n');

  // -------------------------------------------------------------------------
  // Test 4: Missing / Undeclared Attribute (Honest UNKNOWN)
  // -------------------------------------------------------------------------
  console.log('--- TEST 4: Undeclared Attribute Evaluates to Fail-Closed UNKNOWN ---');
  const undeclaredCondition: ProposedCondition = {
    attribute_name: 'ambient_illuminance_lux',
    proposed_value: '1500_lux',
  };
  const unknownEvaluation = evaluateCoverage(undeclaredCondition, declaredCommissioningScope);
  console.log('Undeclared Attribute:', undeclaredCondition.attribute_name);
  console.log('Engine Coverage Result:', unknownEvaluation.result);
  console.log('Engine Finding Sentence:\n  "', unknownEvaluation.explanation, '"');
  if (unknownEvaluation.result !== CoverageResult.UNKNOWN) {
    throw new Error(`Expected UNKNOWN, got ${unknownEvaluation.result}`);
  }
  console.log('✓ PASS: Undeclared attribute fail-closed to UNKNOWN (not unaffected).\n');

  // -------------------------------------------------------------------------
  // Test 5: Cryptographic SHA-256 Content Fingerprinting & Staleness Detection
  // -------------------------------------------------------------------------
  console.log('--- TEST 5: Cryptographic SHA-256 Fingerprinting & Staleness Detection ---');
  const originalText = 'Apply high-gloss clear finish to Aisle 7 next Saturday';
  const originalHash = computeFingerprint(originalText);
  console.log('Original Text:\n  "', originalText, '"');
  console.log('Generated SHA-256 Fingerprint:\n  ', originalHash);

  const identicalTextWithWhitespace = '  Apply  high-gloss   clear finish to Aisle 7 next Saturday\n';
  const whitespaceHash = computeFingerprint(identicalTextWithWhitespace);
  console.log('Whitespace Normalized Hash:\n  ', whitespaceHash);
  if (originalHash !== whitespaceHash) {
    throw new Error('Fingerprint hash should be invariant under whitespace normalization!');
  }
  console.log('✓ Invariant verified: Trivial whitespace does not alter fingerprint.');

  const modifiedText = 'Apply high-gloss clear finish to Aisle 7 next SUNDAY';
  const modifiedHash = computeFingerprint(modifiedText);
  console.log('Modified Ticket Text:\n  "', modifiedText, '"');
  console.log('Modified SHA-256 Fingerprint:\n  ', modifiedHash);

  const changed = hasContentChanged(originalHash, modifiedText);
  console.log('Has Content Changed Detection:', changed);
  if (!changed) {
    throw new Error('Staleness detection failed to recognize ticket modification!');
  }
  console.log('✓ PASS: Cryptographic staleness detection verified.\n');

  console.log('======================================================================');
  console.log('🎉 ALL BACKEND ALGORITHMS AND INVARIANTS VERIFIED 100% OPERATIONAL');
  console.log('======================================================================');
}

runLiveBackendVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
