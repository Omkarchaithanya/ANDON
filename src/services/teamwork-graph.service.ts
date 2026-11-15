/**
 * @module teamwork-graph.service
 * @description Service for Atlassian Teamwork Graph API integration.
 *
 * Uses curated GraphQL operations with GraphQL variables and ARI formatting.
 * Calls api.asUser().requestTeamworkGraph.
 *
 * All Teamwork Graph calls are current-user scoped and require context.cloudId.
 */

import api from '@forge/api';
import { GraphContext } from '../models/entities';
import { ExternalApiError, ValidationError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';

/** Maximum number of linked pages returned per pagination request. */
const PAGE_SIZE = 25;

/** Maximum number of pagination rounds to prevent infinite loops. */
const MAX_PAGINATION_ROUNDS = 20;

export interface LinkedPage {
  id: string;
  title: string;
}

export interface PageOwner {
  accountId: string;
  displayName: string;
}

/**
 * Builds a Confluence Page ARI. Requires cloudId from invocation context.
 */
export function buildConfluencePageAri(pageIdOrAri: string, cloudId?: string): string {
  if (pageIdOrAri.startsWith('ari:cloud:confluence:')) {
    return pageIdOrAri;
  }
  if (!cloudId) {
    throw new ValidationError('Teamwork Graph queries require a valid cloudId from invocation context');
  }
  return `ari:cloud:confluence:${cloudId}:page/${pageIdOrAri}`;
}

const LINKED_PAGES_QUERY = `
  query ANDON_linkedPages($id: ID!, $first: Int!, $after: String) {
    confluencePageLinkedConfluencePages(id: $id, first: $first, after: $after) {
      edges {
        node {
          ... on ConfluencePage {
            id
            title
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PAGE_OWNERS_QUERY = `
  query ANDON_pageOwners($id: ID!) {
    confluencePageOwners(id: $id) {
      edges {
        node {
          ... on User {
            accountId
            displayName
          }
        }
      }
    }
  }
`;

async function executeGraphQuery(query: string, variables: Record<string, unknown>): Promise<any> {
  const userApi = api.asUser() as any;

  if (typeof userApi.requestTeamworkGraph !== 'function') {
    throw new ExternalApiError('Teamwork Graph API is not available on api.asUser()');
  }

  return userApi.requestTeamworkGraph(query, variables);
}

/**
 * Retrieves all Confluence pages linked to the given page via Teamwork Graph.
 */
export async function getLinkedConfluencePages(
  pageIdOrAri: string,
  cloudId?: string
): Promise<LinkedPage[]> {
  if (!isNonEmptyString(pageIdOrAri)) {
    throw new ValidationError('pageId must be a non-empty string');
  }

  const ari = buildConfluencePageAri(pageIdOrAri, cloudId);
  const allLinkedPages: LinkedPage[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;
  let round = 0;

  while (hasNextPage && round < MAX_PAGINATION_ROUNDS) {
    round++;

    let response: any;
    try {
      response = await executeGraphQuery(LINKED_PAGES_QUERY, {
        id: ari,
        first: PAGE_SIZE,
        after: endCursor,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ExternalApiError(
        `Teamwork Graph request failed for linked pages of ${pageIdOrAri}: ${message}`
      );
    }

    if (!response.ok) {
      throw new ExternalApiError(
        `Teamwork Graph returned HTTP ${response.status} for linked pages of ${pageIdOrAri}`
      );
    }

    const body = await response.json();

    if (body.errors && body.errors.length > 0) {
      const errorMessages = body.errors.map((e: any) => e.message).join('; ');
      throw new ExternalApiError(
        `Teamwork Graph query errors for ${pageIdOrAri}: ${errorMessages}`
      );
    }

    const result = body.data?.confluencePageLinkedConfluencePages;
    if (!result) {
      return allLinkedPages;
    }

    if (Array.isArray(result.edges)) {
      for (const edge of result.edges) {
        if (edge?.node?.id) {
          allLinkedPages.push({
            id: edge.node.id,
            title: edge.node.title || 'Untitled',
          });
        }
      }
    }

    hasNextPage = Boolean(result.pageInfo?.hasNextPage);
    endCursor = result.pageInfo?.endCursor || null;
  }

  return allLinkedPages;
}

/**
 * Retrieves the owners of a Confluence page via Teamwork Graph.
 */
export async function getPageOwners(pageIdOrAri: string, cloudId?: string): Promise<PageOwner[]> {
  if (!isNonEmptyString(pageIdOrAri)) {
    throw new ValidationError('pageId must be a non-empty string');
  }

  const ari = buildConfluencePageAri(pageIdOrAri, cloudId);

  let response: any;
  try {
    response = await executeGraphQuery(PAGE_OWNERS_QUERY, { id: ari });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(
      `Teamwork Graph request failed for owners of ${pageIdOrAri}: ${message}`
    );
  }

  if (!response.ok) {
    throw new ExternalApiError(
      `Teamwork Graph returned HTTP ${response.status} for owners of ${pageIdOrAri}`
    );
  }

  const body = await response.json();

  if (body.errors && body.errors.length > 0) {
    const errorMessages = body.errors.map((e: any) => e.message).join('; ');
    throw new ExternalApiError(
      `Teamwork Graph query errors for ${pageIdOrAri}: ${errorMessages}`
    );
  }

  const result = body.data?.confluencePageOwners;
  const owners: PageOwner[] = [];

  if (result && Array.isArray(result.edges)) {
    for (const edge of result.edges) {
      if (edge?.node?.accountId) {
        owners.push({
          accountId: edge.node.accountId,
          displayName: edge.node.displayName || 'Confluence User',
        });
      }
    }
  }

  return owners;
}

/**
 * Convenience method combining linked pages and page owners discovery for a root page.
 */
export async function discoverGraphContext(rootPageId: string, cloudId?: string): Promise<GraphContext> {
  const linked = await getLinkedConfluencePages(rootPageId, cloudId);
  const owners = await getPageOwners(rootPageId, cloudId);

  return {
    site_page_id: rootPageId,
    registry_page_id: rootPageId,
    linked_pages: linked.map((p) => ({ page_id: p.id, title: p.title })),
    page_owners: owners.map((o) => ({
      page_id: rootPageId,
      owner_account_id: o.accountId,
      owner_display_name: o.displayName,
    })),
    linked_page_ids: linked.map((p) => p.id),
    linked_page_titles: linked.map((p) => p.title),
    owner_account_ids: owners.map((o) => o.accountId),
    owner_display_names: owners.map((o) => o.displayName),
    discovered_at: new Date().toISOString(),
  };
}
