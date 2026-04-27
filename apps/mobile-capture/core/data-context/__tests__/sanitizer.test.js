/**
 * Sanitizer Tests
 */

import assert from 'assert';
import { describe, it } from 'node:test';
import {
  sanitizeText,
  getSanitizerPatterns,
  validateSanitization
} from '../sanitizer.js';

describe('Text Sanitizer', () => {
  describe('sanitizeText()', () => {
    it('should redact email addresses', () => {
      const input = 'Contact me at john@example.com for details';
      const result = sanitizeText(input);
      assert(!result.text.includes('john@example.com'));
      assert(result.text.includes('[REDACTED_EMAIL]'));
      assert.strictEqual(result.findings.length, 1);
      assert.strictEqual(result.findings[0].category, 'email');
    });

    it('should redact phone numbers', () => {
      const input = 'Call me at (555) 123-4567';
      const result = sanitizeText(input);
      assert(result.text.includes('[REDACTED_PHONE]'));
      assert.strictEqual(result.findings.length, 1);
    });

    it('should redact credit card-like numbers', () => {
      const input = 'Card: 4532-1234-5678-9010';
      const result = sanitizeText(input);
      assert(result.text.includes('[REDACTED_CARD]'));
      assert(result.findings.length > 0);
    });

    it('should redact API keys', () => {
      const input = 'api_key: sk_live_abc123xyz789';
      const result = sanitizeText(input);
      assert(result.text.includes('[REDACTED_SECRET]'));
    });

    it('should mark high severity findings', () => {
      const input = 'Card: 4532123456789010 and token: Bearer abc123';
      const result = sanitizeText(input);
      assert(result.hasHighSeverityFindings);
    });

    it('should count all findings', () => {
      const input = 'Email: test@example.com and test2@example.org';
      const result = sanitizeText(input);
      assert.strictEqual(result.findingCount, 2);
    });

    it('should return sanitized text', () => {
      const input = 'Original text with email@example.com';
      const result = sanitizeText(input);
      assert(result.version);
      assert(result.text);
      assert(Array.isArray(result.findings));
      assert(result.timestamp);
    });
  });

  describe('getSanitizerPatterns()', () => {
    it('should return all patterns', () => {
      const patterns = getSanitizerPatterns();
      assert(Array.isArray(patterns));
      assert(patterns.length > 0);
      assert(patterns.find(p => p.name === 'email'));
      assert(patterns.find(p => p.name === 'phone'));
      assert(patterns.find(p => p.name === 'credit_card_like_number'));
    });

    it('should include pattern metadata', () => {
      const patterns = getSanitizerPatterns();
      const pattern = patterns[0];
      assert(pattern.name);
      assert(pattern.severity);
      assert(pattern.description);
    });
  });

  describe('validateSanitization()', () => {
    it('should calculate statistics', () => {
      const original = 'This is a long text with email@example.com and phone (555) 123-4567';
      const sanitized = sanitizeText(original);
      const stats = validateSanitization(original, sanitized);
      assert(stats.originalLength > 0);
      assert(stats.sanitizedLength > 0);
      assert(typeof stats.reductionPercent === 'number');
      assert(stats.findingsCount > 0);
    });
  });
});
