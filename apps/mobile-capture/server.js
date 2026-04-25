import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import crypto from 'crypto';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

function slugify(s) {
  return (s || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 70) || 'untitled';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function shortHash(s) {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 8);
}

function buildFilename(title, url) {
  const date = today();
  const slug = slugify(title || url);
  const hash = shortHash(url);
  return `${date}-${slug}-${hash}.md`;
}

async function fetchReadable(url) {
  const { data } = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(data);
  const title = ($('title').text() || '').trim();
  $('script,style,noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text: text.slice(0, 20000) };
}

async function chatCompletion(messages, temperature = 0.2) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const resp = await axios.post(
    `${OPENAI_BASE_URL}/chat/completions`,
    { model: OPENAI_MODEL, messages, temperature },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );

  return (resp.data.choices?.[0]?.message?.content || '').trim();
}

async function extractKnowledge({ url, title, text }) {
  const prompt = `Extract structured knowledge from the provided webpage content.\n\nReturn EXACTLY in this Markdown template (no extra prose):\n\n# ${title || '<Title>'}\n\nsource: ${url}\nsource_type: government_policy\nstatus: extracted\nlast_updated: ${today()}\nconfidence: medium\npca_state: captured\ntrust_state: provisional\nreconciliation_status: not_reconciled\nsource_layer: public\ncapture_method: mobile_url\n\n---\n\n## Summary\n- ...\n- ...\n- ...\n\n## Key Points\n### 1. ...\n- ...\n\n### 2. ...\n- ...\n\n### 3. ...\n- ...\n\n---\n\n## Architecture Implications\n- ...\n\n## GEAkr Implications\n- ...\n\n## Constraints / Risks\n- ...\n`;

  return chatCompletion([
    { role: 'system', content: 'You are a precise analyst. Do not hallucinate. Only use provided content.' },
    { role: 'user', content: `${prompt}\n\nURL: ${url}\n\nCONTENT:\n${text}` }
  ]);
}

async function runPcaFlow({ url, title, knowledgeMarkdown, userQuestion }) {
  const prompt = `Run an immediate PCA-style synthesis, reconciliation, and decision-support pass on the captured knowledge.\n\nUse only the extracted knowledge below. Do not infer facts beyond the source.\n\nReturn Markdown in this exact structure:\n\n# PCA Immediate Response — ${title || 'Captured Source'}\n\nsource: ${url}\nresponse_status: synthesized\nlast_updated: ${today()}\nmode: immediate_response\n\n---\n\n## Fast Take\n- ...\n\n## Why This Matters\n- ...\n\n## Reconciliation Check\n- What this appears to confirm:\n- What remains uncertain:\n- What may conflict with existing assumptions:\n\n## Decision Support\n- Suggested action:\n- Priority: low | medium | high\n- Follow-up needed:\n\n## Fit With Current Architecture Thinking\n- ...\n\n## Save / Discard Recommendation\n- Keep as provisional | Promote to review | Discard\n\nUser question or intent, if provided:\n${userQuestion || '(none)'}\n\nExtracted knowledge:\n${knowledgeMarkdown}`;

  return chatCompletion([
    { role: 'system', content: 'You support a personal cognitive architecture. Be careful, structured, and action-oriented. Keep source uncertainty visible.' },
    { role: 'user', content: prompt }
  ], 0.25);
}

async function writeToGitHub({ content, filename, basePathOverride }) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const basePath = basePathOverride || process.env.KNOWLEDGE_PATH || 'knowledge';

  if (!token || !owner || !repo) return null;

  const path = `${basePath}/${filename}`;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  let sha = undefined;
  try {
    const get = await axios.get(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
    sha = get.data.sha;
  } catch (_) {
    // not found is fine
  }

  const body = {
    message: `Capture artifact: ${filename}`,
    content: Buffer.from(content).toString('base64'),
    branch,
    ...(sha ? { sha } : {})
  };

  const put = await axios.put(apiUrl, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return { path, commit: put.data.commit?.sha, updatedExistingFile: Boolean(sha) };
}

app.post('/extract', async (req, res) => {
  try {
    const { url, writeToGitHub, mode = 'capture_only', userQuestion } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });

    const { title, text } = await fetchReadable(url);
    const markdown = await extractKnowledge({ url, title, text });

    const filename = buildFilename(title, url);

    let github = null;
    if (writeToGitHub) {
      github = await writeToGitHub({ content: markdown, filename });
    }

    let responseMarkdown = null;
    let responseFilename = null;
    let responseGithub = null;

    if (mode === 'capture_and_respond') {
      responseMarkdown = await runPcaFlow({ url, title, knowledgeMarkdown: markdown, userQuestion });
      responseFilename = filename.replace(/\.md$/, '-pca-response.md');
      if (writeToGitHub) {
        responseGithub = await writeToGitHub({
          content: responseMarkdown,
          filename: responseFilename,
          basePathOverride: process.env.RESPONSES_PATH || 'responses'
        });
      }
    }

    return res.json({
      ok: true,
      title,
      filename,
      markdown,
      github,
      mode,
      responseFilename,
      responseMarkdown,
      responseGithub
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on :${port}`));
