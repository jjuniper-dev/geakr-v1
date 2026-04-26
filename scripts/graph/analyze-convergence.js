#!/usr/bin/env node

/**
 * GEAkr Concept Convergence Analyzer
 *
 * Reads graph/graph.json and emits:
 * - graph/convergence.json
 * - graph/confidence.json
 *
 * Scores concepts by cross-branch support, source diversity, trust state, and promotion signals.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const GRAPH_PATH = path.join(ROOT, 'graph', 'graph.json');
const OUT_DIR = path.join(ROOT, 'graph');

const branchWeight = {
  main: 1.0,
  'work/geakr-enterprise': 1.15,
  'personal/pca': 0.9,
  'current-branch': 0.75
};

const trustWeight = {
  trusted: 1.0,
  validated: 1.0,
  reviewed: 0.85,
  provisional: 0.55,
  rejected: -1.0,
  unspecified: 0.35
};

function readGraph() {
  if (!fs.existsSync(GRAPH_PATH)) {
    console.error('Missing graph/graph.json. Run: node scripts/graph/extract-graph.js');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
}

function uniq(xs) { return [...new Set(xs.filter(Boolean))]; }

function pct(score) { return Math.max(0, Math.min(100, Math.round(score))); }

function main() {
  const graph = readGraph();
  const nodesById = new Map(graph.nodes.map(n => [n.id, n]));
  const conceptNodes = graph.nodes.filter(n => n.type === 'concept');
  const supports = graph.edges.filter(e => e.type === 'supports');
  const derived = graph.edges.filter(e => e.type === 'derived_from');
  const promoted = graph.edges.filter(e => e.type === 'promoted_to');

  const derivedByArtifact = new Map();
  for (const e of derived) {
    if (!derivedByArtifact.has(e.source)) derivedByArtifact.set(e.source, []);
    derivedByArtifact.get(e.source).push(e.target);
  }

  const promotedTargets = new Set(promoted.map(e => e.target));

  const results = [];

  for (const concept of conceptNodes) {
    const supportingEdges = supports.filter(e => e.target === concept.id);
    const artifacts = supportingEdges.map(e => nodesById.get(e.source)).filter(Boolean);
    const branches = uniq(artifacts.map(a => a.branch));
    const sourceLayers = uniq(artifacts.map(a => a.source_layer));
    const trustStates = uniq(artifacts.map(a => a.trust_state));
    const sources = uniq(artifacts.flatMap(a => derivedByArtifact.get(a.id) || []));

    const branchDiversityScore = Math.min(branches.length, 3) * 20;
    const artifactScore = Math.min(artifacts.length, 8) * 5;
    const sourceDiversityScore = Math.min(sources.length, 5) * 6;
    const promotedScore = artifacts.some(a => promotedTargets.has(a.id)) ? 12 : 0;

    const trustScore = artifacts.reduce((sum, a) => {
      const t = a.trust_state || 'unspecified';
      return sum + (trustWeight[t] ?? 0.35) * 4;
    }, 0);

    const branchModifier = branches.reduce((sum, b) => sum + (branchWeight[b] ?? 0.75), 0);

    const confidence = pct(branchDiversityScore + artifactScore + sourceDiversityScore + promotedScore + trustScore + branchModifier);

    let signal = 'weak';
    if (confidence >= 75) signal = 'strong';
    else if (confidence >= 50) signal = 'moderate';

    results.push({
      concept_id: concept.id,
      concept: concept.label,
      confidence,
      signal,
      supporting_artifacts: artifacts.map(a => ({
        id: a.id,
        label: a.label,
        path: a.path,
        branch: a.branch,
        source_layer: a.source_layer,
        trust_state: a.trust_state,
        status: a.status
      })),
      branches,
      source_layers: sourceLayers,
      trust_states: trustStates,
      source_count: sources.length,
      artifact_count: artifacts.length,
      promoted_signal: artifacts.some(a => promotedTargets.has(a.id)),
      interpretation: signal === 'strong'
        ? 'Concept is supported across multiple signals and is a candidate for promotion or reuse.'
        : signal === 'moderate'
          ? 'Concept has useful support but should be reviewed before treating as stable.'
          : 'Concept is provisional or weakly supported.'
    });
  }

  results.sort((a, b) => b.confidence - a.confidence || a.concept.localeCompare(b.concept));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'convergence.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'confidence.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    scoring_model: 'GEAkr prototype confidence v0.1',
    notes: [
      'Confidence is heuristic, not truth.',
      'Strong cross-branch convergence indicates a useful signal, not automatic validation.',
      'Internal or personal artifacts must still follow promotion policy before sharing.'
    ],
    concepts: results
  }, null, 2));

  console.log(`Analyzed ${results.length} concepts`);
  console.log('Wrote graph/convergence.json and graph/confidence.json');
}

main();
