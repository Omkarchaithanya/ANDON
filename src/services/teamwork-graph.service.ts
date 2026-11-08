/**
 * @module teamwork-graph.service
 * @description Service for Atlassian Teamwork Graph API integration.
 *
 * The Teamwork Graph API provides curated GraphQL queries for discovering
 * relationships between Atlassian entities (pages, owners, spaces, etc.).
 *
 * IMPORTANT: All Teamwork Graph calls are current-user scoped. This means
 * event handlers (async events, scheduled triggers, webhooks) CANNOT use
 * this service because they lack a user context. Only resolver functions
 * invoked by a real user session should call these methods.
 */

import api from '@forge/api';
import { GraphContext } from '../models/entities';
import { ExternalApiError, ValidationError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';

/** Maximum number of linked pages returned per pagination request. */
const PAGE_SIZE = 25;

/** Maximum number of pagination rounds to prevent infinite loops. */
const MAX_PAGINATION_ROUNDS = 20;

/**
 * Represents a Confluence page linked via the Teamwork Graph.
 */
export interface LinkedPage {
  /** The Confluence page ID. */
  id: string;
  /** The page title at the time of query. */
  title: string;
}

/**
 * Represents an owner of a Confluence page as reported by Teamwork Graph.
 */
export interface PageOwner {
  /** The Atlassian account ID of the owner. */
  accountId: string;
  /** The display name of the owner. */
  displayName: string;
}

/**
 * Internal type for Teamwork Graph linked-pages response nodes.
 */
interface LinkedPagesResponseNode {
  id: string;
  title: string;
}

/**
 * Internal type for Teamwork Graph linked-pages response shape.
 */
interface LinkedPagesResponse {
  data?: {
    confluencePageLinkedConfluencePages?: {
      nodes: LinkedPagesResponseNode[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Internal type for Teamwork Graph page-owners response shape.
 */
interface PageOwnersResponse {
  data?: {
    confluencePageOwners?: {
      nodes: Array<{
        accountId: string;
        displayName: string;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Retrieves all Confluence pages linked to the given page via Teamwork Graph.
 *
 * Uses the curated query `confluencePageLinkedConfluencePages` with automatic
 * pagination (max 25 results per page). Iterates through all pages until
 * `hasNextPage` is false or the safety limit is reached.
 *
 * @param pageId - The Confluence page ID to query linked pages for.
 * @returns An array of linked page IDs and titles.
 * @throws {ValidationError} If pageId is empty or invalid.
 * @throws {ExternalApiError} If the Teamwork Graph API returns an error.
 *
 * @remarks
 * This method is current-user scoped. Do NOT call from event handlers.
 */
export async function getLinkedConfluencePages(pageId: string): Promise<LinkedPage[]> {
  if (!isNonEmptyString(pageId)) {
    throw new ValidationError('pageId must be a non-empty string');
  }

  const allLinkedPages: LinkedPage[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;
  let round = 0;

  while (hasNextPage && round < MAX_PAGINATION_ROUNDS) {
    round++;

    const afterClause = endCursor ? `, after: "${endCursor}"` : '';
    const query = `query { confluencePageLinkedConfluencePages(id: "${pageId}", first: ${PAGE_SIZE}${afterClause}) { nodes { id title } pageInfo { hasNextPage endCursor } } }`;

    let response: any;
    try {
      response = await api.asUser().requestGraph(query);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ExternalApiError(
        `Teamwork Graph request failed for linked pages of page ${pageId}: ${message}`
      );
    }

    if (!response.ok) {
      throw new ExternalApiError(
        `Teamwork Graph returned HTTP ${response.status} for linked pages of page ${pageId}`
      );
    }

    const body = (await response.json()) as LinkedPagesResponse;

    if (body.errors && body.errors.length > 0) {
      const errorMessages = body.errors.map((e) => e.message).join('; ');
      throw new ExternalApiError(
        `Teamwork Graph query errors for page ${pageId}: ${errorMessages}`
      );
    }

    const result = body.data?.confluencePageLinkedConfluencePages;
    if (!result) {
      // No linked pages found — return empty
      return allLinkedPages;
    }

    for (const node of result.nodes) {
      allLinkedPages.push({
        id: node.id,
        title: node.title,
      });
    }

    hasNextPage = result.pageInfo.hasNextPage;
    endCursor = result.pageInfo.endCursor;
  }

  return allLinkedPages;
}

/**
 * Retrieves the owners of a Confluence page via Teamwork Graph.
 *
 * Uses the curated query `confluencePageOwners` to identify who owns
 * or is responsible for the given page.
 *
 * @param pageId - The Confluence page ID to query owners for.
 * @returns An array of owner account IDs and display names.
 * @throws {ValidationError} If pageId is empty or invalid.
 * @throws {ExternalApiError} If the Teamwork Graph API returns an error.
 *
 * @remarks
 * This method is current-user scoped. Do NOT call from event handlers.
 */
export async function getPageOwners(pageId: string): Promise<PageOwner[]> {
  if (!isNonEmptyString(pageId)) {
    throw new ValidationError('pageId must be a non-empty string');
  }

  const query = `query { confluencePageOwners(id: "${pageId}") { nodes { accountId displayName } } }`;

  let response: any;
  try {
    response = await api.asUser().requestGraph(query);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(
      `Teamwork Graph request failed for owners of page ${pageId}: ${message}`
    );
  }

  if (!response.ok) {
    throw new ExternalApiError(
      `Teamwork Graph returned HTTP ${response.status} for owners of page ${pageId}`
    );
  }

  const body = (await response.json()) as PageOwnersResponse;

  if (body.errors && body.errors.length > 0) {
    const errorMessages = body.errors.map((e) => e.message).join('; ');
    throw new ExternalApiError(
      `Teamwork Graph query errors for page ${pageId} owners: ${errorMessages}`
    );
  }

  const nodes = body.data?.confluencePageOwners?.nodes;
  if (!nodes) {
    return [];
  }

  return nodes.map((node) => ({
    accountId: node.accountId,
    displayName: node.displayName,
  }));
}

/**
 * Discovers the full graph context for a site registry page.
 *
 * This is the main entry point for discovery. It combines:
 * 1. All Confluence pages linked to the site registry page
 * 2. The owners of the site registry page
 *
 * The result is a {@link GraphContext} that provides the input context
 * for downstream processing (evidence extraction, scope comparison, etc.).
 *
 * @param siteRegistryPageId - The Confluence page ID of the site registry.
 * @returns A GraphContext containing linked pages and page owners.
 * @throws {ValidationError} If siteRegistryPageId is empty or invalid.
 * @throws {ExternalApiError} If any Teamwork Graph API call fails.
 *
 * @remarks
 * This method is current-user scoped. Do NOT call from event handlers.
 *
 * @example
 * ```typescript
 * const context = await discoverGraphContext('12345678');
 * console.log(`Found ${context.linked_page_ids.length} linked pages`);
 * console.log(`Found ${context.owner_account_ids.length} owners`);
 * ```
 */
export async function discoverGraphContext(
  siteRegistryPageId: string
): Promise<GraphContext> {
  if (!isNonEmptyString(siteRegistryPageId)) {
    throw new ValidationError('siteRegistryPageId must be a non-empty string');
  }

  // Fetch linked pages and owners in parallel for efficiency
  const [linkedPages, owners] = await Promise.all([
    getLinkedConfluencePages(siteRegistryPageId),
    getPageOwners(siteRegistryPageId),
  ]);

  const graphContext: GraphContext = {
    site_page_id: siteRegistryPageId,
    linked_pages: linkedPages.map((p) => ({
      page_id: p.id,
      title: p.title,
    })),
    page_owners: owners.map((o) => ({
      page_id: siteRegistryPageId,
      owner_account_id: o.accountId,
      owner_display_name: o.displayName,
    })),
    registry_page_id: siteRegistryPageId,
    linked_page_ids: linkedPages.map((p) => p.id),
    linked_page_titles: linkedPages.map((p) => p.title),
    owner_account_ids: owners.map((o) => o.accountId),
    owner_display_names: owners.map((o) => o.displayName),
    discovered_at: new Date().toISOString(),
  };

  return graphContext;
}
