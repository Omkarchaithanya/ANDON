/**
 * @module confluence.service
 * @description Service for Confluence REST API v2 integration.
 *
 * Provides methods to fetch Confluence page content, versions, and body text.
 * Uses Forge API's `route` tagged template for safe URL construction and
 * `api.asUser()` for user-scoped requests.
 */

import api, { route } from '@forge/api';
import { ExternalApiError, NotFoundError, ValidationError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';

/**
 * Represents a Confluence page as returned by the REST API v2.
 */
export interface ConfluencePage {
  /** The Confluence page ID. */
  id: string;
  /** The page title. */
  title: string;
  /** The page status (e.g., 'current', 'trashed'). */
  status: string;
  /** The current version number. */
  version: number;
  /** The page body in storage format (XML/HTML). */
  bodyStorage: string;
  /** The space ID the page belongs to. */
  spaceId: string;
}

/**
 * Internal type for the Confluence REST API v2 page response.
 */
interface ConfluencePageApiResponse {
  id: string;
  title: string;
  status: string;
  spaceId?: string;
  version?: {
    number: number;
    message?: string;
    createdAt?: string;
  };
  body?: {
    storage?: {
      value: string;
      representation: string;
    };
  };
}

/**
 * Internal type for the Confluence REST API v2 version response.
 */
interface ConfluenceVersionApiResponse {
  number: number;
  message?: string;
  createdAt?: string;
}

/**
 * Fetches a Confluence page including content, title, version, and body.
 *
 * Uses the Confluence REST API v2 with `body-format=storage` to retrieve
 * the full storage-format body alongside metadata.
 *
 * @param pageId - The Confluence page ID.
 * @returns A ConfluencePage object with all fields populated.
 * @throws {ValidationError} If pageId is empty or invalid.
 * @throws {NotFoundError} If the page does not exist (HTTP 404).
 * @throws {ExternalApiError} If the API returns an unexpected error.
 */
export async function getPage(pageId: string): Promise<ConfluencePage> {
  if (!isNonEmptyString(pageId)) {
    throw new ValidationError('pageId must be a non-empty string');
  }

  let response: any;
  try {
    response = await api
      .asUser()
      .requestConfluence(route`/wiki/api/v2/pages/${pageId}?body-format=storage`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(`Failed to fetch Confluence page ${pageId}: ${message}`);
  }

  if (response.status === 404) {
    throw new NotFoundError(`Confluence page ${pageId} not found`);
  }

  if (!response.ok) {
    throw new ExternalApiError(
      `Confluence API returned HTTP ${response.status} for page ${pageId}`
    );
  }

  const data = (await response.json()) as ConfluencePageApiResponse;

  return {
    id: data.id,
    title: data.title,
    status: data.status,
    version: data.version?.number ?? 0,
    bodyStorage: data.body?.storage?.value ?? '',
    spaceId: data.spaceId ?? '',
  };
}

/**
 * Fetches the current version number and optional version message for a page.
 *
 * @param pageId - The Confluence page ID.
 * @returns An object with the version number and message.
 * @throws {ValidationError} If pageId is empty or invalid.
 * @throws {NotFoundError} If the page does not exist.
 * @throws {ExternalApiError} If the API returns an unexpected error.
 */
export async function getPageVersion(
  pageId: string
): Promise<{ version: number; message: string }> {
  if (!isNonEmptyString(pageId)) {
    throw new ValidationError('pageId must be a non-empty string');
  }

  let response: any;
  try {
    response = await api
      .asUser()
      .requestConfluence(route`/wiki/api/v2/pages/${pageId}/versions?limit=1&sort=-modified-date`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(
      `Failed to fetch version for Confluence page ${pageId}: ${message}`
    );
  }

  if (response.status === 404) {
    throw new NotFoundError(`Confluence page ${pageId} not found`);
  }

  if (!response.ok) {
    throw new ExternalApiError(
      `Confluence API returned HTTP ${response.status} for page ${pageId} versions`
    );
  }

  const body = (await response.json()) as { results: ConfluenceVersionApiResponse[] };

  if (!body.results || body.results.length === 0) {
    throw new ExternalApiError(
      `No version information returned for Confluence page ${pageId}`
    );
  }

  const latest = body.results[0];
  return {
    version: latest.number,
    message: latest.message ?? '',
  };
}

/**
 * Fetches the plain-text body content of a Confluence page.
 *
 * Retrieves the storage-format body and strips all XML/HTML markup
 * to produce clean plain text suitable for LLM processing.
 *
 * @param pageId - The Confluence page ID.
 * @returns The plain-text content of the page body.
 * @throws {ValidationError} If pageId is empty or invalid.
 * @throws {NotFoundError} If the page does not exist.
 * @throws {ExternalApiError} If the API returns an unexpected error.
 */
export async function getPageBody(pageId: string): Promise<string> {
  const page = await getPage(pageId);
  return extractPlainText(page.bodyStorage);
}

/**
 * Strips Confluence storage format XML to plain text.
 *
 * Removes all XML/HTML tags, decodes common HTML entities, normalises
 * whitespace, and trims the result. This produces clean text suitable
 * for feeding into the LLM extraction pipeline.
 *
 * Handles common Confluence storage format elements:
 * - `<ac:structured-macro>` and other `ac:` prefixed elements
 * - `<ri:*>` resource identifier elements
 * - Standard HTML elements (`<p>`, `<table>`, `<li>`, etc.)
 * - CDATA sections
 * - HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&nbsp;`, `&#...;`)
 *
 * @param storageBody - The raw Confluence storage format XML string.
 * @returns Cleaned plain text with tags stripped and entities decoded.
 */
export function extractPlainText(storageBody: string): string {
  if (!storageBody) {
    return '';
  }

  let text = storageBody;

  // Remove CDATA sections but keep their content
  text = text.replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');

  // Replace block-level elements with newlines for readability
  text = text.replace(/<\/(p|div|tr|li|h[1-6]|table|thead|tbody|blockquote)>/gi, '\n');
  text = text.replace(/<(br|hr)\s*\/?>/gi, '\n');

  // Replace list items with a dash prefix for readability
  text = text.replace(/<li[^>]*>/gi, '- ');

  // Remove all remaining XML/HTML tags (including ac: and ri: namespaced tags)
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');

  // Decode numeric HTML entities (decimal and hex)
  text = text.replace(/&#(\d+);/g, (_match, code: string) =>
    String.fromCharCode(parseInt(code, 10))
  );
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  // Normalise whitespace: collapse runs of spaces/tabs (but preserve newlines)
  text = text.replace(/[^\S\n]+/g, ' ');

  // Collapse multiple consecutive blank lines into at most two newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim each line individually and remove leading/trailing whitespace
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();

  return text;
}

/**
 * Fetches a Confluence page and returns its content, version, and title
 * in a single combined response.
 *
 * This is a convenience method that avoids multiple API calls when you
 * need both the plain-text content and version metadata.
 *
 * @param pageId - The Confluence page ID.
 * @returns An object with the plain-text content, version number, and title.
 * @throws {ValidationError} If pageId is empty or invalid.
 * @throws {NotFoundError} If the page does not exist.
 * @throws {ExternalApiError} If the API returns an unexpected error.
 *
 * @example
 * ```typescript
 * const { content, version, title } = await getPageWithVersion('12345678');
 * console.log(`Page "${title}" v${version}: ${content.length} chars`);
 * ```
 */
export async function getPageWithVersion(
  pageId: string
): Promise<{ content: string; version: number; title: string }> {
  const page = await getPage(pageId);
  const plainText = extractPlainText(page.bodyStorage);

  return {
    content: plainText,
    version: page.version,
    title: page.title,
  };
}
