/**
 * Knowledge Schema
 *
 * Defines the structure for extracted knowledge objects.
 * Used by LLM extractors to ensure consistent, structured output.
 */

export const KNOWLEDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      description: 'Title or headline of the knowledge'
    },
    source_type: {
      type: 'string',
      description: 'Type of source (article, blog, documentation, etc)'
    },
    confidence: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Confidence level of extraction'
    },
    summary: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 6,
      description: 'Executive summary points'
    },
    key_points: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 8,
      description: 'Key takeaways and insights'
    },
    architecture_implications: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 6,
      description: 'Architecture and design implications'
    },
    geakr_implications: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 6,
      description: 'GEAkr framework implications'
    },
    constraints_risks: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 6,
      description: 'Constraints and risks identified'
    },
    concepts: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 10,
      description: 'Key concepts extracted'
    }
  },
  required: [
    'title',
    'source_type',
    'confidence',
    'summary',
    'key_points',
    'architecture_implications',
    'geakr_implications',
    'constraints_risks',
    'concepts'
  ]
};

export function validateKnowledge(obj) {
  const errors = [];

  if (!obj.title || typeof obj.title !== 'string') {
    errors.push('title: required string');
  }

  if (!obj.source_type || typeof obj.source_type !== 'string') {
    errors.push('source_type: required string');
  }

  if (!['low', 'medium', 'high'].includes(obj.confidence)) {
    errors.push('confidence: must be low, medium, or high');
  }

  const arrays = [
    'summary',
    'key_points',
    'architecture_implications',
    'geakr_implications',
    'constraints_risks',
    'concepts'
  ];

  for (const field of arrays) {
    if (!Array.isArray(obj[field])) {
      errors.push(`${field}: required array`);
    } else if (obj[field].length === 0) {
      errors.push(`${field}: cannot be empty`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function getSchemaDescription() {
  return {
    name: 'knowledge_extraction_schema',
    version: '1.0',
    fields: Object.keys(KNOWLEDGE_SCHEMA.properties),
    requiredFields: KNOWLEDGE_SCHEMA.required,
    description: 'Schema for LLM structured extraction of knowledge objects'
  };
}
