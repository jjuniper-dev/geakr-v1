import { InMemoryStore } from './storage/in-memory-store.js';
import { FileStore } from './storage/file-store.js';
import { OpenAIEmbedder } from './embedding/openai-embedder.js';
import { Retriever } from './retrieval/retriever.js';
import { DocumentLoader } from './ingestion/document-loader.js';
import { enforceRAGPolicy, MODE_ALLOWED_CLASSIFICATIONS } from './policy-gate.js';

let ragInstance = null;

export class RAG {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      embedding: {
        provider: config.embedding?.provider || 'openai',
        model: config.embedding?.model || 'text-embedding-3-small',
        dimensions: config.embedding?.dimensions || 1536,
        cacheSize: config.embedding?.cacheSize || 1000
      },
      storage: {
        type: config.storage?.type || 'file',
        path: config.storage?.path || './data/knowledge-base',
        maxDocuments: config.storage?.maxDocuments || 5000
      },
      retrieval: {
        similarityThreshold: config.retrieval?.similarityThreshold || 0.5,
        topK: config.retrieval?.topK || 5,
        maxTokensPerDocument: config.retrieval?.maxTokensPerDocument || 2000
      },
      team: {
        defaultTeam: config.team?.defaultTeam || 'default',
        enforceTeamBoundaries: config.team?.enforceTeamBoundaries !== false
      }
    };

    this.store = null;
    this.embedder = null;
    this.retriever = null;
    this.loader = null;
    this.auditLogger = config.auditLogger || null;
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('⚠️  RAG module disabled');
      return;
    }

    try {
      // Initialize embedder
      this.embedder = new OpenAIEmbedder({
        apiKey: process.env.OPENAI_API_KEY,
        model: this.config.embedding.model,
        dimensions: this.config.embedding.dimensions
      });

      // Initialize storage
      if (this.config.storage.type === 'file') {
        this.store = new FileStore({
          path: this.config.storage.path,
          flushDelay: 5000
        });
      } else {
        this.store = new InMemoryStore();
      }
      await this.store.initialize();

      // Initialize retriever
      this.retriever = new Retriever(this.store, this.embedder, {
        similarityThreshold: this.config.retrieval.similarityThreshold,
        topK: this.config.retrieval.topK,
        maxTokensPerDocument: this.config.retrieval.maxTokensPerDocument
      });

      // Initialize document loader
      this.loader = new DocumentLoader();

      console.log('✓ RAG module initialized');
      console.log(`   Storage: ${this.config.storage.type}`);
      console.log(`   Embedding model: ${this.config.embedding.model}`);
    } catch (error) {
      console.error('Failed to initialize RAG module:', error.message);
      throw error;
    }
  }

  async ingest({ documents = [], upsert = true }) {
    if (!this.config.enabled) {
      return { ok: false, error: 'RAG module disabled' };
    }

    const results = [];

    for (const docInput of documents) {
      const startTime = Date.now();
      try {
        // Load document (parse, chunk)
        const { documentId, document, chunkCount } = await this.loader.loadDocument(docInput);

        // Check if document already exists
        const existing = this.store.getDocument(documentId);
        if (existing && !upsert) {
          results.push({
            documentId,
            title: docInput.title,
            status: 'skipped',
            reason: 'Document already exists (upsert=false)'
          });
          continue;
        }

        // Embed chunks
        const chunkTexts = document.chunks.map(c => c.text);
        let embedding = null;

        if (chunkTexts.length > 0) {
          const embeddings = await this.embedder.embedBatch(chunkTexts);
          // Use average of chunk embeddings as document embedding
          embedding = this._averageEmbeddings(embeddings);
        }

        // Store document
        this.store.addDocument(documentId, document, embedding);

        // Log to audit trail (non-blocking)
        if (this.auditLogger && typeof this.auditLogger.logRAGIngestion === 'function') {
          const durationMs = Date.now() - startTime;
          this.auditLogger.logRAGIngestion({
            documentId,
            title: docInput.title,
            classification: docInput.classification,
            team: docInput.team,
            userId: docInput.userId,
            source: docInput.source,
            chunkCount,
            embeddingProvider: this.config.embedding.provider,
            embeddingModel: this.config.embedding.model,
            durationMs,
            status: 'success',
            error: null,
            captureId: docInput.captureId
          }).catch(err => {
            console.warn('Failed to log RAG ingestion:', err.message);
          });
        }

        results.push({
          documentId,
          title: docInput.title,
          chunks: chunkCount,
          embeddingStatus: 'cached',
          status: 'ingested'
        });
      } catch (error) {
        // Log failure to audit trail (non-blocking)
        if (this.auditLogger && typeof this.auditLogger.logRAGIngestion === 'function') {
          const durationMs = Date.now() - startTime;
          this.auditLogger.logRAGIngestion({
            documentId: `failed-${Date.now()}`,
            title: docInput.title,
            classification: docInput.classification,
            team: docInput.team,
            userId: docInput.userId,
            source: docInput.source,
            chunkCount: 0,
            embeddingProvider: this.config.embedding.provider,
            embeddingModel: this.config.embedding.model,
            durationMs,
            status: 'failed',
            error: error.message,
            captureId: docInput.captureId
          }).catch(err => {
            console.warn('Failed to log RAG ingestion error:', err.message);
          });
        }

        results.push({
          title: docInput.title,
          status: 'failed',
          error: error.message
        });
      }
    }

    return {
      ok: true,
      ingested: results.filter(r => r.status === 'ingested').length,
      documents: results
    };
  }

  async retrieve(query, options = {}) {
    if (!this.config.enabled || !this.retriever) {
      return { ok: false, error: 'RAG module not initialized' };
    }

    try {
      // Short-circuit metadata_only mode before any retrieval work
      if (options.enforcementContext?.runtimeMode === 'metadata_only') {
        const policyResult = await enforceRAGPolicy(
          {
            runtimeMode: 'metadata_only',
            userId: options.enforcementContext.userId,
            captureId: options.enforcementContext.captureId,
            sourceClassification: options.enforcementContext.sourceClassification,
            query
          },
          [],
          this.auditLogger
        );

        return {
          ok: true,
          query,
          results: [],
          resultCount: 0,
          executionTimeMs: 0,
          policyEnforced: true,
          policyDecision: policyResult.policyDecision,
          policyDetails: {
            decision: policyResult.policyDecision,
            reason: policyResult.decisionReason,
            blockedCount: 0,
            blockedClassifications: {}
          }
        };
      }

      const result = await this.retriever.retrieve(query, {
        topK: options.topK || this.config.retrieval.topK,
        threshold: options.threshold || this.config.retrieval.similarityThreshold,
        teamId: options.teamId,
        classification: options.classification,
        filters: options.filters
      });

      // Apply policy enforcement if enforcementContext provided
      let policyEnforced = false;
      let policyDecision = null;
      let policyDetails = null;

      if (options.enforcementContext && options.enforcementContext.runtimeMode) {
        const policyResult = await enforceRAGPolicy(
          {
            runtimeMode: options.enforcementContext.runtimeMode,
            userId: options.enforcementContext.userId,
            captureId: options.enforcementContext.captureId,
            sourceClassification: options.enforcementContext.sourceClassification,
            query
          },
          result.results,
          this.auditLogger
        );

        policyEnforced = true;
        policyDecision = policyResult.policyDecision;
        policyDetails = {
          decision: policyResult.policyDecision,
          reason: policyResult.decisionReason,
          blockedCount: policyResult.blockedCount,
          blockedClassifications: policyResult.blockedClassifications
        };

        // Replace results with policy-filtered results
        result.results = policyResult.filtered;
        result.resultCount = policyResult.filtered.length;
      }

      // Log retrieval to audit trail (non-blocking)
      if (this.auditLogger && typeof this.auditLogger.logRAGRetrieval === 'function') {
        this.auditLogger.logRAGRetrieval({
          query,
          userId: options.userId || options.enforcementContext?.userId,
          captureId: options.captureId || options.enforcementContext?.captureId,
          runtimeMode: options.enforcementContext?.runtimeMode,
          retrievedCount: result.resultCount,
          returnedCount: result.results.length,
          blockedCount: policyDetails?.blockedCount || 0,
          classificationsQueried: result.results.map(r => r.classification),
          blockedClassifications: policyDetails?.blockedClassifications || {},
          policyEnforced,
          policyDecision: policyDecision || 'NONE',
          similarityThreshold: options.threshold || this.config.retrieval.similarityThreshold,
          executionTimeMs: result.executionTimeMs,
          documentsReturned: result.results.slice(0, 10),
          sourceClassification: options.enforcementContext?.sourceClassification
        }).catch(err => {
          console.warn('Failed to log RAG retrieval:', err.message);
        });
      }

      return {
        ok: true,
        ...result,
        ...(policyEnforced && { policyEnforced, policyDecision, policyDetails })
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }

  async getStats() {
    if (!this.store) return null;
    return this.store.getStats();
  }

  async flush() {
    if (this.store && typeof this.store.flush === 'function') {
      await this.store.flush();
    }
  }

  _averageEmbeddings(embeddings) {
    if (!embeddings || embeddings.length === 0) return null;

    const dims = embeddings[0].length;
    const avg = new Float32Array(dims);

    for (const embedding of embeddings) {
      for (let i = 0; i < dims; i++) {
        avg[i] += embedding[i];
      }
    }

    for (let i = 0; i < dims; i++) {
      avg[i] /= embeddings.length;
    }

    return avg;
  }
}

export async function initializeRAG(config = {}) {
  ragInstance = new RAG(config);
  await ragInstance.initialize();
  return ragInstance;
}

export function getRAG() {
  if (!ragInstance) {
    throw new Error('RAG module not initialized. Call initializeRAG() first.');
  }
  return ragInstance;
}
