/**
 * Provider Tests
 *
 * Tests for individual provider implementations.
 * Note: Requires valid API keys in environment (OPENAI_API_KEY, ANTHROPIC_API_KEY)
 *
 * Integration tests (actual LLM calls) should be skipped in CI unless specifically enabled.
 * Run with: ENABLE_LLM_TESTS=1 npm test
 */

import assert from 'assert';
import { describe, it, skip } from 'node:test';
import { getOpenAIProvider } from '../providers/openai.js';
import { getClaudeProvider } from '../providers/claude.js';
import { getLocalProvider } from '../providers/local.js';

const ENABLE_INTEGRATION_TESTS = process.env.ENABLE_LLM_TESTS === '1';

describe('OpenAI Provider', () => {
  it('should initialize with valid API key', () => {
    if (!process.env.OPENAI_API_KEY) {
      skip('OPENAI_API_KEY not set');
      return;
    }

    const provider = getOpenAIProvider();
    assert(provider);
    assert.strictEqual(provider.name, 'openai');
    assert(provider.model);
  });

  it('should throw without API key', () => {
    const oldKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    assert.throws(
      () => getOpenAIProvider(),
      /OPENAI_API_KEY/
    );

    if (oldKey) process.env.OPENAI_API_KEY = oldKey;
  });

  (ENABLE_INTEGRATION_TESTS ? it : skip)('should perform structured extraction', async () => {
    if (!process.env.OPENAI_API_KEY) {
      skip('OPENAI_API_KEY not set');
      return;
    }

    const provider = getOpenAIProvider();
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' }
      },
      required: ['title', 'summary']
    };

    const result = await provider.structuredExtract({
      schema,
      messages: [
        { role: 'system', content: 'Extract title and summary.' },
        { role: 'user', content: 'The quick brown fox jumps over the lazy dog.' }
      ],
      temperature: 0.1
    });

    assert(result.title);
    assert(result.summary);
  });
});

describe('Claude Provider', () => {
  it('should initialize with valid API key', () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      skip('ANTHROPIC_API_KEY not set');
      return;
    }

    const provider = getClaudeProvider();
    assert(provider);
    assert.strictEqual(provider.name, 'claude');
    assert(provider.model);
  });

  it('should throw without API key', () => {
    const oldKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    assert.throws(
      () => getClaudeProvider(),
      /ANTHROPIC_API_KEY/
    );

    if (oldKey) process.env.ANTHROPIC_API_KEY = oldKey;
  });

  (ENABLE_INTEGRATION_TESTS ? it : skip)('should perform structured extraction', async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      skip('ANTHROPIC_API_KEY not set');
      return;
    }

    const provider = getClaudeProvider();
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' }
      },
      required: ['title', 'summary']
    };

    const result = await provider.structuredExtract({
      schema,
      messages: [
        { role: 'system', content: 'Extract title and summary.' },
        { role: 'user', content: 'The quick brown fox jumps over the lazy dog.' }
      ],
      temperature: 0.1
    });

    assert(result.title);
    assert(result.summary);
  });
});

describe('Local Provider', () => {
  it('should initialize', () => {
    const provider = getLocalProvider();
    assert(provider);
    assert.strictEqual(provider.name, 'local');
    assert(provider.model);
  });

  (ENABLE_INTEGRATION_TESTS ? it : skip)('should connect to Ollama', async () => {
    const provider = getLocalProvider();

    // This test assumes Ollama is running locally
    // To enable: start Ollama and run with ENABLE_LLM_TESTS=1
    try {
      const result = await provider.generate({
        prompt: 'What is 2+2?',
        temperature: 0.1
      });
      assert(result);
    } catch (error) {
      if (error.message.includes('ECONNREFUSED')) {
        skip('Ollama not running');
      } else {
        throw error;
      }
    }
  });
});
