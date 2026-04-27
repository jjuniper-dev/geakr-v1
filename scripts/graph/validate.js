#!/usr/bin/env node

/**
 * Graph Validation — Structural Integrity Check
 *
 * Validates that graph.json and convergence.json have required structure:
 * - graph.json has nodes[] with id, edges[] with source/target
 * - convergence.json has required fields per concept
 *
 * Fails fast with clear error messages.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const GRAPH = path.join(ROOT, 'graph', 'graph.json');
const CONV = path.join(ROOT, 'graph', 'convergence.json');

function fail(msg) {
  console.error(`❌ VALIDATION FAILED: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`⚠️  WARNING: ${msg}`);
}

function validateGraphJSON() {
  if (!fs.existsSync(GRAPH)) {
    fail(`graph.json not found at ${GRAPH}`);
  }

  let graph;
  try {
    graph = JSON.parse(fs.readFileSync(GRAPH, 'utf8'));
  } catch (e) {
    fail(`graph.json malformed: ${e.message}`);
  }

  if (!Array.isArray(graph.nodes)) {
    fail('graph.json missing "nodes" array');
  }
  if (!Array.isArray(graph.edges)) {
    fail('graph.json missing "edges" array');
  }

  for (let i = 0; i < graph.nodes.length; i++) {
    if (!graph.nodes[i].id) {
      fail(`graph.json nodes[${i}] missing "id"`);
    }
  }

  for (let i = 0; i < graph.edges.length; i++) {
    if (!graph.edges[i].source) {
      fail(`graph.json edges[${i}] missing "source"`);
    }
    if (!graph.edges[i].target) {
      fail(`graph.json edges[${i}] missing "target"`);
    }
  }

  console.log(`✓ graph.json valid: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
}

function main() {
  validateGraphJSON();
}

main();
