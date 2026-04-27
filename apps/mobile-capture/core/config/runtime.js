/**
 * Runtime Configuration
 *
 * Extracts from: server.js getRuntimeConfig()
 *
 * Runtime modes determine which policy decisions apply,
 * which LLM providers are allowed, and what operations are permitted.
 */

const VALID_MODES = [
  'metadata_only',
  'local_only',
  'local_llm',
  'external_api_public_only',
  'approved_enterprise'
];

const VALID_HOSTING = [
  'local',
  'azure_approved',
  'aws_approved',
  'other'
];

const VALID_ENDPOINTS = [
  'openai_api',
  'anthropic_api',
  'local_ollama',
  'mock'
];

export function getRuntimeConfig(reqBody = {}) {
  const mode = reqBody.runtimeMode || process.env.RUNTIME_MODE || 'metadata_only';
  const hosting = process.env.RUNTIME_HOSTING || 'other';
  const endpoint = process.env.RUNTIME_ENDPOINT || 'openai_api';

  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Invalid runtime mode: ${mode}. Valid: ${VALID_MODES.join(', ')}`);
  }

  if (!VALID_HOSTING.includes(hosting)) {
    console.warn(`⚠️  Unknown hosting environment: ${hosting}`);
  }

  if (!VALID_ENDPOINTS.includes(endpoint)) {
    console.warn(`⚠️  Unknown endpoint: ${endpoint}`);
  }

  return {
    mode,
    hosting,
    endpoint
  };
}

export function validateRuntimeMode(mode) {
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Invalid runtime mode: ${mode}. Valid: ${VALID_MODES.join(', ')}`);
  }
  return mode;
}

export function getRuntimeModes() {
  return {
    all: VALID_MODES,
    descriptions: {
      metadata_only: 'No external API calls. Metadata extraction only.',
      local_only: 'Local processing. No external calls.',
      local_llm: 'Use local LLM (Ollama). No cloud API calls.',
      external_api_public_only: 'Allow public API (OpenAI). No sensitive data.',
      approved_enterprise: 'All operations allowed. Enterprise-grade security.'
    }
  };
}
