/**
 * Text Sanitizer — PII Redaction
 *
 * Extracts from: core/baseline/sanitizer.js
 *
 * Detects and redacts 6 categories of sensitive information:
 * - Email addresses
 * - Phone numbers
 * - ID numbers (SSN/SIN-like)
 * - Credit card numbers
 * - Bearer tokens
 * - API keys/secrets
 *
 * Returns sanitized text + findings for audit trail.
 */

const SANITIZER_VERSION = '0.1.0-regex-risk-gate';

const PII_PATTERNS = [
  {
    name: 'email',
    regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    replacement: '[REDACTED_EMAIL]',
    severity: 'medium'
  },
  {
    name: 'phone',
    regex: /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g,
    replacement: '[REDACTED_PHONE]',
    severity: 'medium'
  },
  {
    name: 'sin_like_number',
    regex: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
    replacement: '[REDACTED_ID]',
    severity: 'high'
  },
  {
    name: 'credit_card_like_number',
    regex: /\b(?:\d[ -]*?){13,16}\b/g,
    replacement: '[REDACTED_CARD]',
    severity: 'high'
  },
  {
    name: 'bearer_token',
    regex: /Bearer\s+[A-Za-z0-9._\-]+/g,
    replacement: '[REDACTED_TOKEN]',
    severity: 'high'
  },
  {
    name: 'api_key_like_value',
    regex: /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*[^\s,;]+/gi,
    replacement: '[REDACTED_SECRET]',
    severity: 'high'
  }
];

export function sanitizeText(input) {
  let text = String(input || '');
  const findings = [];

  for (const pattern of PII_PATTERNS) {
    const matches = text.match(pattern.regex) || [];

    if (matches.length > 0) {
      findings.push({
        category: pattern.name,
        severity: pattern.severity,
        count: matches.length,
        examples: matches.slice(0, 2).map(m => m.slice(0, 20) + (m.length > 20 ? '...' : ''))
      });
    }

    text = text.replace(pattern.regex, pattern.replacement);
  }

  return {
    version: SANITIZER_VERSION,
    text,
    findings,
    hasHighSeverityFindings: findings.some(f => f.severity === 'high'),
    findingCount: findings.reduce((sum, f) => sum + f.count, 0),
    timestamp: new Date().toISOString()
  };
}

export function getSanitizerPatterns() {
  return PII_PATTERNS.map(p => ({
    name: p.name,
    severity: p.severity,
    description: `Pattern for detecting ${p.name}`
  }));
}

export function validateSanitization(original, sanitized) {
  return {
    originalLength: original.length,
    sanitizedLength: sanitized.text.length,
    reductionPercent: Math.round((1 - sanitized.text.length / original.length) * 100),
    findingsCount: sanitized.findings.length,
    redactionsCount: sanitized.findingCount
  };
}
