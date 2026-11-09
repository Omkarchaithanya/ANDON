/**
 * @module config.service
 * @description Centralized, validated configuration and secrets service for enterprise production use.
 *
 * Ensures no hardcoded credentials, endpoints, or entity IDs exist in code.
 * Validates required configuration at runtime and provides actionable errors.
 */

import * as repository from '../db/repository';
import { ValidationError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';

export interface AppConfiguration {
  siteRegistryPageId: string;
  defaultFollowupProjectKey: string;
  environment: 'production' | 'staging' | 'development';
  reviewerPolicyMode: 'owner_only' | 'configured_list';
  allowedReviewerAccountIds?: string[];
  maxTraversalDepth?: number;
}

export const CONFIG_KEYS = {
  SITE_REGISTRY_PAGE_ID: 'SITE_REGISTRY_PAGE_ID',
  DEFAULT_FOLLOWUP_PROJECT_KEY: 'DEFAULT_FOLLOWUP_PROJECT_KEY',
  ENVIRONMENT: 'ENVIRONMENT',
  REVIEWER_POLICY: 'REVIEWER_POLICY',
  MAX_TRAVERSAL_DEPTH: 'MAX_TRAVERSAL_DEPTH',
} as const;

/**
 * Validates and retrieves the full application configuration.
 * Throws a ValidationError with specific missing keys if required configuration is absent.
 */
export async function getValidatedConfig(): Promise<AppConfiguration> {
  const siteRegistryPageId = await repository.getAppConfig(CONFIG_KEYS.SITE_REGISTRY_PAGE_ID);
  const defaultFollowupProjectKey = await repository.getAppConfig(CONFIG_KEYS.DEFAULT_FOLLOWUP_PROJECT_KEY);
  const environment = ((await repository.getAppConfig(CONFIG_KEYS.ENVIRONMENT)) || 'production') as AppConfiguration['environment'];
  const reviewerPolicyRaw = await repository.getAppConfig(CONFIG_KEYS.REVIEWER_POLICY);

  const missingConfigs: string[] = [];

  if (!isNonEmptyString(siteRegistryPageId)) {
    missingConfigs.push('SITE_REGISTRY_PAGE_ID (Confluence Site Registry Page)');
  }

  if (missingConfigs.length > 0) {
    throw new ValidationError(
      `Enterprise Configuration Incomplete: Missing required configuration setting(s): ${missingConfigs.join(', ')}. ` +
      `Please configure these in the ANDON Administration panel before proceeding.`
    );
  }

  let reviewerPolicy = { mode: 'configured_list' as const, allowed_account_ids: [] as string[] };
  if (reviewerPolicyRaw) {
    try {
      reviewerPolicy = JSON.parse(reviewerPolicyRaw);
    } catch {
      // Keep default safe policy
    }
  }

  return {
    siteRegistryPageId: siteRegistryPageId!,
    defaultFollowupProjectKey: defaultFollowupProjectKey || '',
    environment,
    reviewerPolicyMode: reviewerPolicy.mode,
    allowedReviewerAccountIds: reviewerPolicy.allowed_account_ids,
  };
}

/**
 * Updates application configuration with runtime validation.
 */
export async function updateConfiguration(config: Partial<AppConfiguration>): Promise<void> {
  if (config.siteRegistryPageId !== undefined) {
    if (!isNonEmptyString(config.siteRegistryPageId)) {
      throw new ValidationError('siteRegistryPageId must be a valid non-empty Confluence page ID.');
    }
    await repository.setAppConfig(CONFIG_KEYS.SITE_REGISTRY_PAGE_ID, config.siteRegistryPageId.trim());
  }

  if (config.defaultFollowupProjectKey !== undefined) {
    await repository.setAppConfig(CONFIG_KEYS.DEFAULT_FOLLOWUP_PROJECT_KEY, config.defaultFollowupProjectKey.trim().toUpperCase());
  }

  if (config.environment !== undefined) {
    if (!['production', 'staging', 'development'].includes(config.environment)) {
      throw new ValidationError('Invalid environment. Must be production, staging, or development.');
    }
    await repository.setAppConfig(CONFIG_KEYS.ENVIRONMENT, config.environment);
  }

  if (config.reviewerPolicyMode !== undefined) {
    const policy = {
      mode: config.reviewerPolicyMode,
      allowed_account_ids: config.allowedReviewerAccountIds || [],
    };
    await repository.setAppConfig(CONFIG_KEYS.REVIEWER_POLICY, JSON.stringify(policy));
  }
}

