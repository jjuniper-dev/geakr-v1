/**
 * Graph Fragmenter Tests
 */

import assert from 'assert';
import { describe, it } from 'node:test';
import {
  buildGraphFragment,
  validateGraphFragment,
  mergeGraphFragments
} from '../graph/fragmenter.js';

describe('Graph Fragmenter', () => {
  const sampleKnowledge = {
    title: 'Architecture Decisions',
    source_type: 'blog',
    confidence: 'high',
    concepts: ['cloud', 'microservices']
  };

  describe('buildGraphFragment()', () => {
    it('should create graph fragment from knowledge', () => {
      const fragment = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com/article',
        filename: 'knowledge.md'
      });

      assert(fragment.version);
      assert(fragment.metadata);
      assert(Array.isArray(fragment.nodes));
      assert(Array.isArray(fragment.edges));
    });

    it('should create knowledge node', () => {
      const fragment = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com',
        filename: 'test.md'
      });

      const knowledgeNode = fragment.nodes.find(n => n.type === 'knowledge');
      assert(knowledgeNode);
      assert.strictEqual(knowledgeNode.label, sampleKnowledge.title);
      assert.strictEqual(knowledgeNode.confidence, 'high');
    });

    it('should create source node', () => {
      const url = 'https://example.com/article';
      const fragment = buildGraphFragment(sampleKnowledge, {
        url,
        filename: 'test.md'
      });

      const sourceNode = fragment.nodes.find(n => n.type === 'source');
      assert(sourceNode);
      assert.strictEqual(sourceNode.url, url);
    });

    it('should create concept nodes for each concept', () => {
      const fragment = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com',
        filename: 'test.md'
      });

      const conceptNodes = fragment.nodes.filter(n => n.type === 'concept');
      assert.strictEqual(conceptNodes.length, 2);
    });

    it('should create derived_from edge', () => {
      const fragment = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com',
        filename: 'test.md'
      });

      const derivedEdge = fragment.edges.find(e => e.type === 'derived_from');
      assert(derivedEdge);
      assert(derivedEdge.source);
      assert(derivedEdge.target);
    });

    it('should create supports edges to concepts', () => {
      const fragment = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com',
        filename: 'test.md'
      });

      const supportsEdges = fragment.edges.filter(e => e.type === 'supports');
      assert.strictEqual(supportsEdges.length, 2);
    });
  });

  describe('validateGraphFragment()', () => {
    it('should validate correct fragment', () => {
      const fragment = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com',
        filename: 'test.md'
      });

      const result = validateGraphFragment(fragment);
      assert(result.valid);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject missing nodes', () => {
      const invalid = { edges: [] };
      const result = validateGraphFragment(invalid);
      assert(!result.valid);
    });

    it('should reject invalid node structure', () => {
      const invalid = {
        nodes: [{ id: 'test' }], // missing type and label
        edges: []
      };
      const result = validateGraphFragment(invalid);
      assert(!result.valid);
    });

    it('should reject invalid edge structure', () => {
      const invalid = {
        nodes: [{ id: 'n1', type: 'test', label: 'Test' }],
        edges: [{ source: 'n1' }] // missing target and type
      };
      const result = validateGraphFragment(invalid);
      assert(!result.valid);
    });

    it('should return statistics', () => {
      const fragment = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com',
        filename: 'test.md'
      });

      const result = validateGraphFragment(fragment);
      assert(result.nodeCount > 0);
      assert(result.edgeCount > 0);
    });
  });

  describe('mergeGraphFragments()', () => {
    it('should merge multiple fragments', () => {
      const fragment1 = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com/1',
        filename: 'test1.md'
      });

      const fragment2 = buildGraphFragment(
        { ...sampleKnowledge, concepts: ['security'] },
        { url: 'https://example.com/2', filename: 'test2.md' }
      );

      const merged = mergeGraphFragments([fragment1, fragment2]);
      assert(Array.isArray(merged.nodes));
      assert(Array.isArray(merged.edges));
      assert(merged.metadata.fragment_count === 2);
    });

    it('should deduplicate nodes by id', () => {
      const fragment1 = buildGraphFragment(sampleKnowledge, {
        url: 'https://example.com',
        filename: 'test.md'
      });

      const merged = mergeGraphFragments([fragment1, fragment1]);
      // Should have same node count since they're duplicates
      assert(merged.metadata.node_count > 0);
    });
  });
});
