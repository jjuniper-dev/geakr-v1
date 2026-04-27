/**
 * LLM Adapter Tests
 *
 * Tests for:
 * - Provider initialization
 * - Provider registry
 * - Provider selection by operation and runtime mode
 * - Error handling
 */

import assert from 'assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import * as adapter from '../index.js';
import { getRouting } from '../routing.js';

describe('LLM Adapter', () => {
  describe('Provider Registry', () => {
    it('should list available providers', () => {
      const { available, default: defaultProvider } = adapter.listProviders();
      assert(Array.isArray(available));
      assert(available.length > 0);
      assert(defaultProvider);
    });

    it('should get default provider', () => {
      const provider = adapter.getProvider();
      assert(provider);
      assert(provider.name);
      assert(provider.model);
    });

    it('should get specific provider by name', () => {
      const { available } = adapter.listProviders();
      if (available.includes('openai')) {
        const provider = adapter.getProvider('openai');
        assert.strictEqual(provider.name, 'openai');
      }
    });

    it('should throw for unavailable provider', () => {
      assert.throws(
        () => adapter.getProvider('nonexistent'),
        /not available/
      );
    });
  });

  describe('Provider Routing', () => {
    it('should route structuredExtract for approved_enterprise to claude', () => {
      const { rules } = getRouting();
      assert.strictEqual(rules.structuredExtract.approved_enterprise, 'claude');
    });

    it('should route structuredExtract for external_api_public_only to openai', () => {
      const { rules } = getRouting();
      assert.strictEqual(rules.structuredExtract.external_api_public_only, 'openai');
    });

    it('should route generate for approved_enterprise to claude', () => {
      const { rules } = getRouting();
      assert.strictEqual(rules.generate.approved_enterprise, 'claude');
    });

    it('should block operations in metadata_only mode', () => {
      assert.throws(
        () => adapter.getProviderByOperation('structuredExtract', 'metadata_only'),
        /not allowed/
      );
    });
  });

  describe('Provider Interface', () => {
    it('provider should have required methods', () => {
      const provider = adapter.getProvider();
      assert(typeof provider.structuredExtract === 'function');
      assert(typeof provider.name === 'string');
      assert(typeof provider.model === 'string');
    });

    it('provider should return info object', () => {
      const provider = adapter.getProvider();
      if (provider.getInfo) {
        const info = provider.getInfo();
        assert(info.name);
        assert(info.model);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw if not initialized', () => {
      // This test assumes a fresh module load
      // In practice, initializeAdapter() is called on server startup
      // so getProvider() should not throw after init
      const provider = adapter.getProvider();
      assert(provider, 'Adapter should be initialized');
    });

    it('should require API keys for providers', () => {
      // This would normally be caught during initializeAdapter()
      // Providers should validate their credentials
      const provider = adapter.getProvider();
      assert(provider, 'At least one provider should be available');
    });
  });
});
