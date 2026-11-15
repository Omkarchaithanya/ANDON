/**
 * @module domain/condition-registry
 * @description Declarative, schema-driven Condition Registry supporting extensible physical condition families.
 *
 * Invariant: Zero attribute names, allowed values, or comparison thresholds are hardcoded in resolvers or engines.
 * All extraction prompts, schema validation, and set-membership comparisons are parameterized by this registry.
 */

export type ComparisonMode = 'EXACT' | 'EXPLICIT_SET';

export interface ConditionFamilyDefinition {
  attribute: string;
  label: string;
  description: string;
  allowedValues: string[];
  synonyms?: Record<string, string>;
  comparisonMode: ComparisonMode;
  requiredFields?: string[];
  displayTemplates?: {
    gapTemplate: string;
    coveredTemplate: string;
    unknownTemplate: string;
  };
}

export class ConditionRegistry {
  private families: Map<string, ConditionFamilyDefinition> = new Map();

  constructor(initialFamilies: ConditionFamilyDefinition[] = []) {
    for (const fam of initialFamilies) {
      this.register(fam);
    }
  }

  /**
   * Registers a new condition family into the registry.
   */
  public register(def: ConditionFamilyDefinition): void {
    this.families.set(def.attribute.toLowerCase(), {
      ...def,
      attribute: def.attribute.toLowerCase(),
      allowedValues: def.allowedValues.map((v) => v.toLowerCase()),
      synonyms: def.synonyms
        ? Object.fromEntries(
            Object.entries(def.synonyms).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()])
          )
        : {},
    });
  }

  /**
   * Retrieves a registered condition family by attribute name.
   */
  public get(attribute: string): ConditionFamilyDefinition | undefined {
    return this.families.get(attribute.toLowerCase());
  }

  /**
   * Lists all registered condition families.
   */
  public getAll(): ConditionFamilyDefinition[] {
    return Array.from(this.families.values());
  }

  /**
   * Resolves a raw extracted value against allowed values and synonyms.
   */
  public resolveAllowedValue(attribute: string, rawValue: string): string | null {
    const family = this.get(attribute);
    if (!family || !rawValue) return null;

    const normalized = rawValue.trim().toLowerCase().replace(/[\s-]+/g, '_');

    // Direct match
    if (family.allowedValues.includes(normalized)) {
      return normalized;
    }

    // Synonym match
    if (family.synonyms) {
      if (family.synonyms[normalized]) {
        return family.synonyms[normalized];
      }
      const rawLower = rawValue.trim().toLowerCase();
      if (family.synonyms[rawLower]) {
        return family.synonyms[rawLower];
      }
    }

    return null;
  }

  /**
   * Generates a parametrized extraction prompt section listing all registered attributes and allowed values.
   */
  public buildParametrizedExtractionPrompt(): string {
    const lines: string[] = [
      'Extract candidate physical environmental attribute changes mentioned in the text.',
      'Allowed attribute families and canonical values:',
    ];

    for (const fam of this.families.values()) {
      lines.push(
        `- Attribute: "${fam.attribute}" (${fam.label})\n  Allowed values: [${fam.allowedValues.map((v) => `"${v}"`).join(', ')}]`
      );
    }

    lines.push(
      '\nIf the text describes a change to an attribute or value outside these canonical lists, report attribute or value as null.'
    );
    return lines.join('\n');
  }

  /**
   * Validates an extracted candidate proposal against the registry.
   */
  public validateExtractedCandidate(candidate: {
    attribute?: string | null;
    proposedValue?: string | null;
  }): { isValid: boolean; normalizedValue: string | null; error?: string } {
    if (!candidate.attribute) {
      return { isValid: false, normalizedValue: null, error: 'Attribute name is missing.' };
    }

    const family = this.get(candidate.attribute);
    if (!family) {
      return {
        isValid: false,
        normalizedValue: null,
        error: `Attribute "${candidate.attribute}" is not in the declared condition registry.`,
      };
    }

    if (!candidate.proposedValue) {
      return {
        isValid: false,
        normalizedValue: null,
        error: `Proposed value is empty or not specified.`,
      };
    }

    const resolved = this.resolveAllowedValue(family.attribute, candidate.proposedValue);
    if (!resolved) {
      return {
        isValid: false,
        normalizedValue: null,
        error: `Value "${candidate.proposedValue}" is not an allowed value for attribute "${family.attribute}".`,
      };
    }

    return { isValid: true, normalizedValue: resolved };
  }
}

/**
 * Standard default condition registry containing P0 (surface_finish) and P1 (lighting_configuration).
 */
export const defaultConditionRegistry = new ConditionRegistry([
  {
    attribute: 'surface_finish',
    label: 'Floor Surface Finish',
    description: 'Physical friction, reflectance, and traction properties of facility operating surfaces.',
    allowedValues: [
      'matte_epoxy',
      'high_gloss_clear_finish',
      'polished_concrete',
      'sealed_concrete',
      'anti_slip_coating',
    ],
    synonyms: {
      'high-gloss': 'high_gloss_clear_finish',
      'high gloss': 'high_gloss_clear_finish',
      'high_gloss': 'high_gloss_clear_finish',
      'epoxy': 'matte_epoxy',
      'matte': 'matte_epoxy',
      'matte-epoxy': 'matte_epoxy',
    },
    comparisonMode: 'EXACT',
    displayTemplates: {
      gapTemplate: 'The selected baseline does not establish coverage of the proposed {value} condition.',
      coveredTemplate: 'Proposed value "{value}" matches declared baseline scope.',
      unknownTemplate: 'Attribute "surface_finish" baseline scope is unknown.',
    },
  },
  {
    attribute: 'lighting_configuration',
    label: 'Ambient Lighting & Illuminance',
    description: 'Overhead illuminance, wavelength distribution, and sensor glare characteristics.',
    allowedValues: [
      'high_output_led',
      'diffuse_fluorescent',
      'motion_activated_led',
      'ambient_daylight',
    ],
    synonyms: {
      'led': 'high_output_led',
      'fluorescent': 'diffuse_fluorescent',
    },
    comparisonMode: 'EXPLICIT_SET',
    displayTemplates: {
      gapTemplate: 'Proposed lighting condition is not covered in baseline optical clearance.',
      coveredTemplate: 'Lighting condition is covered within declared operating envelope.',
      unknownTemplate: 'Lighting baseline envelope not specified.',
    },
  },
]);

