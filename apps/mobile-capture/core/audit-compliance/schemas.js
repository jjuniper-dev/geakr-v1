/**
 * Audit Entry Schemas for RAG Operations
 *
 * These schemas define the structure and validation rules for all RAG-related audit entries.
 * Used for HC government compliance, audit trail reconstruction, and data governance.
 */

/**
 * RAG Ingestion Entry
 * Logged when documents are ingested into the knowledge base
 *
 * @typedef {Object} RAGIngestionEntry
 * @property {string} type - Fixed value: "rag_ingestion"
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} rag_operation_id - Unique ID for linking related operations
 * @property {string} document_id - Hashed document identifier (e.g., "doc-abc123")
 * @property {string} title - Document title (max 255 chars, truncated)
 * @property {string} classification - "public" | "unknown" | "work" | "personal"
 * @property {string} team - Team identifier
 * @property {string} user_id - User email or system identifier
 * @property {Object} source - Document source metadata
 * @property {string} source.type - "internal" | "external" | "generated"
 * @property {string} source.url - Optional URL reference
 * @property {string} source.version - Optional version string
 * @property {number} chunk_count - Number of text chunks created
 * @property {string} embedding_provider - "openai" | "huggingface" | "local"
 * @property {string} embedding_model - Model name (e.g., "text-embedding-3-small")
 * @property {number} duration_ms - Time taken to ingest (embedding + storage)
 * @property {string} status - "success" | "failed"
 * @property {string|null} error - Error message if status="failed", else null
 * @property {string|null} capture_id - Optional execution context ID for correlation
 */
export const RAGIngestionEntrySchema = {
  type: 'rag_ingestion',
  required: [
    'timestamp', 'rag_operation_id', 'document_id', 'title', 'classification', 'team',
    'user_id', 'chunk_count', 'embedding_provider', 'embedding_model', 'duration_ms', 'status'
  ],
  properties: {
    type: { type: 'string', enum: ['rag_ingestion'] },
    timestamp: { type: 'string', format: 'date-time' },
    rag_operation_id: { type: 'string', pattern: '^rag-ingest-' },
    document_id: { type: 'string' },
    title: { type: 'string', maxLength: 255 },
    classification: { type: 'string', enum: ['public', 'unknown', 'work', 'personal'] },
    team: { type: 'string' },
    user_id: { type: 'string' },
    source: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['internal', 'external', 'generated'] },
        url: { type: 'string', nullable: true },
        version: { type: 'string', nullable: true }
      }
    },
    chunk_count: { type: 'number', minimum: 0 },
    embedding_provider: { type: 'string' },
    embedding_model: { type: 'string' },
    duration_ms: { type: 'number', minimum: 0 },
    status: { type: 'string', enum: ['success', 'failed'] },
    error: { type: 'string', nullable: true },
    capture_id: { type: 'string', nullable: true }
  }
};

/**
 * RAG Retrieval Entry
 * Logged when documents are retrieved from the knowledge base
 *
 * @typedef {Object} RAGRetrievalEntry
 * @property {string} type - Fixed value: "rag_retrieval"
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} rag_operation_id - Unique ID for linking related operations
 * @property {string} query - Search query (max 200 chars, truncated for privacy)
 * @property {string} user_id - User email or system identifier
 * @property {string|null} capture_id - Optional execution context ID
 * @property {string} runtime_mode - Policy enforcement mode
 * @property {number} retrieved_count - Documents matched before policy filtering
 * @property {number} returned_count - Documents returned after policy filtering
 * @property {number} blocked_count - Documents blocked by policy
 * @property {Array<string>} classifications_queried - Classifications of retrieved docs
 * @property {Object} blocked_classifications - Count of blocked docs by classification
 * @property {boolean} policy_enforced - Whether policy filtering was applied
 * @property {string} policy_decision - "ALLOW" | "PARTIAL" | "BLOCK"
 * @property {number} similarity_threshold - Minimum similarity score used
 * @property {number} execution_time_ms - Total execution time
 * @property {Array<Object>} documents_returned - Sample of returned documents (max 10)
 * @property {string} source_classification - Classification of the requesting document
 */
export const RAGRetrievalEntrySchema = {
  type: 'rag_retrieval',
  required: [
    'timestamp', 'rag_operation_id', 'query', 'user_id', 'runtime_mode',
    'retrieved_count', 'returned_count', 'blocked_count', 'policy_enforced',
    'policy_decision', 'execution_time_ms'
  ],
  properties: {
    type: { type: 'string', enum: ['rag_retrieval'] },
    timestamp: { type: 'string', format: 'date-time' },
    rag_operation_id: { type: 'string', pattern: '^rag-retrieve-' },
    query: { type: 'string', maxLength: 200 },
    user_id: { type: 'string' },
    capture_id: { type: 'string', nullable: true },
    runtime_mode: {
      type: 'string',
      enum: ['metadata_only', 'local_only', 'local_llm', 'external_api_public_only', 'approved_enterprise', null],
      nullable: true
    },
    retrieved_count: { type: 'number', minimum: 0 },
    returned_count: { type: 'number', minimum: 0 },
    blocked_count: { type: 'number', minimum: 0 },
    classifications_queried: { type: 'array', items: { type: 'string' } },
    blocked_classifications: { type: 'object' },
    policy_enforced: { type: 'boolean' },
    policy_decision: { type: 'string', enum: ['ALLOW', 'PARTIAL', 'BLOCK', 'NONE'] },
    similarity_threshold: { type: 'number', minimum: 0, maximum: 1 },
    execution_time_ms: { type: 'number', minimum: 0 },
    documents_returned: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        properties: {
          document_id: { type: 'string' },
          title: { type: 'string' },
          classification: { type: 'string' },
          similarity_score: { type: 'number', minimum: 0, maximum: 1 }
        }
      }
    },
    source_classification: { type: 'string', nullable: true }
  }
};

/**
 * Validate an audit entry against its schema
 * @param {Object} entry - Entry to validate
 * @param {string} entryType - "rag_ingestion" or "rag_retrieval"
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateAuditEntry(entry, entryType) {
  const errors = [];

  const schema = entryType === 'rag_ingestion'
    ? RAGIngestionEntrySchema
    : RAGRetrievalEntrySchema;

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in entry)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Basic type checking on critical fields
  if (entry.type && entry.type !== schema.type) {
    errors.push(`Expected type "${schema.type}", got "${entry.type}"`);
  }

  if (entry.timestamp && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(entry.timestamp)) {
    errors.push(`Invalid timestamp format: ${entry.timestamp}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
