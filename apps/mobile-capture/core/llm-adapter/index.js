import { getOpenAIProvider } from './providers/openai.js';
import { getClaudeProvider } from './providers/claude.js';
import { getLocalProvider } from './providers/local.js';
import { getProviderForOperation } from './routing.js';

const providers = {};
let defaultProvider = null;

export function initializeAdapter() {
  const enabledProviders = process.env.ENABLED_PROVIDERS?.split(',').map(p => p.trim()) || ['openai'];

  for (const name of enabledProviders) {
    try {
      switch (name) {
        case 'openai':
          providers.openai = getOpenAIProvider();
          if (!defaultProvider) defaultProvider = 'openai';
          console.log('✓ OpenAI provider initialized');
          break;
        case 'claude':
          providers.claude = getClaudeProvider();
          if (!defaultProvider) defaultProvider = 'claude';
          console.log('✓ Claude provider initialized');
          break;
        case 'local':
          providers.local = getLocalProvider();
          if (!defaultProvider) defaultProvider = 'local';
          console.log('✓ Local provider initialized');
          break;
        default:
          console.warn(`⚠️  Unknown provider: ${name}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to initialize ${name}: ${error.message}`);
    }
  }

  if (!defaultProvider) {
    throw new Error('No LLM providers could be initialized. Check OPENAI_API_KEY and/or ANTHROPIC_API_KEY.');
  }

  console.log(`✓ Default provider: ${defaultProvider}`);
  return providers[defaultProvider];
}

export function getProvider(name = null) {
  const providerName = name || defaultProvider;

  if (!providerName) {
    throw new Error('LLM Adapter not initialized. Call initializeAdapter() on startup.');
  }

  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Provider '${providerName}' not available. Enabled: ${Object.keys(providers).join(', ')}`);
  }

  return provider;
}

export function getProviderByOperation(operation, runtimeMode) {
  const providerName = getProviderForOperation(operation, runtimeMode);
  return getProvider(providerName);
}

export function listProviders() {
  return {
    available: Object.keys(providers),
    default: defaultProvider
  };
}
