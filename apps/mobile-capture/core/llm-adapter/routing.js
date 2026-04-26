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
  }
};

const ENV_OVERRIDES = {
  PREFERRED_PROVIDER: process.env.PREFERRED_PROVIDER,
  FORCE_PROVIDER: process.env.FORCE_PROVIDER
};

export function getProviderForOperation(operation, runtimeMode) {
  if (ENV_OVERRIDES.FORCE_PROVIDER) {
    return ENV_OVERRIDES.FORCE_PROVIDER;
  }

  const rules = ROUTING_RULES[operation];
  if (!rules) {
    throw new Error(`No routing rules defined for operation: ${operation}`);
  }

  const provider = rules[runtimeMode];
  if (!provider) {
    throw new Error(`No provider available for operation '${operation}' in mode '${runtimeMode}'`);
  }

  if (provider === null) {
    throw new Error(`Operation '${operation}' not allowed in mode '${runtimeMode}'`);
  }

  return provider || ENV_OVERRIDES.PREFERRED_PROVIDER || 'openai';
}

export function getRouting() {
  return {
    rules: ROUTING_RULES,
    overrides: ENV_OVERRIDES,
    getProvider: getProviderForOperation
  };
}
