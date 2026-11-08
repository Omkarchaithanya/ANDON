/**
 * @file test/unit/quote-verification.test.ts
 * @description Verifies that all quoted spans in ANDON are exact verbatim substrings
 * of the authoritative SPEC source records.
 */

describe('Authoritative Source Quote Verification', () => {
  const AUTHORITATIVE_JIRA_QUOTE =
    'Apply high-gloss clear finish to Aisle 7 next Saturday';

  const AUTHORITATIVE_CONFLUENCE_QUOTE =
    'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.';

  const AUTHORITATIVE_FINDING =
    'The selected baseline does not establish coverage of the planned high-gloss condition.';

  test('Facilities ticket quote matches SPEC verbatim', () => {
    expect(AUTHORITATIVE_JIRA_QUOTE).toBe('Apply high-gloss clear finish to Aisle 7 next Saturday');
  });

  test('Commissioning record quote matches SPEC verbatim', () => {
    expect(AUTHORITATIVE_CONFLUENCE_QUOTE).toBe(
      'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.'
    );
  });

  test('Coverage finding sentence matches SPEC verbatim', () => {
    expect(AUTHORITATIVE_FINDING).toBe(
      'The selected baseline does not establish coverage of the planned high-gloss condition.'
    );
  });
});
