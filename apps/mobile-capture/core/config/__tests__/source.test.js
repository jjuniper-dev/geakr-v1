/**
 * Source Configuration Tests
 */

import assert from 'assert';
import { describe, it } from 'node:test';
import {
  getSourceConfig,
  validateSourceClassification,
  validateContextLayer,
  getSourceConfigurations
} from '../source.js';

describe('Source Configuration', () => {
  describe('getSourceConfig()', () => {
    it('should return default source config', () => {
      const config = getSourceConfig({});
      assert(config.classification);
      assert(config.contextLayer);
      assert.strictEqual(config.classification, 'unknown');
      assert.strictEqual(config.contextLayer, 'personal');
    });

    it('should respect request body overrides', () => {
      const config = getSourceConfig({
        sourceClassification: 'public',
        contextLayer: 'work'
      });
      assert.strictEqual(config.classification, 'public');
      assert.strictEqual(config.contextLayer, 'work');
    });

    it('should accept valid classifications', () => {
      const valid = ['public', 'internal', 'confidential', 'secret', 'unknown'];
      valid.forEach(classification => {
        const config = getSourceConfig({ sourceClassification: classification });
        assert.strictEqual(config.classification, classification);
      });
    });

    it('should accept valid context layers', () => {
      const valid = ['personal', 'work', 'public', 'enterprise', 'unknown'];
      valid.forEach(layer => {
        const config = getSourceConfig({ contextLayer: layer });
        assert.strictEqual(config.contextLayer, layer);
      });
    });

    it('should warn on unknown classification', () => {
      // Should not throw, just warn
      const config = getSourceConfig({ sourceClassification: 'unknown_type' });
      assert(config);
    });
  });

  describe('validateSourceClassification()', () => {
    it('should validate approved classifications', () => {
      const valid = ['public', 'internal', 'confidential', 'secret', 'unknown'];
      valid.forEach(classification => {
        const result = validateSourceClassification(classification);
        assert.strictEqual(result, classification);
      });
    });

    it('should reject invalid classifications', () => {
      assert.throws(
        () => validateSourceClassification('invalid_class'),
        /Invalid source classification/
      );
    });
  });

  describe('validateContextLayer()', () => {
    it('should validate approved layers', () => {
      const valid = ['personal', 'work', 'public', 'enterprise', 'unknown'];
      valid.forEach(layer => {
        const result = validateContextLayer(layer);
        assert.strictEqual(result, layer);
      });
    });

    it('should reject invalid layers', () => {
      assert.throws(
        () => validateContextLayer('invalid_layer'),
        /Invalid context layer/
      );
    });
  });

  describe('getSourceConfigurations()', () => {
    it('should return valid classifications', () => {
      const { classifications } = getSourceConfigurations();
      assert(classifications.all.length > 0);
      assert(classifications.all.includes('public'));
      assert(classifications.all.includes('secret'));
    });

    it('should return valid context layers', () => {
      const { contextLayers } = getSourceConfigurations();
      assert(contextLayers.all.length > 0);
      assert(contextLayers.all.includes('work'));
      assert(contextLayers.all.includes('enterprise'));
    });

    it('should provide descriptions', () => {
      const config = getSourceConfigurations();
      assert(config.classifications.descriptions.public);
      assert(config.contextLayers.descriptions.work);
    });
  });
});
