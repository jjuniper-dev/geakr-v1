import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import crypto from 'crypto';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

function slugify(s) {
  return (s || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 70) || 'untitled';
}
function today() { return new Date().toISOString().slice(0, 10); }
function shortHash(s) { return crypto.createHash('sha256').update(s).digest('hex').slice(0, 8); }
function hash12(s) { return crypto.createHash('sha256').update(s).digest('hex').slice(0, 12); }
function buildFilename(title, url) { return `${today()}-${slugify(title || url)}-${shortHash(url)}.md`; }

async function fetchReadable(url) {
  const { data } = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(data);
  const title = ($('title').text() || '').trim();
  $('script,style,noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text: text.slice(0, 20000) };
}

const knowledgeSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    title: { type: 'string' },
    source_type: { type: 'string' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    summary: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 6 },
    key_points: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 8 },
    architecture_implications: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 },
    geakr_implications: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 },
    constraints_risks: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 },
    concepts: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 10 }
  },
  required: ['title','source_type','confidence','summary','key_points','architecture_implications','geakr_implications','constraints_risks','concepts']
};

async function extractStructured({ url, title, text }) {
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'Extract only from provided content. Do not infer unsupported facts. Return JSON only.' },
      { role: 'user', content: `URL: ${url}\nPage title: ${title}\n\nContent:\n${text}` }
    ],
    temperature: 0.1,
    response_format: { type: 'json_schema', json_schema: { name: 'geakr_knowledge_extraction', strict: true, schema: knowledgeSchema } }
  });
  return JSON.parse(completion.choices[0].message.content);
}

function list(items) { return items.map(x => `- ${x}`).join('\n'); }

function renderKnowledgeMarkdown(data, { url }) {
  return `# ${data.title}\n\nsource: ${url}\nsource_type: ${data.source_type}\nstatus: extracted\nlast_updated: ${today()}\nconfidence: ${data.confidence}\npca_state: captured\ntrust_state: provisional\nreconciliation_status: not_reconciled\nsource_layer: public\ncapture_method: mobile_url\nconcepts:\n${data.concepts.map(c => `  - ${slugify(c)}`).join('\n')}\n\n---\n\n## Summary\n${list(data.summary)}\n\n## Key Points\n${list(data.key_points)}\n\n## Architecture Implications\n${list(data.architecture_implications)}\n\n## GEAkr Implications\n${list(data.geakr_implications)}\n\n## Constraints / Risks\n${list(data.constraints_risks)}\n`;
}

function buildGraphFragment(data, { url, filename }) {
  const knowledgeId = `knowledge:${hash12(filename)}`;
  const sourceId = `source:${hash12(url)}`;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const nodes = [
    { id: knowledgeId, type: 'knowledge', label: data.title, path: `knowledge/${filename}`, branch, source_layer: 'public', trust_state: 'provisional', status: 'extracted' },
    { id: sourceId, type: 'source', label: url, url, source_type: data.source_type, source_layer: 'public' },
    { id: `branch:${slugify(branch)}`, type: 'branch', label: branch, branch }
  ];
  const edges = [
    { id: `derived_from:${knowledgeId}->${sourceId}`, source: knowledgeId, target: sourceId, type: 'derived_from' },
    { id: `belongs_to_branch:${knowledgeId}->branch:${slugify(branch)}`, source: knowledgeId, target: `branch:${slugify(branch)}`, type: 'belongs_to_branch' }
  ];
  for (const c of data.concepts) {
    const cid = `concept:${slugify(c)}`;
    nodes.push({ id: cid, type: 'concept', label: slugify(c).replaceAll('-', ' ') });
    edges.push({ id: `supports:${knowledgeId}->${cid}`, source: knowledgeId, target: cid, type: 'supports' });
  }
  return { generated_at: new Date().toISOString(), nodes, edges };
}

async function writeToGitHub({ content, filename, basePathOverride }) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const basePath = basePathOverride || process.env.KNOWLEDGE_PATH || 'knowledge';
  if (!token || !owner || !repo) return null;
  const filePath = `${basePath}/${filename}`;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  let sha;
  try { const existing = await axios.get(apiUrl, { headers: { Authorization: `Bearer ${token}` } }); sha = existing.data.sha; } catch (_) {}
  const put = await axios.put(apiUrl, { message: `Capture artifact: ${filename}`, content: Buffer.from(content).toString('base64'), branch, ...(sha ? { sha } : {}) }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  return { path: filePath, commit: put.data.commit?.sha, updatedExistingFile: Boolean(sha) };
}

app.post('/extract', async (req, res) => {
  try {
    const { url, writeToGitHub: shouldWrite = false, writeGraphFragment = true } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });
    const { title, text } = await fetchReadable(url);
    const structured = await extractStructured({ url, title, text });
    const filename = buildFilename(structured.title || title, url);
    const markdown = renderKnowledgeMarkdown(structured, { url });
    const graphFragment = buildGraphFragment(structured, { url, filename });
    const graphFilename = filename.replace(/\.md$/, '.graph.json');
    let github = null, graphGithub = null;
    if (shouldWrite) {
      github = await writeToGitHub({ content: markdown, filename });
      if (writeGraphFragment) graphGithub = await writeToGitHub({ content: JSON.stringify(graphFragment, null, 2), filename: graphFilename, basePathOverride: process.env.GRAPH_FRAGMENTS_PATH || 'graph/fragments' });
    }
    res.json({ ok: true, title: structured.title, filename, structured, markdown, graphFragment, graphFilename, github, graphGithub });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on :${port}`));
