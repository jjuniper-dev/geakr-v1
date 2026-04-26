import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { evaluatePolicyGate, OPERATIONS } from './policy/gate.js';
import { enforcePolicy } from './core/control-plane/policy-enforcer.js';
import { buildContext, addTraceEntry } from './core/control-plane/execution-context.js';
import { execute as controlPlaneExecute } from './core/control-plane/index.js';
import { initializeAdapter, getProvider } from './core/llm-adapter/index.js';
import { audit } from './core/audit-compliance/index.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

const CAPTURE_PIPELINE_VERSION = '0.4.0-policy-gated-capture';
const SANITIZER_VERSION = '0.1.0-regex-risk-gate';
const GRAPH_FRAGMENT_VERSION = '0.1.0-capture-fragment';

const VALID_OPENAI_MODELS = ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_MODEL = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

let llmProvider = null;

function validateConfig() {
  const errors = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (!VALID_OPENAI_MODELS.includes(OPENAI_MODEL)) {
    errors.push(`OPENAI_MODEL must be one of: ${VALID_OPENAI_MODELS.join(', ')}. Got: ${OPENAI_MODEL}`);
  }

  if (!process.env.GEAKR_API_KEY) {
    console.warn('⚠️  GEAKR_API_KEY not set. /extract endpoint will be public (not recommended for production)');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  llmProvider = initializeAdapter();
  console.log(`✓ Config validated. LLM Adapter: ${llmProvider.name}, Model: ${llmProvider.model}`);
}

const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 100;

function cleanupOldCounts() {
  const now = Date.now();
  for (const [key, timestamps] of requestCounts.entries()) {
    const filtered = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (filtered.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, filtered);
    }
  }
}

function rateLimitMiddleware(req, res, next) {
  const clientIp = req.ip || req.socket.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, []);
  }

  const timestamps = requestCounts.get(clientIp);
  timestamps.push(now);

  if (timestamps.length > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ ok: false, error: 'Rate limit exceeded. Max 100 requests per minute.' });
  }

  if (Math.random() < 0.01) cleanupOldCounts();

  next();
}

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const requiredKey = process.env.GEAKR_API_KEY;

  if (requiredKey && (!apiKey || apiKey !== requiredKey)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized. Provide valid X-API-Key header.' });
  }

  next();
}

app.use(rateLimitMiddleware);

function slugify(s) { return (s || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 70) || 'untitled'; }
function today() { return new Date().toISOString().slice(0, 10); }
function shortHash(s) { return crypto.createHash('sha256').update(s).digest('hex').slice(0, 8); }
function hash12(s) { return crypto.createHash('sha256').update(s).digest('hex').slice(0, 12); }
function buildFilename(title, url) { return `${today()}-${slugify(title || url)}-${shortHash(url)}.md`; }

function sanitizerSeverity(type) {
  if (['credit_card_like_number', 'bearer_token', 'api_key_like_value', 'sin_like_number'].includes(type)) return 'high';
  if (['email', 'phone'].includes(type)) return 'medium';
  return 'low';
}

function getRuntimeConfig(reqBody = {}) {
  return {
    mode: reqBody.runtimeMode || process.env.RUNTIME_MODE || 'metadata_only',
    hosting: process.env.RUNTIME_HOSTING || 'other',
    endpoint: process.env.RUNTIME_ENDPOINT || 'openai_api'
  };
}

function getSourceConfig(reqBody = {}) {
  return {
    classification: reqBody.sourceClassification || 'unknown',
    contextLayer: reqBody.contextLayer || 'personal'
  };
}

async function appendGateAudit(auditEntry) {
  const dir = path.join(process.cwd(), 'audit', 'gate-decisions');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${today()}.jsonl`);
  await fs.appendFile(file, `${JSON.stringify(auditEntry)}\n`, 'utf-8');
}

async function fetchReadable(url) {
  const { data } = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(data);
  const title = ($('title').text() || '').trim();
  $('script,style,noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text: text.slice(0, 20000) };
}

function sanitizeText(input) {
  let text = String(input || '');
  const findings = [];
  const replacements = [
    { name: 'email', regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, repl: '[REDACTED_EMAIL]' },
    { name: 'phone', regex: /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g, repl: '[REDACTED_PHONE]' },
    { name: 'sin_like_number', regex: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g, repl: '[REDACTED_ID]' },
    { name: 'credit_card_like_number', regex: /\b(?:\d[ -]*?){13,16}\b/g, repl: '[REDACTED_CARD]' },
    { name: 'bearer_token', regex: /Bearer\s+[A-Za-z0-9._\-]+/g, repl: '[REDACTED_TOKEN]' },
    { name: 'api_key_like_value', regex: /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*[^\s,;]+/gi, repl: '[REDACTED_SECRET]' }
  ];
  for (const r of replacements) {
    const matches = text.match(r.regex) || [];
    if (matches.length) findings.push({ category: r.name, severity: sanitizerSeverity(r.name), count: matches.length });
    text = text.replace(r.regex, r.repl);
  }
  return { version: SANITIZER_VERSION, text, findings };
}

const knowledgeSchema = { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, source_type: { type: 'string' }, confidence: { type: 'string', enum: ['low', 'medium', 'high'] }, summary: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 6 }, key_points: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 8 }, architecture_implications: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }, geakr_implications: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }, constraints_risks: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }, concepts: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 10 } }, required: ['title','source_type','confidence','summary','key_points','architecture_implications','geakr_implications','constraints_risks','concepts'] };

async function invokeExternalStructuredExtraction({ url, title, sanitized }) {
  const provider = getProvider();
  const startTime = Date.now();

  const result = await provider.structuredExtract({
    schema: knowledgeSchema,
    messages: [
      {
        role: 'system',
        content: 'Extract only from provided sanitized content. Do not infer unsupported facts. Return JSON only.'
      },
      {
        role: 'user',
        content: `URL: ${url}\nPage title: ${title}\nPipeline version: ${CAPTURE_PIPELINE_VERSION}\nSanitizer findings: ${JSON.stringify(sanitized.findings)}\n\nContent:\n${sanitized.text}`
      }
    ],
    temperature: 0.1
  });

  const duration = Date.now() - startTime;

  await audit.logLLMCall({
    provider: provider.name,
    model: provider.model,
    operation: 'structuredExtract',
    inputTokens: 0,
    outputTokens: 0,
    costEstimate: 0,
    userId: 'anonymous',
    duration
  });

  return result;
}

function list(items) { return items.map(x => `- ${x}`).join('\n'); }
function renderKnowledgeMarkdown(data, { url, sanitizer }) { return `# ${data.title}\n\nsource: ${url}\nsource_type: ${data.source_type}\nstatus: extracted\nlast_updated: ${today()}\nconfidence: ${data.confidence}\npipeline_version: ${CAPTURE_PIPELINE_VERSION}\nsanitizer_version: ${SANITIZER_VERSION}\npca_state: captured\ntrust_state: provisional\nreconciliation_status: not_reconciled\nsource_layer: public\ncapture_method: mobile_url\nsanitizer_findings: ${JSON.stringify(sanitizer?.findings || [])}\nconcepts:\n${data.concepts.map(c => `  - ${slugify(c)}`).join('\n')}\n\n---\n\n## Summary\n${list(data.summary)}\n\n## Key Points\n${list(data.key_points)}\n\n## Architecture Implications\n${list(data.architecture_implications)}\n\n## GEAkr Implications\n${list(data.geakr_implications)}\n\n## Constraints / Risks\n${list(data.constraints_risks)}\n`; }

function buildGraphFragment(data, { url, filename }) { const knowledgeId = `knowledge:${hash12(filename)}`; const sourceId = `source:${hash12(url)}`; const branch = process.env.GITHUB_BRANCH || 'main'; const nodes = [{ id: knowledgeId, type: 'knowledge', label: data.title, path: `knowledge/${filename}`, branch, source_layer: 'public', trust_state: 'provisional', status: 'extracted', pipeline_version: CAPTURE_PIPELINE_VERSION }, { id: sourceId, type: 'source', label: url, url, source_type: data.source_type, source_layer: 'public' }, { id: `branch:${slugify(branch)}`, type: 'branch', label: branch, branch }]; const edges = [{ id: `derived_from:${knowledgeId}->${sourceId}`, source: knowledgeId, target: sourceId, type: 'derived_from' }, { id: `belongs_to_branch:${knowledgeId}->branch:${slugify(branch)}`, source: knowledgeId, target: `branch:${slugify(branch)}`, type: 'belongs_to_branch' }]; for (const c of data.concepts) { const cid = `concept:${slugify(c)}`; nodes.push({ id: cid, type: 'concept', label: slugify(c).replaceAll('-', ' ') }); edges.push({ id: `supports:${knowledgeId}->${cid}`, source: knowledgeId, target: cid, type: 'supports' }); } return { version: GRAPH_FRAGMENT_VERSION, generated_at: new Date().toISOString(), nodes, edges }; }

async function writeToGitHub({ content, filename, basePathOverride }) { const token = process.env.GITHUB_TOKEN; const owner = process.env.GITHUB_OWNER; const repo = process.env.GITHUB_REPO; const branch = process.env.GITHUB_BRANCH || 'main'; const basePath = basePathOverride || process.env.KNOWLEDGE_PATH || 'knowledge'; if (!token || !owner || !repo) return null; const filePath = `${basePath}/${filename}`; const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`; let sha; try { const existing = await axios.get(apiUrl, { headers: { Authorization: `Bearer ${token}` } }); sha = existing.data.sha; } catch (_) {} const put = await axios.put(apiUrl, { message: `Capture artifact: ${filename}`, content: Buffer.from(content).toString('base64'), branch, ...(sha ? { sha } : {}) }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }); return { path: filePath, commit: put.data.commit?.sha, updatedExistingFile: Boolean(sha) }; }

// Phase 3 Pattern: Operations through Control Plane
// Currently /extract calls functions directly for MVP compatibility.
// Phase 3 will refactor this to route through controlPlane.execute():
//
// const fetchResult = await controlPlaneExecute({
//   operation: 'fetch',
//   input: { url, fetchReadable },
//   context
// });
//
// This keeps all operations under policy enforcement and provides a single trace point.

app.post('/extract', authMiddleware, async (req, res) => {
  try {
    const { url, writeToGitHub: shouldWrite = false, writeGraphFragment = true, userOverride } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });

    const { title, text } = await fetchReadable(url);
    const sanitized = sanitizeText(text);
    const source = getSourceConfig(req.body || {});
    const runtime = getRuntimeConfig(req.body || {});

    const context = buildContext({
      req: { userOverride },
      sanitized,
      runtime,
      source: { url, ...source }
    });

    const gateDecision = await enforcePolicy(context);

    await appendGateAudit(gateDecision.auditEntry);
    await audit.logGateDecision(gateDecision.auditEntry);

    if (gateDecision.decision === 'BLOCK') {
      return res.status(200).json({
        ok: true,
        status: 'blocked',
        capture_pipeline_version: CAPTURE_PIPELINE_VERSION,
        title,
        url,
        message: gateDecision.reason,
        allowedOperations: gateDecision.allowedOperations,
        audit: gateDecision.auditEntry,
        metadata: { url, title }
      });
    }

    if (!gateDecision.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API)) {
      return res.status(200).json({
        ok: true,
        status: 'local_or_metadata_only',
        capture_pipeline_version: CAPTURE_PIPELINE_VERSION,
        title,
        url,
        message: 'Policy gate did not permit external API invocation.',
        allowedOperations: gateDecision.allowedOperations,
        audit: gateDecision.auditEntry,
        metadata: { url, title }
      });
    }

    const structured = await invokeExternalStructuredExtraction({ url, title, sanitized });
    const filename = buildFilename(structured.title || title, url);
    const markdown = renderKnowledgeMarkdown(structured, { url, sanitizer: sanitized });
    const graphFragment = buildGraphFragment(structured, { url, filename });
    const graphFilename = filename.replace(/\.md$/, '.graph.json');
    let github = null, graphGithub = null;
    if (shouldWrite) {
      github = await writeToGitHub({ content: markdown, filename });
      if (writeGraphFragment) graphGithub = await writeToGitHub({ content: JSON.stringify(graphFragment, null, 2), filename: graphFilename, basePathOverride: process.env.GRAPH_FRAGMENTS_PATH || 'graph/fragments' });
    }
    res.json({ ok: true, status: 'extracted', capture_pipeline_version: CAPTURE_PIPELINE_VERSION, title: structured.title, filename, structured, markdown, graphFragment, graphFilename, sanitizer: { version: sanitized.version, findings: sanitized.findings }, gate: { decision: gateDecision.decision, effectiveMode: gateDecision.effectiveMode, allowedOperations: gateDecision.allowedOperations, reason: gateDecision.reason }, github, graphGithub });
  } catch (e) {
    res.status(500).json({ ok: false, capture_pipeline_version: CAPTURE_PIPELINE_VERSION, error: e.message });
  }
});

validateConfig();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`\n🚀 GEAkr Mobile Capture Server Ready`);
  console.log(`   Version: ${CAPTURE_PIPELINE_VERSION}`);
  console.log(`   Model: ${OPENAI_MODEL}`);
  console.log(`   Port: ${port}`);
  if (process.env.GEAKR_API_KEY) {
    console.log(`   Auth: Enabled (X-API-Key required)`);
  } else {
    console.log(`   Auth: DISABLED (endpoint is public)`);
  }
  console.log();
});
