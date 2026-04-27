import { log } from './logger.js';

/**
 * Generate a unique RAG operation ID for linking related operations
 * @param {string} operation - "ingestion" or "retrieval"
 * @returns {string} Operation ID like "rag-ingest-1234567890-abc123"
 */
export function generateRAGOperationId(operation) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  const prefix = operation === 'ingestion' ? 'rag-ingest' : 'rag-retrieve';
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Truncate query for privacy while maintaining readability
 * @param {string} query - Original query
 * @param {number} maxLength - Maximum length (default 200)
 * @returns {string} Truncated query with indicator if truncated
 */
export function truncateQuery(query, maxLength = 200) {
  if (!query) return '';
  if (query.length <= maxLength) return query;
  return query.slice(0, maxLength - 3) + '...';
}

/**
 * Sanitize document title for audit logging
 * @param {string} title - Original title
 * @param {number} maxLength - Maximum length (default 255)
 * @returns {string} Sanitized title
 */
export function sanitizeTitle(title, maxLength = 255) {
  if (!title) return 'untitled';
  return title.slice(0, maxLength);
}

/**
 * Log RAG document ingestion to audit trail
 * @param {Object} options - Ingestion details
 * @returns {Promise<void>}
 */
export async function logRAGIngestion(options) {
  const {
    documentId,
    title,
    classification,
    team,
    userId,
    source,
    chunkCount,
    embeddingProvider,
    embeddingModel,
    durationMs,
    status,
    error,
    captureId
  } = options;

  const entry = {
    type: 'rag_ingestion',
    timestamp: new Date().toISOString(),
    rag_operation_id: generateRAGOperationId('ingestion'),
    document_id: documentId,
    title: sanitizeTitle(title),
    classification: classification || 'unknown',
    team: team || 'default',
    user_id: userId || 'unknown',
    source: {
      type: source?.type || 'internal',
      url: source?.url || null,
      version: source?.version || null
    },
    chunk_count: chunkCount || 0,
    embedding_provider: embeddingProvider || 'unknown',
    embedding_model: embeddingModel || 'unknown',
    duration_ms: durationMs || 0,
    status: status || 'success',
    error: error || null,
    ...(captureId && { capture_id: captureId })
  };

  await log(entry);
}

/**
 * Log RAG document retrieval to audit trail
 * @param {Object} options - Retrieval details
 * @returns {Promise<void>}
 */
export async function logRAGRetrieval(options) {
  const {
    query,
    userId,
    captureId,
    runtimeMode,
    retrievedCount,
    returnedCount,
    blockedCount,
    classificationsQueried,
    blockedClassifications,
    policyEnforced,
    policyDecision,
    similarityThreshold,
    executionTimeMs,
    documentsReturned,
    sourceClassification
  } = options;

  // Limit documents returned to max 10 for log size (still preserves evidence)
  const docsToLog = (documentsReturned || [])
    .slice(0, 10)
    .map(doc => ({
      document_id: doc.documentId || doc.id,
      title: sanitizeTitle(doc.title),
      classification: doc.classification || 'unknown',
      similarity_score: Number((doc.similarity || 0).toFixed(3))
    }));

  const entry = {
    type: 'rag_retrieval',
    timestamp: new Date().toISOString(),
    rag_operation_id: generateRAGOperationId('retrieval'),
    query: truncateQuery(query),
    user_id: userId || 'unknown',
    ...(captureId && { capture_id: captureId }),
    runtime_mode: runtimeMode || null,
    retrieved_count: retrievedCount || 0,
    returned_count: returnedCount || 0,
    blocked_count: blockedCount || 0,
    classifications_queried: classificationsQueried || [],
    blocked_classifications: blockedClassifications || {},
    policy_enforced: policyEnforced || false,
    policy_decision: policyDecision || 'NONE',
    similarity_threshold: similarityThreshold || 0.5,
    execution_time_ms: executionTimeMs || 0,
    documents_returned: docsToLog,
    ...(sourceClassification && { source_classification: sourceClassification })
  };

  await log(entry);
}
