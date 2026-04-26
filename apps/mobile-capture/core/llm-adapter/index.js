import { getOpenAIProvider } from './providers/openai.js';

let provider = null;

export function initializeAdapter() {
  provider = getOpenAIProvider();
  return provider;
}

export function getProvider() {
  if (!provider) {
    throw new Error('LLM Adapter not initialized. Call initializeAdapter() on startup.');
  }
  return provider;
}
