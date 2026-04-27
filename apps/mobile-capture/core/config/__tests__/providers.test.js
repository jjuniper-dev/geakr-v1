/**
 * Provider Configuration & Routing Tests
 */

import assert from 'assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import {
  getProviderForOperation,
  getTeamOverrides,
  setTeamOverride,
  getRoutingRules,
  getProvidersByOperation,
  validateProviderName
} from '../providers.js';

describe('Provider Configuration', () => {
  describe('getProviderForOperation()', () => {
    it('should route structuredExtract in approved_enterprise to claude', () => {
      const provider = getProviderForOperation('structuredExtract', 'approved_enterprise');
      assert.strictEqual(provider, 'claude');
    });

    it('should route structuredExtract in external_api_public_only to openai', () => {
      const provider = getProviderForOperation('structuredExtract', 'external_api_public_only');
      assert.strictEqual(provider, 'openai');
    });

    it('should route generate in approved_enterprise to claude', () => {
      const provider = getProviderForOperation('generate', 'approved_enterprise');
      assert.strictEqual(provider, 'claude');
    });

    it('should route embed in local_llm to local', () => {
      const provider = getProviderForOperation('embed', 'local_llm');
      assert.strictEqual(provider, 'local');
    });

    it('should throw for blocked operations', () => {
      assert.throws(
        () => getProviderForOperation('structuredExtract', 'metadata_only'),
        /not allowed/
      );
    });

    it('should throw for unknown operations', () => {
      assert.throws(
        () => getProviderForOperation('unknown_op', 'approved_enterprise'),
        /No routing rules/
      );
    });

    it('should respect FORCE_PROVIDER override', () => {
      const oldOverride = process.env.FORCE_PROVIDER;
      process.env.FORCE_PROVIDER = 'openai';

      const provider = getProviderForOperation('structuredExtract', 'approved_enterprise');
      assert.strictEqual(provider, 'openai');

      if (oldOverride) {
        process.env.FORCE_PROVIDER = oldOverride;
      } else {
        delete process.env.FORCE_PROVIDER;
      }
    });
  });

  describe('getProvidersByOperation()', () => {
    it('should list all providers for structuredExtract', () => {
      const providers = getProvidersByOperation('structuredExtract');
      assert(Array.isArray(providers));
      assert(providers.includes('claude'));
      assert(providers.includes('openai'));
    });

    it('should exclude null (blocked) entries', () => {
      const providers = getProvidersByOperation('structuredExtract');
      assert(!providers.includes(null));
    });

    it('should throw for unknown operation', () => {
      assert.throws(
        () => getProvidersByOperation('unknown_op'),
        /No routing rules/
      );
    });
  });

  describe('Team Overrides', () => {
    it('should get team overrides', () => {
      const overrides = getTeamOverrides('health-outcomes');
      assert(overrides);
      assert.strictEqual(overrides.provider, 'claude');
    });

    it('should return null for unknown team', () => {
      const overrides = getTeamOverrides('unknown_team');
      assert.strictEqual(overrides, null);
    });

    it('should set team overrides', () => {
      const testTeam = 'test-team-123';
      const config = { provider: 'openai', model: 'gpt-4' };

      setTeamOverride(testTeam, config);
      const retrieved = getTeamOverrides(testTeam);

      assert.deepStrictEqual(retrieved, config);
    });
  });

  describe('getRoutingRules()', () => {
    it('should return all routing rules', () => {
      const rules = getRoutingRules();
      assert(rules.structuredExtract);
      assert(rules.generate);
      assert(rules.embed);
      assert(rules.chat);
    });

    it('should have complete routing for approved_enterprise', () => {
      const rules = getRoutingRules();
      Object.keys(rules).forEach(operation => {
        assert(rules[operation].approved_enterprise);
      });
    });
  });

  describe('validateProviderName()', () => {
    it('should validate known providers', () => {
      const valid = ['openai', 'claude', 'local'];
      valid.forEach(name => {
        const result = validateProviderName(name);
        assert.strictEqual(result, name);
      });
    });

    it('should reject unknown providers', () => {
      assert.throws(
        () => validateProviderName('unknown_provider'),
        /Invalid provider/
      );
    });
  });
});
