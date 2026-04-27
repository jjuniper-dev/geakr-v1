/**
 * Config Orchestration Tests
 */

import assert from 'assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import {
  initializeConfig,
  getConfig,
  getRuntime,
  getSource,
  getLLMProvider,
  getPluginChain,
  getTeamConfig,
  setTeamConfig,
  config
} from '../index.js';

describe('Config Orchestration', () => {
  beforeEach(async () => {
    // Initialize before each test
    try {
      await initializeConfig();
    } catch (e) {
      // May fail if env vars not set, but that's ok for testing
    }
  });

  describe('initializeConfig()', () => {
    it('should initialize config from environment', async () => {
      await initializeConfig();
      // Should not throw
      const cfg = getConfig();
      assert(cfg.mode);
    });

    it('should return config object', async () => {
      const cfg = getConfig();
      assert(cfg.mode);
      assert(cfg.hosting);
      assert(cfg.endpoint);
      assert(cfg.timestamp);
    });
  });

  describe('getRuntime()', () => {
    it('should return runtime config', () => {
      const runtime = getRuntime({});
      assert(runtime.mode);
      assert(runtime.hosting);
      assert(runtime.endpoint);
    });

    it('should accept request body overrides', () => {
      const runtime = getRuntime({ runtimeMode: 'local_llm' });
      assert.strictEqual(runtime.mode, 'local_llm');
    });
  });

  describe('getSource()', () => {
    it('should return source config', () => {
      const source = getSource({});
      assert(source.classification);
      assert(source.contextLayer);
    });

    it('should accept request body overrides', () => {
      const source = getSource({ sourceClassification: 'public' });
      assert.strictEqual(source.classification, 'public');
    });
  });

  describe('getLLMProvider()', () => {
    it('should route operations to providers', () => {
      const provider = getLLMProvider('structuredExtract', 'approved_enterprise');
      assert.strictEqual(provider, 'claude');
    });

    it('should require runtimeMode', () => {
      assert.throws(
        () => getLLMProvider('structuredExtract'),
        /runtimeMode is required/
      );
    });

    it('should work with all operations', () => {
      const operations = ['structuredExtract', 'generate', 'embed', 'chat'];
      operations.forEach(op => {
        const provider = getLLMProvider(op, 'approved_enterprise');
        assert(provider);
      });
    });
  });

  describe('getPluginChain()', () => {
    it('should return default chain for known use cases', () => {
      const chain = getPluginChain('extract_and_assess');
      assert(Array.isArray(chain));
      assert(chain.includes('baseline'));
    });

    it('should return baseline for unknown use cases', () => {
      const chain = getPluginChain('unknown_use_case');
      assert(Array.isArray(chain));
      assert(chain.includes('baseline'));
    });
  });

  describe('Team Config', () => {
    it('should get team config', () => {
      const cfg = getTeamConfig('health-outcomes');
      assert(cfg);
    });

    it('should return null for unknown team', () => {
      const cfg = getTeamConfig('unknown');
      assert.strictEqual(cfg, null);
    });

    it('should set team config', () => {
      const testTeam = 'test-team-999';
      const newConfig = { provider: 'claude', temperature: 0.2 };

      setTeamConfig(testTeam, newConfig);
      const retrieved = getTeamConfig(testTeam);

      assert.deepStrictEqual(retrieved, newConfig);
    });
  });

  describe('config object', () => {
    it('should provide unified config interface', async () => {
      assert(typeof config.init === 'function');
      assert(typeof config.get === 'function');
      assert(typeof config.getRuntime === 'function');
      assert(typeof config.getSource === 'function');
      assert(typeof config.getLLMProvider === 'function');
    });
  });
});
