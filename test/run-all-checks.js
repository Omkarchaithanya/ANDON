/**
 * @file test/run-all-checks.js
 * @description Standalone Invariant & Property Check Runner for ANDON's 7 Generic Mechanisms.
 */

const {
  ConditionRegistry,
  defaultConditionRegistry,
} = require('../src/domain/condition-registry');
const {
  normalizeWithOffsetMap,
  verifyQuoteSubstring,
  compareDeclaredScope,
  resolveEntityIdentity,
  computeActionIdempotencyHash,
  evaluateBitemporalTimestamps,
  evaluateSourceStaleness,
} = require('../src/domain/mechanisms');

function runAllChecks() {
  console.log('======================================================================');
  console.log('🛡️ ANDON GENERIC MECHANISM INVARIANT PROPERTY RUNNER');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      process.exit(1);
    }
  }

  // Check 1: Declarative Condition Registry Registration
  const customReg = new ConditionRegistry();
  customReg.register({
    attribute: 'floor_vibration_class',
    label: 'Floor Vibration Isolation',
    description: 'Vibration velocity RMS limits for sensitive metrology/robotics.',
    allowedValues: ['class_vc_a', 'class_vc_b'],
    comparisonMode: 'EXACT',
  });
  assert(customReg.get('floor_vibration_class') !== undefined, 'Registry accepts new condition family dynamically');
  assert(customReg.resolveAllowedValue('floor_vibration_class', 'class_vc_a') === 'class_vc_a', 'Registry resolves allowed value');

  // Check 2: Parametrized Extraction Prompt & Schema Validation
  const prompt = defaultConditionRegistry.buildParametrizedExtractionPrompt();
  assert(prompt.includes('surface_finish'), 'Parametrized prompt lists surface_finish family');
  assert(prompt.includes('lighting_configuration'), 'Parametrized prompt lists lighting_configuration family');

  // Check 3: NFKC Substring Grounding with Monotonic Offsets
  const source = 'Facility notice: Apply\u00A0high-gloss clear finish to Aisle 7 next Saturday.';
  const quote = 'Apply high-gloss clear finish to Aisle 7';
  const quoteCheck = verifyQuoteSubstring(source, quote);
  assert(quoteCheck.verified === true, 'NFKC quote grounding verifies exact normalized substring');
  assert(quoteCheck.rawStartIndex >= 0 && quoteCheck.rawEndIndex > quoteCheck.rawStartIndex, 'Offset map projects back to raw string');

  // Check 4: Deterministic Comparator - GAP
  const gapRes = compareDeclaredScope(
    'surface_finish',
    'high_gloss_clear_finish',
    [{ attribute_name: 'surface_finish', declared_value: 'matte_epoxy' }]
  );
  assert(gapRes.outcome === 'Prospective coverage gap', 'Deterministic comparator yields Prospective coverage gap for differing value');

  // Check 5: Deterministic Comparator - COVERED
  const covRes = compareDeclaredScope(
    'surface_finish',
    'matte_epoxy',
    [{ attribute_name: 'surface_finish', declared_value: 'matte_epoxy' }]
  );
  assert(covRes.outcome === 'Supported within declared scope', 'Deterministic comparator yields Supported within declared scope for matching value');

  // Check 6: Deterministic Comparator - UNKNOWN on undeclared attribute
  const unkRes = compareDeclaredScope(
    'ambient_temperature',
    'room_temp',
    [{ attribute_name: 'surface_finish', declared_value: 'matte_epoxy' }]
  );
  assert(unkRes.outcome === 'Unknown', 'Comparator fails closed to Unknown on unregistered or undeclared attribute');

  // Check 7: Registry-Only Identity Resolution
  const zones = [{ id: 'z1', name: 'Aisle 7' }, { id: 'z2', name: 'Bay 4' }];
  const match = resolveEntityIdentity('Aisle 7', zones);
  assert(match.resolved === true && match.zone.id === 'z1', 'Entity identity resolves registered zone strictly');

  // Check 8: Ambiguity Handling in Identity Resolution
  const dupZones = [{ id: 'z1', name: 'Aisle 7' }, { id: 'z2', name: 'Aisle 8' }];
  const ambMatch = resolveEntityIdentity('Aisle', dupZones);
  assert(ambMatch.resolved === false && ambMatch.zone === null, 'Ambiguous location fails closed without guessing');

  // Check 9: Action Idempotency Hashing
  const hash1 = computeActionIdempotencyHash('ISS-1', 'surface_finish', 'high_gloss_clear_finish', 'ev1');
  const hash2 = computeActionIdempotencyHash('ISS-1', 'surface_finish', 'high_gloss_clear_finish', 'ev1');
  assert(hash1 === hash2 && hash1.length === 64, 'Action idempotency hash is deterministic SHA-256');

  // Check 10: Bitemporal Timestamp & Staleness Evaluation
  const timeEval = evaluateBitemporalTimestamps(new Date(Date.now() + 100000));
  assert(timeEval.isProspective === true, 'Bitemporal evaluator accurately classifies prospective time');
  assert(evaluateSourceStaleness(1, 2) === true, 'Staleness evaluator detects source revision drift');

  console.log('\n----------------------------------------------------------------------');
  console.log(`All Invariant Property Checks Passed: ${passed}/${total} (100%)`);
  console.log('======================================================================\n');
}

if (require.main === module) {
  runAllChecks();
}

module.exports = { runAllChecks };

