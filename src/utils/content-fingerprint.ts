/**
 * @module content-fingerprint
 * @description Utilities to calculate, normalize, and detect content changes using SHA-256 fingerprints.
 */

import * as crypto from 'crypto';

/**
 * Normalizes content string: lowercase, collapse consecutive whitespace, strip non-printable chars.
 */
export function normalizeContent(content: string): string {
  if (!content) return '';
  return content
    .toLowerCase()
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes a deterministic SHA-256 hash fingerprint of normalized content.
 */
export function computeFingerprint(content: string): string {
  const normalized = normalizeContent(content);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Checks whether new content has changed relative to an old fingerprint.
 */
export function hasContentChanged(oldFingerprint: string, newContent: string): boolean {
  if (!oldFingerprint) return true;
  const newFingerprint = computeFingerprint(newContent);
  return oldFingerprint !== newFingerprint;
}

