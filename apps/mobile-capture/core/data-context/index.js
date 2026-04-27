/**
 * Data/Context Module
 *
 * Main orchestrator for data extraction, sanitization, and knowledge building.
 *
 * Responsibilities:
 * - Fetch readable content from URLs
 * - Sanitize and redact PII
 * - Extract structured knowledge using LLM
 * - Render knowledge as Markdown and graphs
 * - Validate all outputs
 */

export { fetchReadable, validateUrl } from './fetcher.js';
export { sanitizeText, getSanitizerPatterns, validateSanitization } from './sanitizer.js';
export { KNOWLEDGE_SCHEMA, validateKnowledge, getSchemaDescription } from './knowledge/schema.js';
export { extractKnowledge, getExtractionPrompt } from './knowledge/extractor.js';
export { renderKnowledgeMarkdown, renderKnowledgeJSON, validateRenderOptions } from './knowledge/renderer.js';
export { buildGraphFragment, validateGraphFragment, mergeGraphFragments } from './graph/fragmenter.js';

/**
 * Complete pipeline: URL → Knowledge
 *
 * Usage:
 *   const pipeline = new DataPipeline(llmProvider);
 *   const result = await pipeline.process({ url, options });
 */

export class DataPipeline {
  constructor(llmProvider, options = {}) {
    this.llmProvider = llmProvider;
    this.options = {
      timeout: 15000,
      maxTextLength: 20000,
      temperature: 0.1,
      ...options
    };
  }

  async process({ url, options = {} }) {
    const mergedOptions = { ...this.options, ...options };

    // Step 1: Fetch
    const { fetchReadable } = await import('./fetcher.js');
    const fetched = await fetchReadable(url, {
      timeout: mergedOptions.timeout,
      maxLength: mergedOptions.maxTextLength
    });

    // Step 2: Sanitize
    const { sanitizeText } = await import('./sanitizer.js');
    const sanitized = sanitizeText(fetched.text);

    // Step 3: Extract
    const { extractKnowledge } = await import('./knowledge/extractor.js');
    const knowledge = await extractKnowledge(this.llmProvider, {
      url,
      title: fetched.title,
      sanitized,
      options: { temperature: mergedOptions.temperature }
    });

    // Step 4: Render Markdown
    const { renderKnowledgeMarkdown } = await import('./knowledge/renderer.js');
    const markdown = renderKnowledgeMarkdown(knowledge, {
      url,
      sanitizer: sanitized
    });

    // Step 5: Build Graph
    const { buildGraphFragment } = await import('./graph/fragmenter.js');
    const graphFragment = buildGraphFragment(knowledge, {
      url,
      filename: `${Date.now()}-${url.split('/').pop()}.md`
    });

    return {
      status: 'success',
      fetched,
      sanitized,
      knowledge,
      markdown,
      graphFragment,
      timestamp: new Date().toISOString(),
      provider: this.llmProvider.name,
      model: this.llmProvider.model
    };
  }
}

/**
 * Data context version
 */
export const version = '1.0.0';
