import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import crypto from 'crypto';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '2mb' }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
  return `${today()}-${slugify(title || url)}-${shortHash(url)}.md`;
}

async function fetchReadable(url) {
  const { data } = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(data);
  const title = ($('title').text() || '').trim();
  $('script,style,noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text: text.slice(0, 20000) };
}

async function chat(messages, temperature = 0.2) {
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature
  });

  return completion.choices[0].message.content.trim();
}

async function extractKnowledge({ url, title, text }) {
  return chat([
    { role: 'system', content: 'You are a precise analyst. Only use provided content.' },
    { role: 'user', content: `Extract structured knowledge from:\n\n${text}` }
  ]);
}

app.post('/extract', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const { title, text } = await fetchReadable(url);
    const output = await extractKnowledge({ url, title, text });

    const filename = buildFilename(title, url);

    res.json({ filename, output });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Server running on :3000'));