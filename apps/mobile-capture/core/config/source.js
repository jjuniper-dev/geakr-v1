/**
 * Source Configuration
 *
 * Extracts from: server.js getSourceConfig()
 *
 * Classifies the source of information and its context layer.
 * Used by policy gate to determine allowed operations.
 */

const VALID_CLASSIFICATIONS = [
  'public',
  'internal',
  'confidential',
  'secret',
  'unknown'
];

const VALID_CONTEXT_LAYERS = [
  'personal',
  'work',
  'public',
  'enterprise',
  'unknown'
];

export function getSourceConfig(reqBody = {}) {
  const classification = reqBody.sourceClassification || 'unknown';
  const contextLayer = reqBody.contextLayer || 'personal';

  if (!VALID_CLASSIFICATIONS.includes(classification)) {
    console.warn(`⚠️  Unknown source classification: ${classification}`);
  }

  if (!VALID_CONTEXT_LAYERS.includes(contextLayer)) {
    console.warn(`⚠️  Unknown context layer: ${contextLayer}`);
  }

  return {
    classification,
    contextLayer
  };
}

export function validateSourceClassification(classification) {
  if (!VALID_CLASSIFICATIONS.includes(classification)) {
    throw new Error(
      `Invalid source classification: ${classification}. Valid: ${VALID_CLASSIFICATIONS.join(', ')}`
    );
  }
  return classification;
}

export function validateContextLayer(layer) {
  if (!VALID_CONTEXT_LAYERS.includes(layer)) {
    throw new Error(
      `Invalid context layer: ${layer}. Valid: ${VALID_CONTEXT_LAYERS.join(', ')}`
    );
  }
  return layer;
}

export function getSourceConfigurations() {
  return {
    classifications: {
      all: VALID_CLASSIFICATIONS,
      descriptions: {
        public: 'Publicly available information. No restrictions.',
        internal: 'Internal company information. Limited sharing.',
        confidential: 'Confidential data. Restricted access.',
        secret: 'Highly sensitive data. Minimal processing.',
        unknown: 'Unknown classification. Conservative restrictions.'
      }
    },
    contextLayers: {
      all: VALID_CONTEXT_LAYERS,
      descriptions: {
        personal: 'Personal context. Individual use only.',
        work: 'Work-related context. Team access allowed.',
        public: 'Publicly shared context. Anyone can access.',
        enterprise: 'Enterprise-wide context. Compliance required.',
        unknown: 'Unknown context. Default restrictions.'
      }
    }
  };
}
