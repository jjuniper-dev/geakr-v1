/**
 * Config Orchestration System
 *
 * Central configuration management for the capture pipeline.
 *
 * Responsibilities:
 * - Initialize configuration from env + files
 * - Provide runtime configuration per request
 * - Route LLM providers by operation and runtime mode
 * - Manage team-specific overrides
 * - Validate all configuration values
 */

import { getRuntimeConfig, validateRuntimeMode, getRuntimeModes } from './runtime.js';
import { getSourceConfig, validateSourceClassification, validateContextLayer, getSourceConfigurations } from './source.js';
import {
  getProviderForOperation,
  getTeamOverrides,
  setTeamOverride,
  getRoutingRules,
  getProvidersByOperation,
  validateProviderName
} from './providers.js';

let initialized = false;
let configState = {
  mode: 'metadata_only',
  hosting: 'other',
  endpoint: 'openai_api'
};

export async function initializeConfig(options = {}) {
  try {
    // Load from environment
    configState.mode = process.env.RUNTIME_MODE || 'metadata_only';
    configState.hosting = process.env.RUNTIME_HOSTING || 'other';
    configState.endpoint = process.env.RUNTIME_ENDPOINT || 'openai_api';

    // Validate critical settings
    validateRuntimeMode(configState.mode);

    initialized = true;
    console.log(`✓ Config initialized: mode=${configState.mode}, hosting=${configState.hosting}`);
  } catch (error) {
    console.error(`❌ Config initialization failed: ${error.message}`);
    throw error;
  }
}

export function getConfig() {
  if (!initialized) {
    console.warn('⚠️  Config not initialized. Call initializeConfig() first.');
  }
  return {
    ...configState,
    timestamp: new Date().toISOString()
  };
}

export function getRuntime(reqBody = {}) {
  return getRuntimeConfig(reqBody);
}

export function getSource(reqBody = {}) {
  return getSourceConfig(reqBody);
}

export function getLLMProvider(operation, runtimeMode) {
  if (!runtimeMode) {
    throw new Error('runtimeMode is required for getLLMProvider()');
  }
  return getProviderForOperation(operation, runtimeMode);
}

export function getPluginChain(useCase, userId) {
  // Stub for plugin chain selection
  // In Phase 3, this will load plugins and their configs
  const chains = {
    'extract_and_assess': ['baseline', 'assess']
  };
  return chains[useCase] || ['baseline'];
}

export function getTeamConfig(teamId) {
  return getTeamOverrides(teamId);
}

export function setTeamConfig(teamId, config) {
  setTeamOverride(teamId, config);
}

// Re-export validation functions
export {
  validateRuntimeMode,
  validateSourceClassification,
  validateContextLayer,
  validateProviderName,
  getRuntimeModes,
  getSourceConfigurations,
  getRoutingRules,
  getProvidersByOperation
};

// Export for direct use if needed
export const config = {
  init: initializeConfig,
  get: getConfig,
  getRuntime,
  getSource,
  getLLMProvider,
  getPluginChain,
  getTeamConfig,
  setTeamConfig
};
