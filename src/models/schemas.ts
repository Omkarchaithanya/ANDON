/**
 * @module schemas
 * @description Lightweight runtime validation functions and schemas for input boundaries.
 */

import { ValidationError } from '../utils/errors';
import { isNonEmptyString } from '../utils/validation';

/** Allowed physical condition attributes for the MVP */
export const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  surface_finish: [
    'matte_epoxy',
    'high_gloss_clear_finish',
    'polished_concrete',
    'sealed_concrete',
    'anti_slip_coating',
  ],
  lighting_type: [
    'standard_warehouse_led',
    'high_intensity_discharge',
    'fluorescent_t5',
    'natural_skylight',
  ],
  ceiling_height: ['standard_6m', 'high_bay_12m', 'low_clearance_4m'],
  floor_marking: ['standard_yellow_stripes', 'barcoded_reflective_tape', 'qr_grid'],
  ambient_temperature: ['ambient_20c', 'cold_storage_4c', 'freezer_minus_20c'],
};

/**
 * Validates condition attribute and value against allowed dictionary.
 */
export function validateConditionSchema(
  attributeName: string,
  attributeValue?: string
): { isValid: boolean; error?: string } {
  if (!isNonEmptyString(attributeName)) {
    return { isValid: false, error: 'Attribute name must be a non-empty string.' };
  }

  const allowedValues = ALLOWED_ATTRIBUTES[attributeName];
  if (!allowedValues) {
    return {
      isValid: false,
      error: `Unsupported attribute "${attributeName}". Supported attributes: ${Object.keys(ALLOWED_ATTRIBUTES).join(', ')}.`,
    };
  }

  if (attributeValue !== undefined && !allowedValues.includes(attributeValue)) {
    return {
      isValid: false,
      error: `Unsupported value "${attributeValue}" for attribute "${attributeName}". Supported values: ${allowedValues.join(', ')}.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates incoming change intent proposal input.
 */
export function validateChangeIntentInput(payload: any): void {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload must be an object.');
  }
  if (!isNonEmptyString(payload.jira_issue_id)) {
    throw new ValidationError('jira_issue_id is required.');
  }
  if (!isNonEmptyString(payload.jira_issue_key)) {
    throw new ValidationError('jira_issue_key is required.');
  }
  if (payload.proposed_attribute) {
    const check = validateConditionSchema(payload.proposed_attribute);
    if (!check.isValid) {
      throw new ValidationError(check.error || 'Invalid proposed_attribute.');
    }
  }
}

/**
 * Validates relationship confirmation input.
 */
export function validateConfirmationInput(payload: any): void {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload must be an object.');
  }
  if (!isNonEmptyString(payload.changeIntentId)) {
    throw new ValidationError('changeIntentId is required.');
  }
  if (!isNonEmptyString(payload.deploymentId)) {
    throw new ValidationError('deploymentId is required.');
  }
  if (!isNonEmptyString(payload.confirmedAttribute)) {
    throw new ValidationError('confirmedAttribute is required.');
  }
}

/**
 * Validates dismissal input.
 */
export function validateDismissalInput(payload: any): void {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload must be an object.');
  }
  if (!isNonEmptyString(payload.changeIntentId)) {
    throw new ValidationError('changeIntentId is required.');
  }
  if (!isNonEmptyString(payload.reason)) {
    throw new ValidationError('A non-empty dismissal reason is required.');
  }
}

/**
 * Validates follow-up Jira issue creation approval input.
 */
export function validateFollowupApprovalInput(payload: any): void {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload must be an object.');
  }
  if (!isNonEmptyString(payload.reviewDecisionId)) {
    throw new ValidationError('reviewDecisionId is required.');
  }
  if (!isNonEmptyString(payload.targetProjectKey)) {
    throw new ValidationError('targetProjectKey is required.');
  }
  if (!isNonEmptyString(payload.summary)) {
    throw new ValidationError('Follow-up summary is required.');
  }
  if (!isNonEmptyString(payload.description)) {
    throw new ValidationError('Follow-up description is required.');
  }
}

