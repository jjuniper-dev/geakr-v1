/**
 * Graph Fragmenter
 *
 * Extracts from: core/baseline/graph-fragmenter.js
 *
 * Converts structured knowledge into knowledge graph fragments.
 * Creates nodes for knowledge, sources, concepts, and branches.
 * Creates edges showing relationships and provenance.
 */

import crypto from 'crypto';

const GRAPH_FRAGMENT_VERSION = '0.1.0-capture-fragment';
const CAPTURE_PIPELINE_VERSION = '0.4.0-policy-gated-capture';

function slugify(s) {
  return (s || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 70) || 'untitled';
}

function hash12(s) {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
}

export function buildGraphFragment(knowledge, options = {}) {
  const {
    url = '',
    filename = 'unknown.md',
    branch = process.env.GITHUB_BRANCH || 'main',
    sourceLayer = 'public'
  } = options;

  const knowledgeId = `knowledge:${hash12(filename)}`;
  const sourceId = `source:${hash12(url)}`;
  const branchId = `branch:${slugify(branch)}`;

  // Create nodes
  const nodes = [
    {
      id: knowledgeId,
      type: 'knowledge',
      label: knowledge.title,
      path: `knowledge/${filename}`,
      branch,
      source_layer: sourceLayer,
      trust_state: 'provisional',
      status: 'extracted',
      confidence: knowledge.confidence,
      pipeline_version: CAPTURE_PIPELINE_VERSION,
      timestamp: new Date().toISOString()
    },
    {
      id: sourceId,
      type: 'source',
      label: url,
      url,
      source_type: knowledge.source_type,
      source_layer: sourceLayer
    },
    {
      id: branchId,
      type: 'branch',
      label: branch,
      branch
    }
  ];

  // Create edges
  const edges = [
    {
      id: `derived_from:${knowledgeId}->${sourceId}`,
      source: knowledgeId,
      target: sourceId,
      type: 'derived_from',
      properties: {
        confidence: knowledge.confidence,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: `belongs_to_branch:${knowledgeId}->${branchId}`,
      source: knowledgeId,
      target: branchId,
      type: 'belongs_to_branch'
    }
  ];

  // Add concept nodes and edges
  for (const concept of knowledge.concepts) {
    const conceptId = `concept:${slugify(concept)}`;

    // Add concept node if not already present
    if (!nodes.find(n => n.id === conceptId)) {
      nodes.push({
        id: conceptId,
        type: 'concept',
        label: slugify(concept).replaceAll('-', ' '),
        slug: slugify(concept)
      });
    }

    // Add edge from knowledge to concept
    edges.push({
      id: `supports:${knowledgeId}->${conceptId}`,
      source: knowledgeId,
      target: conceptId,
      type: 'supports'
    });
  }

  return {
    version: GRAPH_FRAGMENT_VERSION,
    metadata: {
      created_at: new Date().toISOString(),
      source_url: url,
      branch,
      confidence: knowledge.confidence,
      pipeline_version: CAPTURE_PIPELINE_VERSION
    },
    nodes,
    edges
  };
}

export function validateGraphFragment(fragment) {
  const errors = [];

  if (!fragment.nodes || !Array.isArray(fragment.nodes)) {
    errors.push('fragment.nodes must be an array');
  } else {
    for (let i = 0; i < fragment.nodes.length; i++) {
      const node = fragment.nodes[i];
      if (!node.id || !node.type || !node.label) {
        errors.push(`node[${i}] must have id, type, and label`);
      }
    }
  }

  if (!fragment.edges || !Array.isArray(fragment.edges)) {
    errors.push('fragment.edges must be an array');
  } else {
    for (let i = 0; i < fragment.edges.length; i++) {
      const edge = fragment.edges[i];
      if (!edge.source || !edge.target || !edge.type) {
        errors.push(`edge[${i}] must have source, target, and type`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    nodeCount: fragment.nodes?.length || 0,
    edgeCount: fragment.edges?.length || 0
  };
}

export function mergeGraphFragments(fragments) {
  const mergedNodes = new Map();
  const mergedEdges = new Map();

  for (const fragment of fragments) {
    for (const node of fragment.nodes || []) {
      mergedNodes.set(node.id, node);
    }
    for (const edge of fragment.edges || []) {
      mergedEdges.set(edge.id, edge);
    }
  }

  return {
    version: GRAPH_FRAGMENT_VERSION,
    nodes: Array.from(mergedNodes.values()),
    edges: Array.from(mergedEdges.values()),
    metadata: {
      merged_at: new Date().toISOString(),
      fragment_count: fragments.length,
      node_count: mergedNodes.size,
      edge_count: mergedEdges.size
    }
  };
}
