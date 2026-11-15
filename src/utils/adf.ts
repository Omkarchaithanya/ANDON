/**
 * @file adf.ts
 * @description Atlassian Document Format (ADF) to plain text converter.
 * Converts structured Jira v3 ADF descriptions into clean, unformatted plain text.
 */

export function adfToPlainText(doc: any): string {
  if (doc === null || doc === undefined) {
    return '';
  }

  if (typeof doc === 'string') {
    return doc.trim();
  }

  if (typeof doc !== 'object') {
    return String(doc).trim();
  }

  // Direct text node
  if (typeof doc.text === 'string') {
    return doc.text;
  }

  if (doc.type === 'hardBreak') {
    return '\n';
  }

  if (doc.type === 'mention') {
    return doc.attrs?.text || doc.attrs?.id || '';
  }

  // Nodes with content array
  if (Array.isArray(doc.content)) {
    const isInlineContainer = doc.type === 'paragraph' || doc.type === 'heading';
    const separator = isInlineContainer ? '' : '\n';

    const childTexts = doc.content
      .map((child: any) => adfToPlainText(child))
      .filter((t: string) => t.length > 0);

    return childTexts
      .join(separator)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return '';
}
