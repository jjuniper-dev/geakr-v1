import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';

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
    .slice(0, 80) || 'untitled';
}

async function fetchReadable(url) {
  const { data } = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(data);
  const title = ($('title').text() || '').trim();
  $('script,style,noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text: text.slice(0, 20000) };
}

async function callLLM({ url, title, text }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const prompt = `Extract structured knowledge from the provided webpage content.\n\nReturn EXACTLY in this Markdown template (no extra prose):\n\n# ${title || '<Title>'}\n\nsource: ${url}\nsource_type: government_policy\nstatus: extracted\nlast_updated: ${new Date().toISOString().slice(0,10)}\nconfidence: medium\n\n---\n\n## Summary\n- ...\n- ...\n- ...\n\n## Key Points\n### 1. ...\n- ...\n\n### 2. ...\n- ...\n\n### 3. ...\n- ...\n\n---\n\n## Architecture Implications\n- ...\n\n## GEAkr Implications\n- ...\n\n## Constraints / Risks\n- ...\n`;

  const resp = await axios.post(
    `${OPENAI_BASE_URL}/chat/completions`,
    {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a precise analyst. Do not hallucinate. Only use provided content.' },
        { role: 'user', content: `${prompt}\n\nURL: ${url}\n\nCONTENT:\n${text}` }
      ],
      temperature: 0.2
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );

  const md = resp.data.choices?.[0]?.message?.content || '';
  return md.trim();
}

async function writeToGitHub({ content, filename }) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const basePath = process.env.KNOWLEDGE_PATH || 'knowledge';

  if (!token || !owner || !repo) return null;

  const path = `${basePath}/${filename}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Get existing SHA if file exists
  let sha = undefined;
  try {
    const get = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    sha = get.data.sha;
  } catch (_) {
    // not found is fine
  }

  const body = {
    message: 'Add knowledge file from mobile capture',
    content: Buffer.from(content).toString('base64'),
    branch,
    ...(sha ? { sha } : {})
  };

  const put = await axios.put(url, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return { path, commit: put.data.commit?.sha };
}

app.post('/extract', async (req, res) => {
  try {
    const { url, writeToGitHub } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });

    const { title, text } = await fetchReadable(url);
    const markdown = await callLLM({ url, title, text });

    const filename = `${slugify(title || url)}.md`;

    let github = null;
    if (writeToGitHub) {
      github = await writeToGitHub({ content: markdown, filename });
    }

    return res.json({ ok: true, title, filename, markdown, github });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on :${port}`));
