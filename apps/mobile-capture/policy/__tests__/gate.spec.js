import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluatePolicyGate,
  OPERATIONS,
  RUNTIME_POLICY_GATE_VERSION
} from '../gate.js';

function baseInput(overrides = {}) {
  return {
    captureId: 'capture-test-001',
    source: {
      url: 'https://example.com/public-source',
      classification: 'public',
      contextLayer: 'public',
      ...(overrides.source || {})
    },
    runtime: {
      mode: 'external_api_public_only',
      hosting: 'local',
      endpoint: 'https://api.example.test/model',
      ...(overrides.runtime || {})
    },
    sanitizer: {
      version: '0.1.0-test',
      findings: [],
      ...(overrides.sanitizer || {})
    },
    ...(overrides.userOverride ? { userOverride: overrides.userOverride } : {})
  };
}

function finding(category, severity) {
  return { category, severity };
}

test('metadata_only stores metadata and blocks model/external operations', () => {
  const result = evaluatePolicyGate(baseInput({
    runtime: { mode: 'metadata_only' },
    source: { classification: 'work', contextLayer: 'work' }
  }));

  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.effectiveMode, 'metadata_only');
  assert.deepEqual(result.allowedOperations, [OPERATIONS.STORE_METADATA]);
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API), false);
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_ENTERPRISE_ENDPOINT), false);
  assert.equal(result.auditEntry.gate_version, RUNTIME_POLICY_GATE_VERSION);
});

test('external_api_public_only + public + sanitizer pass allows external API', () => {
  const result = evaluatePolicyGate(baseInput());

  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.effectiveMode, 'external_api_public_only');
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API), true);
  assert.equal(result.auditEntry.allowed_operations.includes(OPERATIONS.INVOKE_EXTERNAL_API), true);
});

test('external_api_public_only + unknown blocks with classify first', () => {
  const result = evaluatePolicyGate(baseInput({
    source: { classification: 'unknown', contextLayer: 'public' }
  }));

  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.reason, 'classify first');
  assert.deepEqual(result.allowedOperations, []);
});

test('external_api_public_only + public + high finding blocks without override', () => {
  const result = evaluatePolicyGate(baseInput({
    sanitizer: { findings: [finding('bearer_token', 'high')] },
    userOverride: { targetMode: 'external_api_public_only', reason: 'Attempted override should not bypass high risk' }
  }));

  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.reason, 'high-severity sanitizer finding');
  assert.deepEqual(result.allowedOperations, []);
});

test('external_api_public_only + public + medium finding + override allows external API and audits override', () => {
  const result = evaluatePolicyGate(baseInput({
    sanitizer: { findings: [finding('email', 'medium')] },
    userOverride: { targetMode: 'external_api_public_only', reason: 'Public source with acceptable medium finding for test' }
  }));

  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API), true);
  assert.equal(result.auditEntry.user_override.reason, 'Public source with acceptable medium finding for test');
});

test('approved_enterprise + personal blocks', () => {
  const result = evaluatePolicyGate(baseInput({
    runtime: { mode: 'approved_enterprise', hosting: 'azure_approved', endpoint: 'https://enterprise.example.test/model' },
    source: { classification: 'personal', contextLayer: 'personal' }
  }));

  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.reason, 'personal source blocked in approved_enterprise');
  assert.deepEqual(result.allowedOperations, []);
});

test('approved_enterprise + work + replit hosting blocks hosting verification', () => {
  const result = evaluatePolicyGate(baseInput({
    runtime: { mode: 'approved_enterprise', hosting: 'replit', endpoint: 'https://enterprise.example.test/model' },
    source: { classification: 'work', contextLayer: 'work' }
  }));

  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.reason, 'hosting verification failed');
  assert.deepEqual(result.allowedOperations, []);
});

test('approved_enterprise + work + azure_approved hosting allows enterprise endpoint', () => {
  const result = evaluatePolicyGate(baseInput({
    runtime: { mode: 'approved_enterprise', hosting: 'azure_approved', endpoint: 'https://enterprise.example.test/model' },
    source: { classification: 'work', contextLayer: 'work' }
  }));

  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_ENTERPRISE_ENDPOINT), true);
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API), false);
});

test('override targeting looser mode than environment blocks', () => {
  const result = evaluatePolicyGate(baseInput({
    runtime: { mode: 'local_only' },
    userOverride: { targetMode: 'external_api_public_only', reason: 'This attempts to upgrade the mode' }
  }));

  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.reason, 'override cannot upgrade');
  assert.deepEqual(result.allowedOperations, []);
});

test('missing sanitizer blocks', () => {
  const input = baseInput();
  delete input.sanitizer;

  const result = evaluatePolicyGate(input);

  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.reason, 'sanitizer did not run');
  assert.deepEqual(result.allowedOperations, []);
});

test('regression: local_only never includes external API operation', () => {
  const result = evaluatePolicyGate(baseInput({ runtime: { mode: 'local_only' } }));

  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.allowedOperations.includes(OPERATIONS.STORE_LOCAL_CONTENT), true);
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API), false);
});

test('regression: local_llm includes local LLM but not external API', () => {
  const result = evaluatePolicyGate(baseInput({ runtime: { mode: 'local_llm' } }));

  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_LOCAL_LLM), true);
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API), false);
});

test('regression: medium finding can downgrade to local_llm safely', () => {
  const result = evaluatePolicyGate(baseInput({
    runtime: { mode: 'external_api_public_only' },
    sanitizer: { findings: [finding('email', 'medium')] },
    userOverride: { targetMode: 'local_llm', reason: 'Downgrade to local model for medium finding' }
  }));

  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.effectiveMode, 'local_llm');
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_LOCAL_LLM), true);
  assert.equal(result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API), false);
});

test('regression: invalid contextLayer defaults to restrictive personal in audit', () => {
  const result = evaluatePolicyGate(baseInput({
    source: { contextLayer: 'invalid-context-layer' }
  }));

  assert.equal(result.auditEntry.context_layer, 'personal');
});

test('audit includes runtime endpoint and allowed operations', () => {
  const result = evaluatePolicyGate(baseInput({
    runtime: { endpoint: 'https://api.example.test/model' }
  }));

  assert.equal(result.auditEntry.runtime_endpoint, 'https://api.example.test/model');
  assert.deepEqual(result.auditEntry.allowed_operations, result.allowedOperations);
});
