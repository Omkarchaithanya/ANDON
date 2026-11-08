/**
 * @module jira.service
 * @description Service for Jira REST API v3 integration.
 *
 * Provides methods for reading and creating Jira issues, querying change
 * history, running JQL searches, and managing entity properties used by
 * ANDON to store metadata on issues.
 */

import api, { route } from '@forge/api';
import {
  ExternalApiError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Represents a Jira issue as returned by the REST API v3.
 */
export interface JiraIssue {
  /** The issue ID. */
  id: string;
  /** The issue key (e.g., "PROJ-123"). */
  key: string;
  /** The URL to the issue in the Jira UI. */
  self: string;
  /** Issue fields. */
  fields: JiraIssueFields;
}

/**
 * Core fields of a Jira issue.
 */
export interface JiraIssueFields {
  summary: string;
  description: string | null;
  status: {
    name: string;
    id: string;
    statusCategory: {
      key: string;
      name: string;
    };
  };
  issuetype: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    key: string;
    name: string;
  };
  created: string;
  updated: string;
  creator: {
    accountId: string;
    displayName: string;
  };
  assignee: {
    accountId: string;
    displayName: string;
  } | null;
  /** Any additional / custom fields returned by the API. */
  [key: string]: unknown;
}

/**
 * Represents a single entry in a Jira issue's change history.
 */
export interface ChangelogEntry {
  /** Unique ID of this changelog record. */
  id: string;
  /** Who made the change. */
  author: {
    accountId: string;
    displayName: string;
  };
  /** ISO-8601 timestamp of the change. */
  created: string;
  /** Individual field changes within this history entry. */
  items: Array<{
    field: string;
    fieldtype: string;
    fromString: string | null;
    toString: string | null;
  }>;
}

/**
 * Parameters for creating a new Jira issue.
 */
export interface CreateIssueParams {
  /** The project key (e.g., "PROJ"). */
  projectKey: string;
  /** The issue summary / title. */
  summary: string;
  /** The issue description (Atlassian Document Format JSON string or plain text). */
  description: string;
  /** The issue type name (e.g., "Task", "Story"). */
  issueTypeName: string;
  /** Optional additional fields to set. */
  additionalFields?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal response types
// ---------------------------------------------------------------------------

interface JiraSearchApiResponse {
  issues: Array<{
    id: string;
    key: string;
    self: string;
    fields: JiraIssueFields;
  }>;
  total: number;
  maxResults: number;
  startAt: number;
}

interface JiraChangelogApiResponse {
  values: Array<{
    id: string;
    author: {
      accountId: string;
      displayName: string;
    };
    created: string;
    items: Array<{
      field: string;
      fieldtype: string;
      fromString: string | null;
      toString: string | null;
    }>;
  }>;
  maxResults: number;
  total: number;
  startAt: number;
  isLast: boolean;
}

interface JiraCreateIssueApiResponse {
  id: string;
  key: string;
  self: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches a single Jira issue by ID or key.
 *
 * Retrieves core fields including summary, description, status, issue type,
 * project, creator, assignee, and timestamps.
 *
 * @param issueIdOrKey - The Jira issue ID or key (e.g., "PROJ-123").
 * @returns The issue data.
 * @throws {ValidationError} If issueIdOrKey is empty.
 * @throws {NotFoundError} If the issue does not exist (HTTP 404).
 * @throws {ExternalApiError} If the Jira API returns an unexpected error.
 */
export async function getIssue(issueIdOrKey: string): Promise<JiraIssue> {
  if (!isNonEmptyString(issueIdOrKey)) {
    throw new ValidationError('issueIdOrKey must be a non-empty string');
  }

  let response: any;
  try {
    response = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/issue/${issueIdOrKey}?fields=summary,description,status,issuetype,project,created,updated,creator,assignee`
      );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(`Failed to fetch Jira issue ${issueIdOrKey}: ${message}`);
  }

  if (response.status === 404) {
    throw new NotFoundError(`Jira issue ${issueIdOrKey} not found`);
  }

  if (!response.ok) {
    throw new ExternalApiError(
      `Jira API returned HTTP ${response.status} for issue ${issueIdOrKey}`
    );
  }

  const data = (await response.json()) as {
    id: string;
    key: string;
    self: string;
    fields: JiraIssueFields;
  };

  return {
    id: data.id,
    key: data.key,
    self: data.self,
    fields: data.fields,
  };
}

/**
 * Fetches the full change history (changelog) of a Jira issue.
 *
 * Handles pagination automatically, collecting all changelog entries.
 *
 * @param issueIdOrKey - The Jira issue ID or key.
 * @returns An array of changelog entries, ordered oldest-first.
 * @throws {ValidationError} If issueIdOrKey is empty.
 * @throws {NotFoundError} If the issue does not exist.
 * @throws {ExternalApiError} If the Jira API returns an unexpected error.
 */
export async function getIssueChangelog(
  issueIdOrKey: string
): Promise<ChangelogEntry[]> {
  if (!isNonEmptyString(issueIdOrKey)) {
    throw new ValidationError('issueIdOrKey must be a non-empty string');
  }

  const allEntries: ChangelogEntry[] = [];
  let startAt = 0;
  const maxResults = 100;
  let isLast = false;

  while (!isLast) {
    let response: any;
    try {
      response = await api
        .asUser()
        .requestJira(
          route`/rest/api/3/issue/${issueIdOrKey}/changelog?startAt=${startAt}&maxResults=${maxResults}`
        );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ExternalApiError(
        `Failed to fetch changelog for ${issueIdOrKey}: ${message}`
      );
    }

    if (response.status === 404) {
      throw new NotFoundError(`Jira issue ${issueIdOrKey} not found`);
    }

    if (!response.ok) {
      throw new ExternalApiError(
        `Jira API returned HTTP ${response.status} for changelog of ${issueIdOrKey}`
      );
    }

    const data = (await response.json()) as JiraChangelogApiResponse;

    for (const entry of data.values) {
      allEntries.push({
        id: entry.id,
        author: {
          accountId: entry.author.accountId,
          displayName: entry.author.displayName,
        },
        created: entry.created,
        items: entry.items.map((item) => ({
          field: item.field,
          fieldtype: item.fieldtype,
          fromString: item.fromString,
          toString: item.toString,
        })),
      });
    }

    isLast = data.isLast;
    startAt += data.maxResults;
  }

  return allEntries;
}

/**
 * Creates a new Jira issue (e.g., a follow-up action item).
 *
 * @param params - The issue creation parameters.
 * @returns The created issue's ID and key.
 * @throws {ValidationError} If required parameters are missing.
 * @throws {ExternalApiError} If the Jira API returns an error.
 */
export async function createIssue(
  params: CreateIssueParams
): Promise<{ id: string; key: string }> {
  if (!isNonEmptyString(params.projectKey)) {
    throw new ValidationError('projectKey must be a non-empty string');
  }
  if (!isNonEmptyString(params.summary)) {
    throw new ValidationError('summary must be a non-empty string');
  }
  if (!isNonEmptyString(params.issueTypeName)) {
    throw new ValidationError('issueTypeName must be a non-empty string');
  }

  const requestBody: Record<string, unknown> = {
    fields: {
      project: { key: params.projectKey },
      summary: params.summary,
      description: buildAdfDescription(params.description),
      issuetype: { name: params.issueTypeName },
      ...(params.additionalFields ?? {}),
    },
  };

  let response: any;
  try {
    response = await api.asUser().requestJira(route`/rest/api/3/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(`Failed to create Jira issue: ${message}`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorBody = (await response.json()) as {
        errors?: Record<string, string>;
        errorMessages?: string[];
      };
      if (errorBody.errorMessages) {
        errorDetail = errorBody.errorMessages.join('; ');
      }
      if (errorBody.errors) {
        const fieldErrors = Object.entries(errorBody.errors)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
        errorDetail += (errorDetail ? ' | ' : '') + fieldErrors;
      }
    } catch {
      // Unable to parse error body — proceed with status code only
    }
    throw new ExternalApiError(
      `Jira API returned HTTP ${response.status} creating issue: ${errorDetail}`
    );
  }

  const data = (await response.json()) as JiraCreateIssueApiResponse;

  return {
    id: data.id,
    key: data.key,
  };
}

/**
 * Searches for Jira issues using JQL.
 *
 * Handles pagination automatically, collecting all matching issues.
 *
 * @param jql - The JQL query string.
 * @param fields - The field names to include in results.
 * @returns An array of matching Jira issues.
 * @throws {ValidationError} If jql is empty.
 * @throws {ExternalApiError} If the Jira API returns an error.
 */
export async function searchIssues(
  jql: string,
  fields: string[]
): Promise<JiraIssue[]> {
  if (!isNonEmptyString(jql)) {
    throw new ValidationError('jql must be a non-empty string');
  }

  const allIssues: JiraIssue[] = [];
  let startAt = 0;
  const maxResults = 50;
  let total = Infinity;

  while (startAt < total) {
    let response: any;

    try {
      response = await api.asUser().requestJira(route`/rest/api/3/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jql,
          fields,
          startAt,
          maxResults,
        }),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ExternalApiError(`Jira search failed: ${message}`);
    }

    if (!response.ok) {
      throw new ExternalApiError(
        `Jira API returned HTTP ${response.status} for search query`
      );
    }

    const data = (await response.json()) as JiraSearchApiResponse;
    total = data.total;

    for (const issue of data.issues) {
      allIssues.push({
        id: issue.id,
        key: issue.key,
        self: issue.self,
        fields: issue.fields,
      });
    }

    startAt += maxResults;
  }

  return allIssues;
}

/**
 * Gets an entity property stored on a Jira issue.
 *
 * ANDON uses entity properties to store metadata (idempotency keys,
 * processing state, change intent references) directly on issues.
 *
 * @param issueIdOrKey - The Jira issue ID or key.
 * @param propertyKey - The property key to retrieve.
 * @returns The property value, or null if not found.
 * @throws {ValidationError} If parameters are invalid.
 * @throws {ExternalApiError} If the Jira API returns an unexpected error.
 */
export async function getIssueProperty(
  issueIdOrKey: string,
  propertyKey: string
): Promise<unknown> {
  if (!isNonEmptyString(issueIdOrKey)) {
    throw new ValidationError('issueIdOrKey must be a non-empty string');
  }
  if (!isNonEmptyString(propertyKey)) {
    throw new ValidationError('propertyKey must be a non-empty string');
  }

  let response: any;
  try {
    response = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/issue/${issueIdOrKey}/properties/${propertyKey}`
      );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(
      `Failed to get property ${propertyKey} on ${issueIdOrKey}: ${message}`
    );
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new ExternalApiError(
      `Jira API returned HTTP ${response.status} for property ${propertyKey} on ${issueIdOrKey}`
    );
  }

  const data = (await response.json()) as { key: string; value: unknown };
  return data.value;
}

/**
 * Sets an entity property on a Jira issue.
 *
 * Creates or overwrites the property. ANDON uses this to persist
 * processing metadata (change intent IDs, idempotency keys, etc.).
 *
 * @param issueIdOrKey - The Jira issue ID or key.
 * @param propertyKey - The property key to set.
 * @param value - The value to store (must be JSON-serializable).
 * @throws {ValidationError} If parameters are invalid.
 * @throws {ExternalApiError} If the Jira API returns an error.
 */
export async function setIssueProperty(
  issueIdOrKey: string,
  propertyKey: string,
  value: unknown
): Promise<void> {
  if (!isNonEmptyString(issueIdOrKey)) {
    throw new ValidationError('issueIdOrKey must be a non-empty string');
  }
  if (!isNonEmptyString(propertyKey)) {
    throw new ValidationError('propertyKey must be a non-empty string');
  }

  let response: any;
  try {
    response = await api.asUser().requestJira(
      route`/rest/api/3/issue/${issueIdOrKey}/properties/${propertyKey}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(
      `Failed to set property ${propertyKey} on ${issueIdOrKey}: ${message}`
    );
  }

  if (!response.ok) {
    throw new ExternalApiError(
      `Jira API returned HTTP ${response.status} setting property ${propertyKey} on ${issueIdOrKey}`
    );
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal Atlassian Document Format (ADF) document wrapping
 * plain-text content into a single paragraph.
 *
 * @param text - The plain text description.
 * @returns An ADF-compliant document object.
 */
function buildAdfDescription(text: string): Record<string, unknown> {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text || '(No description provided)',
          },
        ],
      },
    ],
  };
}
