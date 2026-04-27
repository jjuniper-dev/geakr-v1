/**
 * Knowledge Schema & Extraction Tests
 */

import assert from 'assert';
import { describe, it } from 'node:test';
import {
  KNOWLEDGE_SCHEMA,
  validateKnowledge,
  getSchemaDescription
} from '../knowledge/schema.js';

describe('Knowledge Schema', () => {
  describe('KNOWLEDGE_SCHEMA', () => {
    it('should define schema structure', () => {
      assert(KNOWLEDGE_SCHEMA.type === 'object');
      assert(KNOWLEDGE_SCHEMA.properties);
      assert(KNOWLEDGE_SCHEMA.required);
    });

    it('should include required fields', () => {
      const required = KNOWLEDGE_SCHEMA.required;
      assert(required.includes('title'));
      assert(required.includes('confidence'));
      assert(required.includes('concepts'));
    });

    it('should define field constraints', () => {
      const props = KNOWLEDGE_SCHEMA.properties;
      assert(props.confidence.enum.includes('low'));
      assert(props.confidence.enum.includes('high'));
      assert(props.summary.maxItems === 6);
      assert(props.concepts.maxItems === 10);
    });
  });

  describe('validateKnowledge()', () => {
    const validKnowledge = {
      title: 'Test Title',
      source_type: 'article',
      confidence: 'high',
      summary: ['Point 1', 'Point 2'],
      key_points: ['Point A', 'Point B'],
      architecture_implications: ['Implication 1'],
      geakr_implications: ['Implication 2'],
      constraints_risks: ['Risk 1'],
      concepts: ['Concept 1']
    };

    it('should validate correct knowledge object', () => {
      const result = validateKnowledge(validKnowledge);
      assert(result.valid);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject missing title', () => {
      const invalid = { ...validKnowledge, title: null };
      const result = validateKnowledge(invalid);
      assert(!result.valid);
      assert(result.errors.length > 0);
    });

    it('should reject invalid confidence', () => {
      const invalid = { ...validKnowledge, confidence: 'invalid' };
      const result = validateKnowledge(invalid);
      assert(!result.valid);
    });

    it('should reject missing arrays', () => {
      const invalid = { ...validKnowledge, concepts: [] };
      const result = validateKnowledge(invalid);
      assert(!result.valid);
    });

    it('should report all errors', () => {
      const invalid = {
        title: null,
        confidence: 'invalid',
        concepts: []
      };
      const result = validateKnowledge(invalid);
      assert(!result.valid);
      assert(result.errors.length > 0);
    });
  });

  describe('getSchemaDescription()', () => {
    it('should return schema metadata', () => {
      const desc = getSchemaDescription();
      assert(desc.name);
      assert(desc.version);
      assert(Array.isArray(desc.fields));
      assert(Array.isArray(desc.requiredFields));
    });

    it('should include all required fields', () => {
      const desc = getSchemaDescription();
      assert(desc.requiredFields.includes('title'));
      assert(desc.requiredFields.includes('confidence'));
    });
  });
});
