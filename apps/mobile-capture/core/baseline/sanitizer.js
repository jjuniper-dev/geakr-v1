const SANITIZER_VERSION = '0.1.0-regex-risk-gate';

function sanitizerSeverity(type) {
  if (['credit_card_like_number', 'bearer_token', 'api_key_like_value', 'sin_like_number'].includes(type)) {
    return 'high';
  }
  if (['email', 'phone'].includes(type)) {
    return 'medium';
  }
  return 'low';
}

export function sanitizeText(input) {
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
    if (matches.length) {
      findings.push({ category: r.name, severity: sanitizerSeverity(r.name), count: matches.length });
    }
    text = text.replace(r.regex, r.repl);
  }

  return { version: SANITIZER_VERSION, text, findings };
}
