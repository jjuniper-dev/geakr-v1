/**
 * Markdown Renderer
 *
 * Extracts from: core/baseline/renderer.js
 *
 * Renders structured knowledge objects as human-readable Markdown.
 * Includes metadata, sanitizer findings, and all extracted content.
 */

const CAPTURE_PIPELINE_VERSION = '0.4.0-policy-gated-capture';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatList(items) {
  return items.map(x => `- ${x}`).join('\n');
}

export function renderKnowledgeMarkdown(knowledge, options = {}) {
  const {
    url = '',
    sanitizer = {},
    sanitizerVersion = '0.1.0',
    sourceLayer = 'public',
    trustState = 'provisional'
  } = options;

  return `# ${knowledge.title}

**Source:** ${url}
**Type:** ${knowledge.source_type}
**Confidence:** ${knowledge.confidence}
**Updated:** ${today()}
**Status:** extracted
**Pipeline:** ${CAPTURE_PIPELINE_VERSION}
**Sanitizer Version:** ${sanitizerVersion}
**Trust State:** ${trustState}
**Source Layer:** ${sourceLayer}

## Concepts

${formatList(knowledge.concepts)}

## Summary

${formatList(knowledge.summary)}

## Key Points

${formatList(knowledge.key_points)}

## Architecture Implications

${formatList(knowledge.architecture_implications)}

## GEAkr Implications

${formatList(knowledge.geakr_implications)}

## Constraints & Risks

${formatList(knowledge.constraints_risks)}

---

## Metadata

**Sanitizer Findings:**
\`\`\`json
${JSON.stringify(sanitizer.findings || [], null, 2)}
\`\`\`

**Extraction Metadata:**
- High Severity Findings: ${sanitizer.hasHighSeverityFindings ? 'Yes' : 'No'}
- Total Redactions: ${sanitizer.findingCount || 0}
- Content Length: ${sanitizer.contentLength || 'unknown'} characters
`;
}

export function renderKnowledgeJSON(knowledge, options = {}) {
  const {
    url = '',
    sanitizer = {},
    sanitizerVersion = '0.1.0'
  } = options;

  return {
    ...knowledge,
    metadata: {
      rendered_at: new Date().toISOString(),
      source_url: url,
      sanitizer_version: sanitizerVersion,
      sanitizer_findings: sanitizer.findings || [],
      pipeline_version: CAPTURE_PIPELINE_VERSION
    }
  };
}

export function validateRenderOptions(options) {
  const errors = [];

  if (options.url && typeof options.url !== 'string') {
    errors.push('url must be a string');
  }

  if (options.sanitizer && typeof options.sanitizer !== 'object') {
    errors.push('sanitizer must be an object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
