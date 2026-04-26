const CAPTURE_PIPELINE_VERSION = '0.4.0-policy-gated-capture';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(s) {
  return (s || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 70) || 'untitled';
}

function list(items) {
  return items.map(x => `- ${x}`).join('\n');
}

export function renderKnowledgeMarkdown(data, { url, sanitizer, sanitizerVersion }) {
  return `# ${data.title}

source: ${url}
source_type: ${data.source_type}
status: extracted
last_updated: ${today()}
confidence: ${data.confidence}
pipeline_version: ${CAPTURE_PIPELINE_VERSION}
sanitizer_version: ${sanitizerVersion}
pca_state: captured
trust_state: provisional
reconciliation_status: not_reconciled
source_layer: public
capture_method: mobile_url
sanitizer_findings: ${JSON.stringify(sanitizer?.findings || [])}
concepts:
${data.concepts.map(c => `  - ${slugify(c)}`).join('\n')}

---

## Summary
${list(data.summary)}

## Key Points
${list(data.key_points)}

## Architecture Implications
${list(data.architecture_implications)}

## GEAkr Implications
${list(data.geakr_implications)}

## Constraints / Risks
${list(data.constraints_risks)}
`;
}
