#!/usr/bin/env node

/**
 * GEAkr Conflict Detection Layer
 *
 * Reads:
 * - graph/graph.json
 * - graph/convergence.json
 *
 * Emits:
 * - graph/conflicts.json
 * - graph/conflict-report.md
 *
 * Purpose:
 * Detect architecture-relevant knowledge tensions without flattening branch boundaries.
 * This is heuristic signal detection, not truth determination.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const GRAPH_PATH = path.join(ROOT, 'graph', 'graph.json');
const CONV_PATH = path.join(ROOT, 'graph', 'convergence.json');
const OUT_DIR = path.join(ROOT, 'graph');

const PUBLIC_BRANCHES = new Set(['main', 'current-branch']);
const WORK_BRANCHES = new Set(['work/geakr-enterprise']);
const PCA_BRANCHES = new Set(['personal/pca']);

function readJSON(p) {
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p}. Run extractor/convergence first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function hasAny(xs, set) {
  return xs.some(x => set.has(x));
}

function severity(issue) {
  switch (issue.type) {
    case 'internal_or_pca_without_public_support': return 'high';
    case 'rejected_or_low_trust_support': return 'high';
    case 'pca_work_convergence_not_promoted': return 'medium';
    case 'public_only_no_operational_signal': return 'low';
    case 'single_artifact_signal': return 'low';
    default: return 'medium';
  }
}

function main() {
  const graph = readJSON(GRAPH_PATH);
  const convergence = readJSON(CONV_PATH);

  const issues = [];

  for (const c of convergence) {
    const branches = c.branches || [];
    const sourceLayers = c.source_layers || [];
    const trustStates = c.trust_states || [];
    const hasPublic = hasAny(branches, PUBLIC_BRANCHES) || sourceLayers.includes('public');
    const hasWork = hasAny(branches, WORK_BRANCHES) || sourceLayers.includes('internal');
    const hasPca = hasAny(branches, PCA_BRANCHES) || sourceLayers.includes('personal');
    const hasTrusted = trustStates.includes('trusted') || trustStates.includes('validated') || trustStates.includes('reviewed');
    const hasRejected = trustStates.includes('rejected');
    const hasProvisional = trustStates.includes('provisional') || trustStates.includes('unspecified');

    // Work/PCA-supported idea with no public support.
    if ((hasWork || hasPca) && !hasPublic) {
      issues.push({
        type: 'internal_or_pca_without_public_support',
        concept_id: c.concept_id,
        concept: c.concept,
        confidence: c.confidence,
        branches,
        source_layers: sourceLayers,
        problem: 'Concept appears in internal/work or PCA contexts but lacks public/shared support.',
        recommendation: 'Do not promote or use externally until a public-safe supporting source or sanitized rationale is added.'
      });
    }

    // PCA + work converge but concept has not been promoted.
    if (hasPca && hasWork && !c.promoted_signal) {
      issues.push({
        type: 'pca_work_convergence_not_promoted',
        concept_id: c.concept_id,
        concept: c.concept,
        confidence: c.confidence,
        branches,
        source_layers: sourceLayers,
        problem: 'Concept is reinforced by both PCA and work contexts but has not been promoted to shared/public-safe knowledge.',
        recommendation: 'Review for sanitized promotion to main if the concept is reusable and safe.'
      });
    }

    // Rejected or low-trust support.
    if (hasRejected || (hasProvisional && !hasTrusted && c.confidence >= 50)) {
      issues.push({
        type: 'rejected_or_low_trust_support',
        concept_id: c.concept_id,
        concept: c.concept,
        confidence: c.confidence,
        branches,
        source_layers: sourceLayers,
        trust_states: trustStates,
        problem: 'Concept has meaningful signal but is supported by rejected, unspecified, or provisional material.',
        recommendation: 'Review trust state before relying on this concept for decision support.'
      });
    }

    // Public concept has no work/PCA uptake.
    if (hasPublic && !hasWork && !hasPca && c.confidence >= 50) {
      issues.push({
        type: 'public_only_no_operational_signal',
        concept_id: c.concept_id,
        concept: c.concept,
        confidence: c.confidence,
        branches,
        source_layers: sourceLayers,
        problem: 'Concept is public-source supported but has no work/PCA operational uptake yet.',
        recommendation: 'Consider whether this should inform EA/TPO practice or remain background context.'
      });
    }

    // Single artifact signals are fragile.
    if ((c.artifact_count || 0) === 1 && c.confidence >= 40) {
      issues.push({
        type: 'single_artifact_signal',
        concept_id: c.concept_id,
        concept: c.concept,
        confidence: c.confidence,
        branches,
        source_layers: sourceLayers,
        problem: 'Concept has only one supporting artifact.',
        recommendation: 'Add another source or keep as provisional.'
      });
    }
  }

  const enriched = issues.map(i => ({ ...i, severity: severity(i) }))
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity] || b.confidence - a.confidence;
    });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'conflicts.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    model: 'GEAkr conflict detection v0.1',
    disclaimer: 'Heuristic signal detection only. Conflicts require human review.',
    issues: enriched
  }, null, 2));

  let md = '# GEAkr Conflict Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += '> This is heuristic signal detection. It identifies tensions and evidence gaps; it does not determine truth.\n\n';

  for (const sev of ['high', 'medium', 'low']) {
    const group = enriched.filter(i => i.severity === sev);
    md += `## ${sev.toUpperCase()}\n\n`;
    if (!group.length) {
      md += 'No issues detected.\n\n';
      continue;
    }
    for (const i of group) {
      md += `### ${i.concept}\n`;
      md += `- Type: ${i.type}\n`;
      md += `- Confidence: ${i.confidence}\n`;
      md += `- Branches: ${(i.branches || []).join(', ') || 'n/a'}\n`;
      md += `- Problem: ${i.problem}\n`;
      md += `- Recommendation: ${i.recommendation}\n\n`;
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'conflict-report.md'), md);

  console.log(`Detected ${enriched.length} conflict/evidence-gap signals`);
  console.log('Wrote graph/conflicts.json and graph/conflict-report.md');
}

main();
