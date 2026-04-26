export class InMemoryStore {
  constructor(options = {}) {
    this.embeddings = new Map();
    this.documents = new Map();
    this.teamIndex = new Map();
    this.stats = {
      totalDocuments: 0,
      totalChunks: 0,
      lastUpdated: null
    };
  }

  async initialize() {
    // No-op for in-memory store
  }

  addDocument(documentId, documentMetadata, embedding) {
    this.documents.set(documentId, documentMetadata);
    if (embedding) {
      this.embeddings.set(documentId, embedding);
    }

    // Update team index
    const team = documentMetadata.team || 'default';
    if (!this.teamIndex.has(team)) {
      this.teamIndex.set(team, new Set());
    }
    this.teamIndex.get(team).add(documentId);

    // Update stats
    this.stats.totalDocuments = this.documents.size;
    this.stats.totalChunks += (documentMetadata.chunks?.length || 0);
    this.stats.lastUpdated = new Date().toISOString();
  }

  getDocument(documentId) {
    return this.documents.get(documentId);
  }

  getEmbedding(documentId) {
    return this.embeddings.get(documentId);
  }

  getAllDocuments() {
    return Array.from(this.documents.values());
  }

  getDocumentsByTeam(team) {
    const docIds = this.teamIndex.get(team) || new Set();
    return Array.from(docIds).map(id => this.documents.get(id));
  }

  deleteDocument(documentId) {
    const doc = this.documents.get(documentId);
    if (!doc) return false;

    this.documents.delete(documentId);
    this.embeddings.delete(documentId);

    // Remove from team index
    const team = doc.team || 'default';
    if (this.teamIndex.has(team)) {
      this.teamIndex.get(team).delete(documentId);
    }

    this.stats.totalDocuments = this.documents.size;
    this.stats.lastUpdated = new Date().toISOString();
    return true;
  }

  clear() {
    this.embeddings.clear();
    this.documents.clear();
    this.teamIndex.clear();
    this.stats = {
      totalDocuments: 0,
      totalChunks: 0,
      lastUpdated: null
    };
  }

  getStats() {
    return { ...this.stats };
  }
}
