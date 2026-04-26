/**
 * Tests for the runtime policy gate.
 *
 * Run from repo root:
 * node --test apps/mobile-capture/policy/__tests__/gate.spec.js
 *
 * No external test framework — uses node:test (built into Node 18+).
 *
 * Test groups:
 * 1. Spec §12 — required cases from runtime-policy-gate-spec.md
 * 2. Regression guards — C1 / C2 / C3 fixes from commit 86ffdd6
 * 3. Default-deny behaviour — spec §11
 * 4. Audit entry contract — S2 / S3 fixes and structural invariants
 * 5. Override semantics — spec §7
 * 6. Sanitizer severity handling — spec §6
 * 7. APPROVED_HOSTING_TYPES export — S5 fix
 *
 * Notes:
 * - Spec §12 case 10 (audit log write failure) belongs in audit.test.js because gate.js returns the audit entry but does not persist it.
 * - The S6 try/catch wrap is structurally present but not fully behaviourally tested here. v0.2 fix: synthetic-safe normalized object in the catch path.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluatePolicyGate,
  OPERATIONS,
  RUNTIME_POLICY_GATE_VERSION,
  APPROVED_HOSTING_TYPES
} from '../gate.js';

function makeInput(overrides = {}) {
  const base = {
    captureId: 'test-capture-001',
    source: {
      url: 'https://example.com/article',
      classification: 'public',
      contextLayer: 'public'
    },
    runtime: {
      mode: 'external_api_public_only',
      hosting: 'local',
      endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    sanitizer: {
      version: 'sanitizer-0.1',
      findings: []
    }
  };

  return {
    ...base,
    ...overrides,
    source: { ...base.source, ...(overrides.source || {}) },
    runtime: { ...base.runtime, ...(overrides.runtime || {}) },
    sanitizer: { ...base.sanitizer, ...(overrides.sanitizer || {}) }
  };
}

// 1. Spec §12

describe('Spec §12 — Required test cases', () => {
  test('1. metadata_only + any source + any sanitizer state → metadata stored, no model call', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'metadata_only', hosting: 'local' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.deepEqual(result.allowedOperations, [OPERATIONS.STORE_METADATA]);
  });

  test('2. external_api_public_only + public + sanitizer pass → ALLOW', () => {
    const result = evaluatePolicyGate(makeInput());
    assert.equal(result.decision, 'ALLOW');
    assert.ok(result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API));
  });

  test('3. external_api_public_only + unknown → BLOCK, reason “classify first”', () => {
    const result = evaluatePolicyGate(makeInput({
      source: { classification: 'unknown' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /classify first/);
  });

  test('4. external_api_public_only + public + high finding → BLOCK, no override possible', () => {
    const result = evaluatePolicyGate(makeInput({
      sanitizer: { findings: [{ category: 'api_key', severity: 'high' }] },
      userOverride: { targetMode: 'external_api_public_only', reason: 'I really need this' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /high-severity/);
  });

  test('5. external_api_public_only + public + medium finding + override → ALLOW', () => {
    const result = evaluatePolicyGate(makeInput({
      sanitizer: { findings: [{ category: 'email', severity: 'medium' }] },
      userOverride: { targetMode: 'external_api_public_only', reason: 'reviewed and approved' }
    }));
    assert.equal(result.decision, 'ALLOW');
    assert.equal(result.auditEntry.user_override.reason, 'reviewed and approved');
  });

  test('6. approved_enterprise + personal → BLOCK', () => {
    const result = evaluatePolicyGate(makeInput({
      source: { classification: 'personal', contextLayer: 'personal' },
      runtime: { mode: 'approved_enterprise', hosting: 'azure_approved' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /personal/);
  });

  test('7. approved_enterprise + work + hosting=replit → BLOCK (hosting verification failed)', () => {
    const result = evaluatePolicyGate(makeInput({
      source: { classification: 'work', contextLayer: 'work' },
      runtime: { mode: 'approved_enterprise', hosting: 'replit' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /hosting verification failed/);
  });

  test('8. approved_enterprise + work + hosting=azure_approved + sanitizer pass → ALLOW', () => {
    const result = evaluatePolicyGate(makeInput({
      source: { classification: 'work', contextLayer: 'work' },
      runtime: { mode: 'approved_enterprise', hosting: 'azure_approved' }
    }));
    assert.equal(result.decision, 'ALLOW');
    assert.ok(result.allowedOperations.includes(OPERATIONS.INVOKE_ENTERPRISE_ENDPOINT));
  });

  test('9. Override targeting looser mode → BLOCK, reason “override cannot upgrade”', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'local_only', hosting: 'local' },
      userOverride: { targetMode: 'external_api_public_only', reason: 'pls' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /override cannot upgrade/);
  });

  test('10. Missing sanitizer → BLOCK, reason “sanitizer did not run”', () => {
    const input = makeInput();
    delete input.sanitizer;
    const result = evaluatePolicyGate(input);
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /sanitizer did not run/);
  });
});

// 2. Regression guards

describe('Regression guards (C1/C2/C3 from commit 86ffdd6)', () => {
  test('C1: metadata_only returns BLOCK, never DOWNGRADE', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'metadata_only', hosting: 'local' }
    }));
    assert.notEqual(result.decision, 'DOWNGRADE', 'metadata_only must not return DOWNGRADE — risk of infinite-retry loop');
    assert.equal(result.decision, 'BLOCK');
  });

  test('C2: local_only allowedOperations excludes external invocations', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'local_only', hosting: 'local' }
    }));
    assert.equal(result.decision, 'ALLOW');
    assert.ok(!result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API), 'local_only must not permit external API invocation');
    assert.ok(!result.allowedOperations.includes(OPERATIONS.INVOKE_ENTERPRISE_ENDPOINT), 'local_only must not permit enterprise endpoint invocation');
    assert.ok(!result.allowedOperations.includes(OPERATIONS.INVOKE_LOCAL_LLM), 'local_only must not permit local LLM invocation');
    assert.ok(result.allowedOperations.includes(OPERATIONS.STORE_LOCAL_CONTENT));
  });

  test('C2: local_llm allowedOperations excludes external API but includes local LLM', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'local_llm', hosting: 'local' }
    }));
    assert.ok(!result.allowedOperations.includes(OPERATIONS.INVOKE_EXTERNAL_API));
    assert.ok(!result.allowedOperations.includes(OPERATIONS.INVOKE_ENTERPRISE_ENDPOINT));
    assert.ok(result.allowedOperations.includes(OPERATIONS.INVOKE_LOCAL_LLM));
  });

  test('C3: medium-severity + override-to-local-llm → ALLOW (not BLOCK)', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'external_api_public_only', hosting: 'local' },
      sanitizer: { findings: [{ category: 'email', severity: 'medium' }] },
      userOverride: { targetMode: 'local_llm', reason: 'process locally instead' }
    }));
    assert.equal(result.decision, 'ALLOW', 'medium severity must not block when downgrading to a non-external mode');
    assert.equal(result.effectiveMode, 'local_llm');
  });

  test('C3: medium-severity + downgrade to local_only → ALLOW', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'external_api_public_only', hosting: 'local' },
      sanitizer: { findings: [{ category: 'email', severity: 'medium' }] },
      userOverride: { targetMode: 'local_only', reason: 'safer path' }
    }));
    assert.equal(result.decision, 'ALLOW');
    assert.equal(result.effectiveMode, 'local_only');
  });
});

// 3. Default-deny

describe('Default-deny behaviour (spec §11)', () => {
  test('Mode unspecified → audited as metadata_only', () => {
    const result = evaluatePolicyGate({
      source: { url: 'https://example.com', classification: 'public', contextLayer: 'public' },
      runtime: { hosting: 'local' },
      sanitizer: { version: 'sanitizer-0.1', findings: [] }
    });
    assert.equal(result.auditEntry.runtime_mode, 'metadata_only');
  });

  test('Source classification missing → defaults to unknown → BLOCK on external mode', () => {
    const result = evaluatePolicyGate({
      source: { url: 'https://example.com', contextLayer: 'public' },
      runtime: { mode: 'external_api_public_only', hosting: 'local' },
      sanitizer: { version: 'sanitizer-0.1', findings: [] }
    });
    assert.equal(result.auditEntry.source_classification, 'unknown');
    assert.equal(result.decision, 'BLOCK');
  });

  test('Hosting cannot be determined → blocks approved_enterprise', () => {
    const result = evaluatePolicyGate({
      source: { url: 'https://example.com', classification: 'work', contextLayer: 'work' },
      runtime: { mode: 'approved_enterprise' },
      sanitizer: { version: 'sanitizer-0.1', findings: [] }
    });
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /hosting verification failed/);
  });

  test('Sanitizer block missing entirely → BLOCK', () => {
    const result = evaluatePolicyGate({
      source: { url: 'https://example.com', classification: 'public', contextLayer: 'public' },
      runtime: { mode: 'external_api_public_only', hosting: 'local' }
    });
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /sanitizer did not run/);
  });

  test('Sanitizer findings not an array → BLOCK', () => {
    const result = evaluatePolicyGate({
      source: { url: 'https://example.com', classification: 'public', contextLayer: 'public' },
      runtime: { mode: 'external_api_public_only', hosting: 'local' },
      sanitizer: { version: 'sanitizer-0.1', findings: 'not an array' }
    });
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /sanitizer did not run/);
  });

  test('contextLayer omitted → defaults to “personal” (most restrictive — S4 fix)', () => {
    const result = evaluatePolicyGate({
      source: { url: 'https://example.com', classification: 'public' },
      runtime: { mode: 'external_api_public_only', hosting: 'local' },
      sanitizer: { version: 'sanitizer-0.1', findings: [] }
    });
    assert.equal(result.auditEntry.context_layer, 'personal');
  });
});

// 4. Audit entry contract

describe('Audit entry contract', () => {
  test('Includes context_layer (S2 fix)', () => {
    const result = evaluatePolicyGate(makeInput());
    assert.ok('context_layer' in result.auditEntry);
    assert.equal(result.auditEntry.context_layer, 'public');
  });

  test('Includes runtime_endpoint (S3 fix)', () => {
    const result = evaluatePolicyGate(makeInput());
    assert.ok('runtime_endpoint' in result.auditEntry);
    assert.equal(result.auditEntry.runtime_endpoint, 'https://api.openai.com/v1/chat/completions');
  });

  test('Includes gate_version matching exported constant', () => {
    const result = evaluatePolicyGate(makeInput());
    assert.equal(result.auditEntry.gate_version, RUNTIME_POLICY_GATE_VERSION);
    assert.equal(result.auditEntry.gate_version, '0.1.1-spec');
  });

  test('Includes allowed_operations array', () => {
    const result = evaluatePolicyGate(makeInput());
    assert.ok(Array.isArray(result.auditEntry.allowed_operations));
  });

  test('Each decision produces a unique gate_decision_id', () => {
    const r1 = evaluatePolicyGate(makeInput());
    const r2 = evaluatePolicyGate(makeInput());
    assert.notEqual(r1.auditEntry.gate_decision_id, r2.auditEntry.gate_decision_id);
  });

  test('Timestamp is ISO 8601', () => {
    const result = evaluatePolicyGate(makeInput());
    assert.match(result.auditEntry.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// 5. Override semantics

describe('Override semantics (spec §7)', () => {
  test('Override without reason → BLOCK', () => {
    const result = evaluatePolicyGate(makeInput({
      userOverride: { targetMode: 'metadata_only', reason: '' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /override requires reason/);
  });

  test('Override to same mode (acknowledgment) preserves runtime mode', () => {
    const result = evaluatePolicyGate(makeInput({
      userOverride: { targetMode: 'external_api_public_only', reason: 'reviewed' }
    }));
    assert.equal(result.effectiveMode, 'external_api_public_only');
  });

  test('Override to stricter mode (downgrade) → effective mode follows override', () => {
    const result = evaluatePolicyGate(makeInput({
      userOverride: { targetMode: 'local_only', reason: 'be safe' }
    }));
    assert.equal(result.effectiveMode, 'local_only');
    assert.equal(result.decision, 'ALLOW');
  });

  test('approved_enterprise + medium finding + override → BLOCK (no override allowed)', () => {
    const result = evaluatePolicyGate(makeInput({
      source: { classification: 'work', contextLayer: 'work' },
      runtime: { mode: 'approved_enterprise', hosting: 'azure_approved' },
      sanitizer: { findings: [{ category: 'email', severity: 'medium' }] },
      userOverride: { targetMode: 'approved_enterprise', reason: 'pls' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /approved_enterprise/);
  });
});

// 6. Sanitizer severity handling

describe('Sanitizer severity handling (spec §6)', () => {
  test('Low-severity findings pass through', () => {
    const result = evaluatePolicyGate(makeInput({
      sanitizer: { findings: [{ category: 'url_param', severity: 'low' }] }
    }));
    assert.equal(result.decision, 'ALLOW');
  });

  test('No findings → ALLOW', () => {
    const result = evaluatePolicyGate(makeInput());
    assert.equal(result.decision, 'ALLOW');
  });

  test('High severity blocks even with override and reason', () => {
    const result = evaluatePolicyGate(makeInput({
      sanitizer: { findings: [{ category: 'api_key', severity: 'high' }] },
      userOverride: { targetMode: 'external_api_public_only', reason: 'absolutely necessary' }
    }));
    assert.equal(result.decision, 'BLOCK');
    assert.match(result.reason, /high-severity/);
  });

  test('Medium severity in local_llm mode → ALLOW (no external transmission)', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'local_llm', hosting: 'local' },
      sanitizer: { findings: [{ category: 'email', severity: 'medium' }] }
    }));
    assert.equal(result.decision, 'ALLOW');
  });

  test('Medium severity in metadata_only mode → BLOCK (per metadata_only semantics, not severity)', () => {
    const result = evaluatePolicyGate(makeInput({
      runtime: { mode: 'metadata_only', hosting: 'local' },
      sanitizer: { findings: [{ category: 'email', severity: 'medium' }] }
    }));
    assert.equal(result.decision, 'BLOCK');
  });
});

// 7. APPROVED_HOSTING_TYPES export

describe('Approved hosting allowlist (S5 fix)', () => {
  test('APPROVED_HOSTING_TYPES is exported as an array', () => {
    assert.ok(Array.isArray(APPROVED_HOSTING_TYPES));
  });

  test('APPROVED_HOSTING_TYPES contains azure_approved', () => {
    assert.ok(APPROVED_HOSTING_TYPES.includes('azure_approved'));
  });

  test('APPROVED_HOSTING_TYPES does not contain non-approved hosts', () => {
    assert.ok(!APPROVED_HOSTING_TYPES.includes('local'));
    assert.ok(!APPROVED_HOSTING_TYPES.includes('replit'));
    assert.ok(!APPROVED_HOSTING_TYPES.includes('other'));
  });
});
