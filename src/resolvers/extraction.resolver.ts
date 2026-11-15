/**
 * @module extraction.resolver
 * @description Resolver for LLM extraction, attribute normalization, and strict schema validation.
 */

import { ExtractionProposal } from '../models/entities';
import { validateConditionSchema } from '../models/schemas';
import { ValidationError } from '../utils/errors';
import * as llmService from '../services/llm.service';
import { defaultConditionRegistry } from '../domain/condition-registry';

/**
 * Handles LLM extraction from text and validates against the allowed dictionary.
 */
export async function handleExtraction(
  issueContent: string,
  commissioningContent: string
): Promise<ExtractionProposal> {
  if (!issueContent || !issueContent.trim()) {
    throw new ValidationError('issueContent cannot be empty.');
  }

  // 1. Run LLM extraction with source span grounding
  const proposal = await llmService.proposeRelationship(issueContent, commissioningContent, []);

  // 2. Validate extracted attribute against schema
  if (proposal.attribute_name) {
    const family = defaultConditionRegistry.get(proposal.attribute_name);
    const check = validateConditionSchema(proposal.attribute_name, proposal.new_value);
    if (!check.isValid && family) {
      // If LLM returned a synonym, try normalization against the registered allowed values
      const normalized = await llmService.normalizeAttributeValue(
        proposal.new_value || '',
        proposal.attribute_name,
        family.allowedValues
      );

      if (normalized.normalized) {
        proposal.new_value = normalized.normalized;
      }
    }
  }

  return proposal;
}

