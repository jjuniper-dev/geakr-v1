/**
 * Runtime Configuration Tests
 */

import assert from 'assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import {
  getRuntimeConfig,
  validateRuntimeMode,
  getRuntimeModes
} from '../runtime.js';

describe('Runtime Configuration', () => {
  describe('getRuntimeConfig()', () => {
    it('should return default runtime config', () => {
      const config = getRuntimeConfig({});
      assert(config.mode);
      assert(config.hosting);
      assert(config.endpoint);
    });

    it('should respect request body overrides', () => {
      const config = getRuntimeConfig({
        runtimeMode: 'approved_enterprise'
      });
      assert.strictEqual(config.mode, 'approved_enterprise');
    });

    it('should use environment variables as fallback', () => {
      const oldMode = process.env.RUNTIME_MODE;
      process.env.RUNTIME_MODE = 'local_llm';

      const config = getRuntimeConfig({});
      assert.strictEqual(config.mode, 'local_llm');

      if (oldMode) {
        process.env.RUNTIME_MODE = oldMode;
      } else {
        delete process.env.RUNTIME_MODE;
      }
    });

    it('should prefer request body over environment', () => {
      const oldMode = process.env.RUNTIME_MODE;
      process.env.RUNTIME_MODE = 'local_llm';

      const config = getRuntimeConfig({
        runtimeMode: 'approved_enterprise'
      });
      assert.strictEqual(config.mode, 'approved_enterprise');

      if (oldMode) {
        process.env.RUNTIME_MODE = oldMode;
      } else {
        delete process.env.RUNTIME_MODE;
      }
    });

    it('should throw on invalid mode', () => {
      assert.throws(
        () => getRuntimeConfig({ runtimeMode: 'invalid_mode' }),
        /Invalid runtime mode/
      );
    });
  });

  describe('validateRuntimeMode()', () => {
    it('should validate approved modes', () => {
      const valid = ['metadata_only', 'local_only', 'local_llm', 'external_api_public_only', 'approved_enterprise'];
      valid.forEach(mode => {
        const result = validateRuntimeMode(mode);
        assert.strictEqual(result, mode);
      });
    });

    it('should reject invalid modes', () => {
      assert.throws(
        () => validateRuntimeMode('invalid'),
        /Invalid runtime mode/
      );
    });
  });

  describe('getRuntimeModes()', () => {
    it('should return all valid modes', () => {
      const { all } = getRuntimeModes();
      assert(Array.isArray(all));
      assert(all.length > 0);
      assert(all.includes('approved_enterprise'));
    });

    it('should return descriptions for each mode', () => {
      const { descriptions } = getRuntimeModes();
      assert(descriptions.approved_enterprise);
      assert(descriptions.metadata_only);
    });
  });
});
