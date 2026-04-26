import fs from 'fs/promises';
import path from 'path';
import { InMemoryStore } from './in-memory-store.js';

export class FileStore extends InMemoryStore {
  constructor(options = {}) {
    super(options);
    this.storagePath = options.path || './data/knowledge-base';
    this.embeddingsFile = path.join(this.storagePath, 'embeddings.jsonl');
    this.documentsFile = path.join(this.storagePath, 'documents.jsonl');
    this.indexFile = path.join(this.storagePath, 'metadata-index.json');
    this.flushPending = false;
    this.flushDelay = options.flushDelay || 5000;
  }

  async initialize() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });

      // Load existing data
      await this._loadEmbeddings();
      await this._loadDocuments();
      await this._loadIndex();
    } catch (error) {
      console.warn('Failed to load knowledge base from file:', error.message);
      // Continue with empty store
    }
  }

  async _loadEmbeddings() {
    try {
      const content = await fs.readFile(this.embeddingsFile, 'utf-8');
      const lines = content.trim().split('\n');
      for (const line of lines) {
        if (!line) continue;
        const { docId, embedding } = JSON.parse(line);
        this.embeddings.set(docId, new Float32Array(embedding));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  async _loadDocuments() {
    try {
      const content = await fs.readFile(this.documentsFile, 'utf-8');
      const lines = content.trim().split('\n');
      for (const line of lines) {
        if (!line) continue;
        const doc = JSON.parse(line);
        this.documents.set(doc.id, doc);
      }
      this.stats.totalDocuments = this.documents.size;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  async _loadIndex() {
    try {
      const content = await fs.readFile(this.indexFile, 'utf-8');
      const index = JSON.parse(content);
      for (const [team, docIds] of Object.entries(index)) {
        this.teamIndex.set(team, new Set(docIds));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  addDocument(documentId, documentMetadata, embedding) {
    super.addDocument(documentId, documentMetadata, embedding);
    this._scheduleFlush();
  }

  deleteDocument(documentId) {
    const result = super.deleteDocument(documentId);
    if (result) this._scheduleFlush();
    return result;
  }

  _scheduleFlush() {
    if (this.flushPending) return;
    this.flushPending = true;
    setTimeout(() => this._flush(), this.flushDelay);
  }

  async _flush() {
    try {
      this.flushPending = false;
      await Promise.all([
        this._saveEmbeddings(),
        this._saveDocuments(),
        this._saveIndex()
      ]);
    } catch (error) {
      console.error('Failed to flush knowledge base to disk:', error.message);
    }
  }

  async _saveEmbeddings() {
    const lines = Array.from(this.embeddings.entries()).map(([docId, embedding]) =>
      JSON.stringify({
        docId,
        embedding: Array.from(embedding)
      })
    );
    await fs.writeFile(this.embeddingsFile, lines.join('\n') + (lines.length > 0 ? '\n' : ''), 'utf-8');
  }

  async _saveDocuments() {
    const lines = Array.from(this.documents.values()).map(doc => JSON.stringify(doc));
    await fs.writeFile(this.documentsFile, lines.join('\n') + (lines.length > 0 ? '\n' : ''), 'utf-8');
  }

  async _saveIndex() {
    const index = {};
    for (const [team, docIds] of this.teamIndex.entries()) {
      index[team] = Array.from(docIds);
    }
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2), 'utf-8');
  }

  async flush() {
    await this._flush();
  }
}
