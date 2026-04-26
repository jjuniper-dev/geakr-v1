export const MODE_ALLOWED_CLASSIFICATIONS = {
  metadata_only: {
    allowed: [],
    rationale: 'No knowledge base access in metadata-only mode'
  },
  local_only: {
    allowed: ['public', 'unknown'],
    rationale: 'Local-only mode allows public documents only'
  },
  local_llm: {
    allowed: ['public', 'unknown'],
    rationale: 'Local LLM cannot access work-classified content'
  },
  external_api_public_only: {
    allowed: ['public', 'unknown'],
    rationale: 'External API restricted to public documents'
  },
  approved_enterprise: {
    allowed: ['public', 'unknown', 'work'],
    rationale: 'Enterprise mode allows public + work content'
  }
};

export function evaluateClassificationAccess(runtimeMode, documentClassification) {
  const modeConfig = MODE_ALLOWED_CLASSIFICATIONS[runtimeMode];
  if (!modeConfig) {
    throw new Error(`Unknown runtime mode: ${runtimeMode}`);
  }

  // Treat unknown classification as public for access control
  const effectiveClassification = documentClassification === 'unknown' ? 'public' : documentClassification;

  return modeConfig.allowed.includes(effectiveClassification);
}

export function filterDocumentsByPolicy(documents, runtimeMode) {
  const modeConfig = MODE_ALLOWED_CLASSIFICATIONS[runtimeMode];
  if (!modeConfig) {
    throw new Error(`Unknown runtime mode: ${runtimeMode}`);
  }

  // If no classifications are allowed, return empty
  if (modeConfig.allowed.length === 0) {
    return {
      filtered: [],
      blockedCount: documents.length,
      blockedClassifications: documents.map(d => d.classification)
    };
  }

  const filtered = [];
  const blocked = [];
  const blockedClassifications = {};

  for (const doc of documents) {
    if (evaluateClassificationAccess(runtimeMode, doc.classification)) {
      filtered.push(doc);
    } else {
      blocked.push(doc);
      const cls = doc.classification || 'unknown';
      blockedClassifications[cls] = (blockedClassifications[cls] || 0) + 1;
    }
  }

  return {
    filtered,
    blockedCount: blocked.length,
    blockedClassifications
  };
}

export function buildRAGPolicyAuditEntry(options) {
  const {
    query,
    runtimeMode,
    userId,
    captureId,
    sourceClassification,
    requestCount,
    allowedCount,
    blockedCount,
    blockedClassifications = {},
    policyDecision,
    decisionReason
  } = options;

  return {
    type: 'rag_policy_gate',
    timestamp: new Date().toISOString(),
    rag_operation_id: `rag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    query: query.slice(0, 200),
    runtime_mode: runtimeMode,
    user_id: userId,
    capture_id: captureId,
    source_classification: sourceClassification,
    allowed_classifications: MODE_ALLOWED_CLASSIFICATIONS[runtimeMode]?.allowed || [],
    request_count: requestCount,
    allowed_count: allowedCount,
    blocked_count: blockedCount,
    blocked_classifications: blockedClassifications,
    policy_decision: policyDecision,
    decision_reason: decisionReason
  };
}

export async function enforceRAGPolicy(context, documents, auditLogger = null) {
  const { runtimeMode, userId, captureId, sourceClassification, query } = context;

  // Validate mode
  const modeConfig = MODE_ALLOWED_CLASSIFICATIONS[runtimeMode];
  if (!modeConfig) {
    throw new Error(`Unknown runtime mode: ${runtimeMode}`);
  }

  // Filter documents by policy
  const { filtered, blockedCount, blockedClassifications } = filterDocumentsByPolicy(documents, runtimeMode);

  // Determine policy decision
  let policyDecision = 'ALLOW';
  let decisionReason = null;

  if (modeConfig.allowed.length === 0) {
    policyDecision = 'BLOCK';
    decisionReason = modeConfig.rationale;
  } else if (blockedCount > 0 && filtered.length > 0) {
    policyDecision = 'PARTIAL';
    decisionReason = `${blockedCount} document(s) filtered by policy`;
  } else if (blockedCount > 0 && filtered.length === 0) {
    policyDecision = 'BLOCK';
    decisionReason = 'All documents filtered by policy';
  }

  // Build audit entry
  const auditEntry = buildRAGPolicyAuditEntry({
    query,
    runtimeMode,
    userId,
    captureId,
    sourceClassification,
    requestCount: documents.length,
    allowedCount: filtered.length,
    blockedCount,
    blockedClassifications,
    policyDecision,
    decisionReason
  });

  // Log to audit system (async, non-blocking)
  if (auditLogger && typeof auditLogger.log === 'function') {
    auditLogger.log(auditEntry).catch(err => {
      console.warn('Failed to log RAG policy audit:', err.message);
    });
  }

  return {
    policyEnforced: true,
    policyDecision,
    decisionReason,
    filtered,
    blockedCount,
    blockedClassifications,
    auditEntry
  };
}
