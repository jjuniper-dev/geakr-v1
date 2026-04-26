export function buildContext({ req, sanitized, runtime, source }) {
  return {
    source: {
      url: source.url || '',
      classification: source.classification || 'unknown',
      contextLayer: source.contextLayer || 'personal'
    },
    runtime: {
      mode: runtime.mode || 'metadata_only',
      hosting: runtime.hosting || 'other',
      endpoint: runtime.endpoint || 'openai_api'
    },
    sanitizer: {
      version: sanitized?.version || 'unknown',
      findings: sanitized?.findings || []
    },
    userOverride: req.userOverride || null,
    trace: [],
    metadata: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  };
}

export function addTraceEntry(context, operation, result) {
  context.trace.push({
    operation,
    result,
    timestamp: new Date().toISOString()
  });
}
