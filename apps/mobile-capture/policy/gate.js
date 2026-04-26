import crypto from 'crypto';

export const RUNTIME_POLICY_GATE_VERSION = '0.1.1-spec';

export const RUNTIME_MODES = [
  'metadata_only',
  'local_only',
  'local_llm',
  'external_api_public_only',
  'approved_enterprise'
];

export const SOURCE_CLASSIFICATIONS = [
  'public',
  'unknown',
  'work',
  'personal'
];

export const CONTEXT_LAYERS = [
  'public',
  'work',
  'personal'
];

export const HOSTING_TYPES = [
  'local',
  'replit',
  'azure_approved',
  'other'
];

export const APPROVED_HOSTING_TYPES = ['azure_approved'];

export const OPERATIONS = Object.freeze({
  STORE_METADATA: 'store_metadata',
  STORE_LOCAL_CONTENT: 'store_local_content',
  INVOKE_LOCAL_LLM: 'invoke_local_llm',
  INVOKE_EXTERNAL_API: 'invoke_external_api',
  INVOKE_ENTERPRISE_ENDPOINT: 'invoke_enterprise_endpoint'
});

const EXTERNAL_MODES = new Set(['external_api_public_only', 'approved_enterprise']);

const MODE_RANK = Object.freeze({
  metadata_only: 0,
  local_only: 1,
  local_llm: 2,
  external_api_public_only: 3,
  approved_enterprise: 4
});

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function normalizeMode(mode) {
  return RUNTIME_MODES.includes(mode) ? mode : 'metadata_only';
}

function normalizeClassification(classification) {
  return SOURCE_CLASSIFICATIONS.includes(classification) ? classification : 'unknown';
}

function normalizeContextLayer(contextLayer) {
  return CONTEXT_LAYERS.includes(contextLayer) ? contextLayer : 'personal';
}

function normalizeHosting(hosting) {
  return HOSTING_TYPES.includes(hosting) ? hosting : 'other';
}

function normalizeFindings(findings = []) {
  if (!Array.isArray(findings)) return [];
  return findings.map((finding) => ({
    category: String(finding.category || finding.type || 'unknown'),
    severity: ['high', 'medium', 'low'].includes(finding.severity) ? finding.severity : 'low'
  }));
}

function highestSeverity(findings) {
  if (findings.some((finding) => finding.severity === 'high')) return 'high';
  if (findings.some((finding) => finding.severity === 'medium')) return 'medium';
  if (findings.some((finding) => finding.severity === 'low')) return 'low';
  return 'none';
}

function isDowngradeOrSame(targetMode, currentMode) {
  return MODE_RANK[targetMode] <= MODE_RANK[currentMode];
}

function operationsForMode(mode) {
  switch (mode) {
    case 'metadata_only':
      return [OPERATIONS.STORE_METADATA];
    case 'local_only':
      return [OPERATIONS.STORE_METADATA, OPERATIONS.STORE_LOCAL_CONTENT];
    case 'local_llm':
      return [OPERATIONS.STORE_METADATA, OPERATIONS.STORE_LOCAL_CONTENT, OPERATIONS.INVOKE_LOCAL_LLM];
    case 'external_api_public_only':
      return [OPERATIONS.STORE_METADATA, OPERATIONS.INVOKE_EXTERNAL_API];
    case 'approved_enterprise':
      return [OPERATIONS.STORE_METADATA, OPERATIONS.INVOKE_ENTERPRISE_ENDPOINT];
    default:
      return [];
  }
}

function buildAuditEntry({
  captureId,
  sourceUrl,
  sourceClassification,
  contextLayer,
  runtimeMode,
  runtimeHosting,
  runtimeEndpoint,
  sanitizerVersion,
  sanitizerFindings,
  userOverride,
  decision,
  decisionReason,
  allowedOperations,
  downgradeToMode
}) {
  return {
    gate_decision_id: uuid(),
    timestamp: new Date().toISOString(),
    capture_id: captureId || uuid(),
    source_url: sourceUrl || '',
    source_classification: sourceClassification,
    context_layer: contextLayer,
    runtime_mode: runtimeMode,
    runtime_hosting: runtimeHosting,
    runtime_endpoint: runtimeEndpoint || '',
    sanitizer_version: sanitizerVersion || 'unknown',
    sanitizer_findings: sanitizerFindings,
    user_override: {
      applied: Boolean(userOverride?.applied),
      direction: userOverride?.direction || 'none',
      reason: userOverride?.reason || ''
    },
    decision,
    decision_reason: decisionReason,
    allowed_operations: allowedOperations || [],
    downgrade_to_mode: downgradeToMode || null,
    gate_version: RUNTIME_POLICY_GATE_VERSION
  };
}

function makeDecision({
  decision,
  effectiveMode,
  reason,
  allowedOperations = [],
  downgradeToMode = null,
  normalized,
  userOverrideAudit = null
}) {
  const auditEntry = buildAuditEntry({
    captureId: normalized.captureId,
    sourceUrl: normalized.source.url,
    sourceClassification: normalized.source.classification,
    contextLayer: normalized.source.contextLayer,
    runtimeMode: normalized.runtime.mode,
    runtimeHosting: normalized.runtime.hosting,
    runtimeEndpoint: normalized.runtime.endpoint,
    sanitizerVersion: normalized.sanitizer.version,
    sanitizerFindings: normalized.sanitizer.findings,
    userOverride: userOverrideAudit,
    decision,
    decisionReason: reason,
    allowedOperations,
    downgradeToMode
  });

  return {
    decision,
    effectiveMode,
    reason,
    allowedOperations,
    auditEntry
  };
}

function normalizeInput(input = {}) {
  return {
    captureId: input.captureId || input.capture_id || uuid(),
    source: {
      url: String(input.source?.url || ''),
      classification: normalizeClassification(input.source?.classification),
      contextLayer: normalizeContextLayer(input.source?.contextLayer)
    },
    runtime: {
      mode: normalizeMode(input.runtime?.mode),
      hosting: normalizeHosting(input.runtime?.hosting),
      endpoint: input.runtime?.endpoint || ''
    },
    sanitizer: {
      version: input.sanitizer?.version || 'unknown',
      findings: normalizeFindings(input.sanitizer?.findings)
    },
    userOverride: input.userOverride
      ? {
          targetMode: normalizeMode(input.userOverride.targetMode),
          reason: String(input.userOverride.reason || '').trim()
        }
      : null
  };
}

function validateOverride(normalized) {
  const override = normalized.userOverride;
  if (!override) return { valid: true, audit: null, targetMode: normalized.runtime.mode };

  if (!override.reason) {
    return {
      valid: false,
      reason: 'override requires reason',
      audit: { applied: false, direction: 'none', reason: '' }
    };
  }

  if (!isDowngradeOrSame(override.targetMode, normalized.runtime.mode)) {
    return {
      valid: false,
      reason: 'override cannot upgrade',
      audit: { applied: false, direction: 'none', reason: override.reason }
    };
  }

  return {
    valid: true,
    audit: {
      applied: override.targetMode !== normalized.runtime.mode,
      direction: override.targetMode !== normalized.runtime.mode ? 'downgrade' : 'none',
      reason: override.reason
    },
    targetMode: override.targetMode
  };
}

function hostingAllowsApprovedEnterprise(normalized) {
  return normalized.runtime.mode === 'approved_enterprise' && APPROVED_HOSTING_TYPES.includes(normalized.runtime.hosting);
}

function evaluatePolicyGateUnsafe(input = {}) {
  const normalized = normalizeInput(input);

  if (!input.sanitizer || !input.sanitizer.version || !Array.isArray(input.sanitizer.findings)) {
    return makeDecision({
      decision: 'BLOCK',
      effectiveMode: 'metadata_only',
      reason: 'sanitizer did not run',
      normalized
    });
  }

  if (normalized.runtime.mode === 'approved_enterprise' && !hostingAllowsApprovedEnterprise(normalized)) {
    return makeDecision({
      decision: 'BLOCK',
      effectiveMode: 'local_only',
      reason: 'hosting verification failed',
      normalized
    });
  }

  const overrideResult = validateOverride(normalized);
  if (!overrideResult.valid) {
    return makeDecision({
      decision: 'BLOCK',
      effectiveMode: normalized.runtime.mode,
      reason: overrideResult.reason,
      normalized,
      userOverrideAudit: overrideResult.audit
    });
  }

  const effectiveMode = overrideResult.targetMode;
  const overrideAudit = overrideResult.audit;
  const severity = highestSeverity(normalized.sanitizer.findings);

  if (severity === 'high') {
    return makeDecision({
      decision: 'BLOCK',
      effectiveMode,
      reason: 'high-severity sanitizer finding',
      normalized,
      userOverrideAudit: overrideAudit
    });
  }

  if (severity === 'medium' && EXTERNAL_MODES.has(effectiveMode)) {
    if (effectiveMode === 'approved_enterprise') {
      return makeDecision({
        decision: 'BLOCK',
        effectiveMode,
        reason: 'medium-severity sanitizer finding blocked in approved_enterprise',
        normalized,
        userOverrideAudit: overrideAudit
      });
    }

    if (!normalized.userOverride?.reason) {
      return makeDecision({
        decision: 'BLOCK',
        effectiveMode,
        reason: 'medium-severity sanitizer finding requires explicit override',
        normalized,
        userOverrideAudit: overrideAudit
      });
    }
  }

  switch (effectiveMode) {
    case 'metadata_only':
      return makeDecision({
        decision: 'BLOCK',
        effectiveMode: 'metadata_only',
        reason: 'metadata_only mode — metadata stored, no external transmission',
        allowedOperations: operationsForMode('metadata_only'),
        normalized,
        userOverrideAudit: overrideAudit
      });

    case 'local_only':
      return makeDecision({
        decision: 'ALLOW',
        effectiveMode: 'local_only',
        reason: 'local_only mode allows local storage only',
        allowedOperations: operationsForMode('local_only'),
        normalized,
        userOverrideAudit: overrideAudit
      });

    case 'local_llm':
      return makeDecision({
        decision: 'ALLOW',
        effectiveMode: 'local_llm',
        reason: 'local_llm mode allows local model inference only',
        allowedOperations: operationsForMode('local_llm'),
        normalized,
        userOverrideAudit: overrideAudit
      });

    case 'external_api_public_only':
      if (normalized.source.classification !== 'public') {
        return makeDecision({
          decision: 'BLOCK',
          effectiveMode,
          reason: 'classify first',
          normalized,
          userOverrideAudit: overrideAudit
        });
      }
      return makeDecision({
        decision: 'ALLOW',
        effectiveMode,
        reason: 'public source allowed for external_api_public_only',
        allowedOperations: operationsForMode('external_api_public_only'),
        normalized,
        userOverrideAudit: overrideAudit
      });

    case 'approved_enterprise':
      if (normalized.source.classification === 'personal') {
        return makeDecision({
          decision: 'BLOCK',
          effectiveMode,
          reason: 'personal source blocked in approved_enterprise',
          normalized,
          userOverrideAudit: overrideAudit
        });
      }
      if (normalized.source.classification === 'unknown') {
        return makeDecision({
          decision: 'BLOCK',
          effectiveMode,
          reason: 'classify first',
          normalized,
          userOverrideAudit: overrideAudit
        });
      }
      return makeDecision({
        decision: 'ALLOW',
        effectiveMode,
        reason: 'approved_enterprise source and hosting allowed',
        allowedOperations: operationsForMode('approved_enterprise'),
        normalized,
        userOverrideAudit: overrideAudit
      });

    default:
      return makeDecision({
        decision: 'BLOCK',
        effectiveMode: 'metadata_only',
        reason: 'unknown runtime mode',
        normalized,
        userOverrideAudit: overrideAudit
      });
  }
}

export function evaluatePolicyGate(input = {}) {
  try {
    return evaluatePolicyGateUnsafe(input);
  } catch (error) {
    const normalized = normalizeInput(input);
    return makeDecision({
      decision: 'BLOCK',
      effectiveMode: 'metadata_only',
      reason: `gate exception: ${error.message}`,
      normalized
    });
  }
}

export default evaluatePolicyGate;
