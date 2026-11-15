import { adfToPlainText } from '../../src/utils/adf';

describe('adfToPlainText', () => {
  it('handles null, undefined, and empty string gracefully', () => {
    expect(adfToPlainText(null)).toBe('');
    expect(adfToPlainText(undefined)).toBe('');
    expect(adfToPlainText('')).toBe('');
    expect(adfToPlainText('   ')).toBe('');
  });

  it('preserves and trims plain text strings', () => {
    expect(adfToPlainText('Surface treatment planned for hallway.')).toBe(
      'Surface treatment planned for hallway.'
    );
    expect(adfToPlainText('  Resurfacing logistics corridor   ')).toBe(
      'Resurfacing logistics corridor'
    );
  });

  it('converts a standard Jira ADF paragraph into plain text', () => {
    const adfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Apply high-gloss clear finish to warehouse floor.',
            },
          ],
        },
      ],
    };

    expect(adfToPlainText(adfDoc)).toBe('Apply high-gloss clear finish to warehouse floor.');
  });

  it('converts multi-paragraph ADF with headings, lists, and hard breaks', () => {
    const adfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Facility Work Notice' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Floor treatment line 1.' },
            { type: 'hardBreak' },
            { type: 'text', text: 'Floor treatment line 2.' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Epoxy coating' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Curing window: 48 hours' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = adfToPlainText(adfDoc);
    expect(result).toContain('Facility Work Notice');
    expect(result).toContain('Floor treatment line 1.\nFloor treatment line 2.');
    expect(result).toContain('Epoxy coating');
    expect(result).toContain('Curing window: 48 hours');
  });

  it('handles ADF mentions', () => {
    const adfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Assigned to ' },
            { type: 'mention', attrs: { id: 'qm:lead-robotics-eng', text: '@Lead Robotics Engineer' } },
          ],
        },
      ],
    };

    expect(adfToPlainText(adfDoc)).toBe('Assigned to @Lead Robotics Engineer');
  });
});
