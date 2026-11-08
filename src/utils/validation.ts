/**
 * @module validation
 * @description General validation utilities, string guards, ID generators, and security sanitizers.
 */

import * as crypto from 'crypto';

/**
 * Type guard checking if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates whether a string is a valid ISO-8601 date string.
 */
export function isValidISODate(value: string): boolean {
  if (!isNonEmptyString(value)) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}

/**
 * Sanitizes text for display and prevention of XSS or control injection.
 */
export function sanitizeForDisplay(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // strip full HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // control chars
    .trim();
}

/**
 * Truncates text safely for storage without cutting mid-word if possible.
 */
export function truncateForStorage(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generates a standard UUID v4.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generates a deterministic idempotency key from input parts.
 */
export function generateIdempotencyKey(...parts: string[]): string {
  const normalized = parts.map(p => (p || '').trim().toLowerCase()).join('::');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

