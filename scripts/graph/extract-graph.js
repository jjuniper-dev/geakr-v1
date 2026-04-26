#!/usr/bin/env node

/**
 * GEAkr Knowledge Graph Extractor
 *
 * Scans Markdown files for lightweight YAML-like metadata and emits:
 * - graph/nodes.json
 * - graph/edges.json
 * - graph/graph.json
 *
 * This is intentionally dependency-free for prototype use.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'graph');

const DEFAULT_SCAN_DIRS = [
  'knowledge',
  'responses',
  'docs',
  'templates',
  'examples'
];

function hash(input) {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 12);
}

function slugify(value) {
  return String(value || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'untitled';
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function readTitle(markdown, filePath) {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : path.basename(filePath, '.md');
}

function parseMetadata(markdown) {
  const meta = {};
  const lines = markdown.split(/\r?\n/);
  let currentKey = null;

  for (let i = 0; i < Math.min(lines.length, 80); i++) {
    const line = lines[i];
    if (line.trim() === '---' && i > 0) break;

    const kv = line.match(/^([a-zA-Z0-9_\-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1].trim();
      const raw = kv[2].trim();
      meta[currentKey] = raw || [];
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (currentKey && Array.isArray(meta[currentKey]) && listItem) {
      meta[currentKey].push(listItem[1].trim());
    }
  }

  return meta;
}

function getConcepts(meta, markdown) {
  const explicit = meta.concepts;
  if (Array.isArray(explicit)) return explicit.map(slugify).filter(Boolean);
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.split(',').map(slugify).filter(Boolean);
  }

  // Lightweight fallback tags from headings. This is deliberately conservative.
  const concepts = new Set();
  const headingMatches = markdown.matchAll(/^##+\s+(.+)$/gm);
  for (const match of headingMatches) {
    const s = slugify(match[1]);
    if (s && !['summary', 'key-points', 'source-notes', 'constraints-risks'].includes(s)) {
      concepts.add(s);
    }
  }
  return [...concepts].slice(0, 10);
}

function inferType(filePath, meta) {
  const rel = path.relative(ROOT, filePath).replaceAll('\\', '/');
  if (rel.startsWith('responses/')) return 'response';
  if (rel.startsWith('knowledge/')) return 'knowledge';
  if (meta.mode || meta.response_status) return 'response';
  if (meta.source) return 'knowledge';
  if (rel.includes('/skills/') || rel.includes('skills/')) return 'skill';
  return 'document';
}

function inferBranch(meta) {
  return meta.origin_branch || process.env.GEAKR_BRANCH || 'current-branch';
}

function node(id, type, label, props = {}) {
  return { id, type, label, ...props };
}

function edge(source, target, type, props = {}) {
  return { id: `${type}:${source}->${target}`, source, target, type, ...props };
}

function main() {
  const scanDirs = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SCAN_DIRS)
    .map(d => path.join(ROOT, d));

  const markdownFiles = scanDirs.flatMap(walk);
  const nodes = new Map();
  const edges = new Map();

  const addNode = n => nodes.set(n.id, n);
  const addEdge = e => edges.set(e.id, e);

  for (const filePath of markdownFiles) {
    const rel = path.relative(ROOT, filePath).replaceAll('\\', '/');
    const markdown = fs.readFileSync(filePath, 'utf8');
    const meta = parseMetadata(markdown);
    const title = readTitle(markdown, filePath);
    const type = inferType(filePath, meta);
    const branch = inferBranch(meta);
    const sourceLayer = meta.source_layer || 'unspecified';
    const trustState = meta.trust_state || 'unspecified';
    const status = meta.status || meta.response_status || 'unspecified';

    const artifactId = `${type}:${hash(rel)}`;
    const branchId = `branch:${slugify(branch)}`;

    addNode(node(branchId, 'branch', branch, { branch }));
    addNode(node(artifactId, type, title, {
      path: rel,
      branch,
      source_layer: sourceLayer,
      trust_state: trustState,
      status,
      metadata: meta
    }));
    addEdge(edge(artifactId, branchId, 'belongs_to_branch'));

    if (meta.source) {
      const sourceId = `source:${hash(meta.source)}`;
      addNode(node(sourceId, 'source', meta.source, {
        url: meta.source,
        source_type: meta.source_type || 'unspecified',
        source_layer: sourceLayer
      }));
      addEdge(edge(artifactId, sourceId, 'derived_from'));
    }

    if (meta.uses_skill) {
      const skillId = `skill:${slugify(meta.uses_skill)}`;
      addNode(node(skillId, 'skill', meta.uses_skill));
      addEdge(edge(artifactId, skillId, 'uses_skill'));
    }

    const concepts = getConcepts(meta, markdown);
    for (const c of concepts) {
      const conceptId = `concept:${c}`;
      addNode(node(conceptId, 'concept', c.replaceAll('-', ' ')));
      addEdge(edge(artifactId, conceptId, 'supports'));
    }

    if (meta.promotion_status === 'promoted' && meta.origin_branch) {
      const originId = `branch:${slugify(meta.origin_branch)}`;
      addNode(node(originId, 'branch', meta.origin_branch, { branch: meta.origin_branch }));
      addEdge(edge(originId, artifactId, 'promoted_to'));
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const nodeList = [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
  const edgeList = [...edges.values()].sort((a, b) => a.id.localeCompare(b.id));

  fs.writeFileSync(path.join(OUT_DIR, 'nodes.json'), JSON.stringify(nodeList, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'edges.json'), JSON.stringify(edgeList, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'graph.json'), JSON.stringify({ nodes: nodeList, edges: edgeList }, null, 2));

  console.log(`GEAkr graph extracted: ${nodeList.length} nodes, ${edgeList.length} edges`);
  console.log('Wrote graph/nodes.json, graph/edges.json, graph/graph.json');
}

main();
