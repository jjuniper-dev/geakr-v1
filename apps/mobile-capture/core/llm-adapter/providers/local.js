/**
 * Local Provider (Ollama / Local LLM)
 *
 * Stub implementation for running local models (Ollama, LLaMA, etc).
 * Requires a local inference server running on OLLAMA_API_BASE.
 *
 * Typical setup:
 *   ollama pull mistral
 *   ollama serve
 *
 * Then set: OLLAMA_API_BASE=http://localhost:11434
 */

import axios from 'axios';

const OLLAMA_API_BASE = process.env.OLLAMA_API_BASE || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

export function getLocalProvider() {
  const client = axios.create({
    baseURL: OLLAMA_API_BASE,
    timeout: 60000
  });

  return {
    name: 'local',
    model: OLLAMA_MODEL,

    async structuredExtract({ schema, messages, temperature = 0.1 }) {
      const prompt = formatMessagesForLocal(messages);

      try {
        const response = await client.post('/api/generate', {
          model: OLLAMA_MODEL,
          prompt,
          temperature,
          stream: false
        });

        const text = response.data.response;
        try {
          return JSON.parse(text);
        } catch {
          console.warn('⚠️  Local model did not return valid JSON:', text);
          return { error: 'Model did not return valid JSON', raw: text };
        }
      } catch (error) {
        throw new Error(`Local inference failed: ${error.message}. Check OLLAMA_API_BASE=${OLLAMA_API_BASE}`);
      }
    },

    async generate({ prompt, temperature = 0.7 }) {
      try {
        const response = await client.post('/api/generate', {
          model: OLLAMA_MODEL,
          prompt,
          temperature,
          stream: false
        });
        return response.data.response;
      } catch (error) {
        throw new Error(`Local generation failed: ${error.message}`);
      }
    },

    async embed({ text }) {
      try {
        const response = await client.post('/api/embeddings', {
          model: OLLAMA_MODEL,
          prompt: text
        });
        return response.data.embedding;
      } catch (error) {
        throw new Error(`Local embedding failed: ${error.message}`);
      }
    }
  };
}

function formatMessagesForLocal(messages) {
  return messages
    .map(m => {
      if (m.role === 'system') return `System: ${m.content}`;
      if (m.role === 'user') return `User: ${m.content}`;
      if (m.role === 'assistant') return `Assistant: ${m.content}`;
      return m.content;
    })
    .join('\n\n');
}
