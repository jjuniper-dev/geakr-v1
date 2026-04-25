#!/usr/bin/env node

/**
 * Chad Mode — EA Decision View Generator
 *
 * Reads graph/graph.json and graph/convergence.json,
 * applies the chad-mode filter, and emits:
 * - graph/chad-view.json
 * - graph/chad-report.md
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const GRAPH = path.join(ROOT, 'graph', 'graph.json');
const CONV = path.join(ROOT, 'graph', 'convergence.json');
const CFG = path.join(ROOT, 'graph', 'views', 'chad-mode.json');

function readJSON(p) {
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function containsAny(hay, needles) {
  const s = String(hay || '').toLowerCase();
  return needles.some(n => s.includes(n));
}

function main() {
  const graph = readJSON(GRAPH);
  const conv = readJSON(CONV);
  const cfg = readJSON(CFG);

  const convByConcept = new Map(conv.map(c => [c.concept_id, c]));

  // Select concept nodes by keyword + confidence
  const concepts = graph.nodes.filter(n => n.type === 'concept');
  const selectedConcepts = concepts.filter(c => {
    const match = containsAny(c.id + ' ' + c.label, cfg.include_concepts_matching);
    const score = convByConcept.get(c.id)?.confidence ?? 0;
    return match && score >= cfg.minimum_confidence;
  });

  const conceptIds = new Set(selectedConcepts.map(c => c.id));

  // Pull supporting artifacts for selected concepts
  const supports = graph.edges.filter(e => e.type === 'supports' && conceptIds.has(e.target));
  const artifactIds = new Set(supports.map(e => e.source));

  // Keep edges that connect selected concepts/artifacts
  const edges = graph.edges.filter(e => {
    const keepType = cfg.preferred_edge_types.includes(e.type);
    const connects = conceptIds.has(e.source) || conceptIds.has(e.target) || artifactIds.has(e.source) || artifactIds.has(e.target);
    return keepType && connects;
  });

  const nodes = graph.nodes.filter(n => conceptIds.has(n.id) || artifactIds.has(n.id) || n.type === 'branch');

  // Build report
  const top = [...selectedConcepts]
    .map(c => ({ c, score: convByConcept.get(c.id)?.confidence ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  let md = `# Chad Mode — EA Decision Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;

  md += `## Top Decision Signals\n`;
  for (const { c, score } of top) {
    md += `- **${c.label}** (confidence: ${score})\n`;
  }

  md += `\n## Risks & Constraints\n`;
  for (const { c } of top) {
    const entry = convByConcept.get(c.id);
    if (!entry) continue;
    const risky = (entry.trust_states || []).includes('provisional');
    if (risky) md += `- ${c.label}: includes provisional inputs\n`;
  }

  md += `\n## Platform Implications\n`;
  for (const { c } of top) {
    if (containsAny(c.label, ['platform', 'cloud', 'azure', 'mcp', 'integration'])) {
      md += `- ${c.label}\n`;
    }
  }

  md += `\n## Capability Implications\n`;
  for (const { c } of top) {
    if (containsAny(c.label, ['capability', 'workflow', 'process', 'service'])) {
      md += `- ${c.label}\n`;
    }
  }

  md += `\n## Promotion Candidates\n`;
  for (const { c, score } of top) {
    if (score >= 70) md += `- ${c.label} (candidate)\n`;
  }

  const outDir = path.join(ROOT, 'graph');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'chad-view.json'), JSON.stringify({ nodes, edges }, null, 2));
  fs.writeFileSync(path.join(outDir, 'chad-report.md'), md);

  console.log('Wrote graph/chad-view.json and graph/chad-report.md');
}

main();
