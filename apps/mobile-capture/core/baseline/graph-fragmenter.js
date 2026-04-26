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

export function buildGraphFragment(data, { url, filename }) {
  const knowledgeId = `knowledge:${hash12(filename)}`;
  const sourceId = `source:${hash12(url)}`;
  const branch = process.env.GITHUB_BRANCH || 'main';

  const nodes = [
    {
      id: knowledgeId,
      type: 'knowledge',
      label: data.title,
      path: `knowledge/${filename}`,
      branch,
      source_layer: 'public',
      trust_state: 'provisional',
      status: 'extracted',
      pipeline_version: CAPTURE_PIPELINE_VERSION
    },
    {
      id: sourceId,
      type: 'source',
      label: url,
      url,
      source_type: data.source_type,
      source_layer: 'public'
    },
    {
      id: `branch:${slugify(branch)}`,
      type: 'branch',
      label: branch,
      branch
    }
  ];

  const edges = [
    {
      id: `derived_from:${knowledgeId}->${sourceId}`,
      source: knowledgeId,
      target: sourceId,
      type: 'derived_from'
    },
    {
      id: `belongs_to_branch:${knowledgeId}->branch:${slugify(branch)}`,
      source: knowledgeId,
      target: `branch:${slugify(branch)}`,
      type: 'belongs_to_branch'
    }
  ];

  for (const c of data.concepts) {
    const cid = `concept:${slugify(c)}`;
    nodes.push({
      id: cid,
      type: 'concept',
      label: slugify(c).replaceAll('-', ' ')
    });
    edges.push({
      id: `supports:${knowledgeId}->${cid}`,
      source: knowledgeId,
      target: cid,
      type: 'supports'
    });
  }

  return {
    version: GRAPH_FRAGMENT_VERSION,
    generated_at: new Date().toISOString(),
    nodes,
    edges
  };
}
