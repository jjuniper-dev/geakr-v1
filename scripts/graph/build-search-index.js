#!/usr/bin/env node

/**
 * GEAkr Search Index Builder
 *
 * Reads graph/graph.json plus optional graph/confidence.json and graph/conflicts.json.
 * Emits graph/search-index.json for the UI.
 *
 * This is a lightweight lexical/semantic-ish index for v0.1.
 * True embeddings/vector search can be added later behind the same output contract.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const GRAPH_PATH = path.join(ROOT, 'graph', 'graph.json');
const CONF_PATH = path.join(ROOT, 'graph', 'confidence.json');
const CONFLICT_PATH = path.join(ROOT, 'graph', 'conflicts.json');
const OUT_PATH = path.join(ROOT, 'graph', 'search-index.json');

function readJSON(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function main() {
  const graph = readJSON(GRAPH_PATH, null);
  if (!graph) {
    console.error('Missing graph/graph.json. Run extract-graph first.');
    process.exit(1);
  }

  const confidence = readJSON(CONF_PATH, { concepts: [] });
  const conflicts = readJSON(CONFLICT_PATH, { issues: [] });

  const confidenceByConcept = new Map((confidence.concepts || []).map(c => [c.concept_id, c]));
  const conflictsByConcept = new Map();
  for (const issue of conflicts.issues || []) {
    if (!conflictsByConcept.has(issue.concept_id)) conflictsByConcept.set(issue.concept_id, []);
    conflictsByConcept.get(issue.concept_id).push(issue);
  }

  const edgesByNode = new Map();
  for (const e of graph.edges || []) {
    if (!edgesByNode.has(e.source)) edgesByNode.set(e.source, []);
    if (!edgesByNode.has(e.target)) edgesByNode.set(e.target, []);
    edgesByNode.get(e.source).push(e);
    edgesByNode.get(e.target).push(e);
  }

  const items = (graph.nodes || []).map(n => {
    const conf = confidenceByConcept.get(n.id);
    const issues = conflictsByConcept.get(n.id) || [];
    const edgeText = (edgesByNode.get(n.id) || []).map(e => `${e.type} ${e.source} ${e.target}`).join(' ');
    const metaText = JSON.stringify(n.metadata || {});
    const searchText = norm([
      n.label,
      n.type,
      n.branch,
      n.source_layer,
      n.trust_state,
      n.status,
      n.path,
      metaText,
      edgeText,
      conf?.signal,
      conf?.interpretation,
      issues.map(i => `${i.type} ${i.severity} ${i.problem} ${i.recommendation}`).join(' ')
    ].join(' '));

    return {
      id: n.id,
      label: n.label,
      type: n.type,
      branch: n.branch || null,
      source_layer: n.source_layer || null,
      trust_state: n.trust_state || null,
      status: n.status || null,
      path: n.path || null,
      confidence: conf?.confidence ?? null,
      signal: conf?.signal ?? null,
      issues: issues.map(i => ({
        type: i.type,
        severity: i.severity,
        problem: i.problem,
        recommendation: i.recommendation
      })),
      search_text: searchText
    };
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify({
    generated_at: new Date().toISOString(),
    mode: 'lexical-semantic-lite-v0.1',
    items
  }, null, 2));

  console.log(`Wrote graph/search-index.json (${items.length} items)`);
}

main();
