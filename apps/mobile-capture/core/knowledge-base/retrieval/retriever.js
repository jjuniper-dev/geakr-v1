import { scoreDocument } from './scoring.js';

export class Retriever {
  constructor(store, embedder, options = {}) {
    this.store = store;
    this.embedder = embedder;
    this.similarityThreshold = options.similarityThreshold || 0.5;
    this.defaultTopK = options.topK || 5;
    this.maxTokensPerDocument = options.maxTokensPerDocument || 2000;
  }

  async retrieve(query, options = {}) {
    const {
      topK = this.defaultTopK,
      threshold = this.similarityThreshold,
      teamId = null,
      classification = null,
      filters = {}
    } = options;

    const startTime = Date.now();

    // Step 1: Embed query
    const queryEmbedding = await this.embedder.embed(query);

    // Step 2: Get candidate documents
    let candidates = this.store.getAllDocuments();

    // Filter by team (access control)
    if (teamId) {
      const allowedDocs = this.store.getDocumentsByTeam(teamId);
      const allowedIds = new Set(allowedDocs.map(d => d.id));
      candidates = candidates.filter(doc => allowedIds.has(doc.id));
    }

    // Filter by metadata if provided
    if (filters.metadata) {
      candidates = candidates.filter(doc => {
        if (!doc.metadata) return false;
        return Object.entries(filters.metadata).every(
          ([key, value]) => doc.metadata[key] === value
        );
      });
    }

    // Step 3: Score all candidates
    const scored = candidates.map(doc => {
      const embedding = this.store.getEmbedding(doc.id);
      const docWithEmbedding = { ...doc, embedding };
      return {
        ...doc,
        score: scoreDocument(queryEmbedding, docWithEmbedding)
      };
    });

    // Step 4: Apply threshold and sort
    const results = scored
      .filter(doc => doc.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(doc => {
        // Return document with top-K chunks only
        const chunks = (doc.chunks || []).slice(0, 3);
        return {
          documentId: doc.id,
          title: doc.title,
          classification: doc.classification,
          team: doc.team,
          similarity: Number(doc.score.toFixed(3)),
          chunks,
          metadata: doc.metadata || {}
        };
      });

    const executionTime = Date.now() - startTime;

    return {
      query,
      results,
      resultCount: results.length,
      executionTimeMs: executionTime
    };
  }
}
