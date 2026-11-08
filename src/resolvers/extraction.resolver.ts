/**
 * @module extraction.resolver
 * @description Resolver for LLM extraction, attribute normalization, and strict schema validation.
 */

import { ExtractionProposal } from '../models/entities';
import { validateConditionSchema } from '../models/schemas';
import { ValidationError } from '../utils/errors';
import * as llmService from '../services/llm.service';

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
    const check = validateConditionSchema(proposal.attribute_name, proposal.new_value);
    if (!check.isValid) {
      // If LLM returned a synonym, try normalization
      const normalized = await llmService.normalizeAttributeValue(
        proposal.new_value || '',
        proposal.attribute_name,
        ['matte_epoxy', 'high_gloss_clear_finish', 'polished_concrete', 'sealed_concrete', 'anti_slip_coating']
      );

      if (normalized.normalized) {
        proposal.new_value = normalized.normalized;
      }
    }
  }

  return proposal;
}

