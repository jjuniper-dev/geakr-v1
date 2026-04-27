/**
 * Provider Configuration & Routing
 *
 * Determines which LLM provider to use based on:
 * - Operation type (structuredExtract, generate, embed)
 * - Runtime mode (approved_enterprise, external_api_public_only, etc)
 * - Environment overrides (FORCE_PROVIDER, PREFERRED_PROVIDER)
 * - Team-specific preferences
 */

const ROUTING_RULES = {
  structuredExtract: {
    metadata_only: null,
    local_only: null,
    local_llm: 'local',
    external_api_public_only: 'openai',
    approved_enterprise: 'claude'
  },
  generate: {
    metadata_only: null,
    local_only: null,
    local_llm: 'local',
    external_api_public_only: 'openai',
    approved_enterprise: 'claude'
  },
  embed: {
    metadata_only: null,
    local_only: null,
    local_llm: 'local',
    external_api_public_only: 'openai',
    approved_enterprise: 'claude'
  },
  chat: {
    metadata_only: null,
    local_only: null,
    local_llm: 'local',
    external_api_public_only: 'openai',
    approved_enterprise: 'claude'
  }
};

const TEAM_OVERRIDES = {
  'health-outcomes': {
    provider: 'claude',
    model: 'claude-opus',
    temperature: 0.1
  },
  'infrastructure': {
    provider: 'openai',
    model: 'gpt-4-turbo',
    temperature: 0.1
  },
  'compliance': {
    provider: 'claude',
    model: 'claude-opus',
    temperature: 0.0
  }
};

export function getProviderForOperation(operation, runtimeMode) {
  // Environment override: FORCE_PROVIDER takes precedence
  if (process.env.FORCE_PROVIDER) {
    return process.env.FORCE_PROVIDER;
  }

  const rules = ROUTING_RULES[operation];
  if (!rules) {
    throw new Error(`No routing rules defined for operation: ${operation}`);
  }

  const provider = rules[runtimeMode];

  if (provider === null) {
    throw new Error(`Operation '${operation}' not allowed in mode '${runtimeMode}'`);
  }

  if (!provider) {
    throw new Error(`No provider available for operation '${operation}' in mode '${runtimeMode}'`);
  }

  return provider;
}

export function getTeamOverrides(teamId) {
  return TEAM_OVERRIDES[teamId] || null;
}

export function setTeamOverride(teamId, config) {
  TEAM_OVERRIDES[teamId] = config;
}

export function getRoutingRules() {
  return ROUTING_RULES;
}

export function getProvidersByOperation(operation) {
  const rules = ROUTING_RULES[operation];
  if (!rules) {
    throw new Error(`No routing rules for operation: ${operation}`);
  }

  const providers = new Set();
  Object.values(rules).forEach(p => {
    if (p !== null) providers.add(p);
  });

  return Array.from(providers);
}

export function validateProviderName(name) {
  const validProviders = ['openai', 'claude', 'local'];
  if (!validProviders.includes(name)) {
    throw new Error(`Invalid provider: ${name}. Valid: ${validProviders.join(', ')}`);
  }
  return name;
}
