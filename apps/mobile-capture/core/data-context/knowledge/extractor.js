/**
 * Knowledge Extractor
 *
 * Uses LLM to extract structured knowledge from sanitized content.
 * Coordinates with LLM adapter to route to appropriate provider.
 */

import { KNOWLEDGE_SCHEMA, validateKnowledge } from './schema.js';

export async function extractKnowledge(llmProvider, { url, title, sanitized, options = {} }) {
  const temperature = options.temperature || 0.1;
  const maxRetries = options.maxRetries || 2;

  const messages = [
    {
      role: 'system',
      content: 'Extract only from provided sanitized content. Do not infer unsupported facts. Return JSON only.'
    },
    {
      role: 'user',
      content: `URL: ${url}
Page title: ${title}

Sanitizer findings: ${JSON.stringify(sanitized.findings)}

Content:
${sanitized.text}`
    }
  ];

  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await llmProvider.structuredExtract({
        schema: KNOWLEDGE_SCHEMA,
        messages,
        temperature
      });

      const validation = validateKnowledge(result);
      if (!validation.valid) {
        throw new Error(`Invalid knowledge object: ${validation.errors.join(', ')}`);
      }

      return {
        ...result,
        extraction_status: 'success',
        extraction_timestamp: new Date().toISOString(),
        provider: llmProvider.name,
        model: llmProvider.model
      };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        console.warn(`⚠️  Extraction attempt ${attempt + 1} failed: ${error.message}. Retrying...`);
      }
    }
  }

  throw new Error(`Knowledge extraction failed after ${maxRetries} attempts: ${lastError.message}`);
}

export function getExtractionPrompt(url, title, sanitized) {
  return {
    system: 'Extract structured knowledge from the provided sanitized content. Return valid JSON.',
    user: `URL: ${url}
Title: ${title}

Sanitizer findings: ${JSON.stringify(sanitized.findings)}

Content:
${sanitized.text}`
  };
}
