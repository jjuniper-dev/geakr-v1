import { InMemoryStore } from '../storage/in-memory-store.js';
import { FileStore } from '../storage/file-store.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Storage', () => {
  describe('InMemoryStore', () => {
    let store;

    beforeEach(() => {
      store = new InMemoryStore();
    });

    it('initializes with empty data', () => {
      expect(store.documents.size).toBe(0);
      expect(store.embeddings.size).toBe(0);
      expect(store.stats.totalDocuments).toBe(0);
    });

    it('adds documents', () => {
      const doc = {
        id: 'doc-1',
        title: 'Test',
        team: 'default',
        chunks: [{ text: 'chunk 1' }]
      };
      const embedding = new Float32Array([0.1, 0.2, 0.3]);

      store.addDocument(doc.id, doc, embedding);

      expect(store.documents.size).toBe(1);
      expect(store.embeddings.size).toBe(1);
      expect(store.stats.totalDocuments).toBe(1);
    });

    it('retrieves documents by ID', () => {
      const doc = { id: 'doc-1', title: 'Test', team: 'default', chunks: [] };
      store.addDocument(doc.id, doc, null);

      const retrieved = store.getDocument('doc-1');
      expect(retrieved).toEqual(doc);
    });

    it('retrieves embeddings by ID', () => {
      const doc = { id: 'doc-1', title: 'Test', team: 'default', chunks: [] };
      const embedding = new Float32Array([0.1, 0.2, 0.3]);
      store.addDocument(doc.id, doc, embedding);

      const retrieved = store.getEmbedding('doc-1');
      expect(retrieved).toEqual(embedding);
    });

    it('filters documents by team', () => {
      store.addDocument('doc-1', { id: 'doc-1', team: 'teamA', chunks: [] }, null);
      store.addDocument('doc-2', { id: 'doc-2', team: 'teamB', chunks: [] }, null);
      store.addDocument('doc-3', { id: 'doc-3', team: 'teamA', chunks: [] }, null);

      const teamADocs = store.getDocumentsByTeam('teamA');
      expect(teamADocs).toHaveLength(2);
      expect(teamADocs.map(d => d.id)).toContain('doc-1');
      expect(teamADocs.map(d => d.id)).toContain('doc-3');
    });

    it('deletes documents', () => {
      store.addDocument('doc-1', { id: 'doc-1', team: 'default', chunks: [] }, null);
      expect(store.documents.size).toBe(1);

      const deleted = store.deleteDocument('doc-1');
      expect(deleted).toBe(true);
      expect(store.documents.size).toBe(0);
    });

    it('clears all data', () => {
      store.addDocument('doc-1', { id: 'doc-1', team: 'default', chunks: [] }, null);
      store.addDocument('doc-2', { id: 'doc-2', team: 'default', chunks: [] }, null);

      store.clear();

      expect(store.documents.size).toBe(0);
      expect(store.embeddings.size).toBe(0);
      expect(store.teamIndex.size).toBe(0);
    });

    it('returns stats', () => {
      store.addDocument('doc-1', {
        id: 'doc-1',
        team: 'default',
        chunks: [{ text: 'a' }, { text: 'b' }]
      }, null);

      const stats = store.getStats();
      expect(stats.totalDocuments).toBe(1);
      expect(stats.totalChunks).toBe(2);
      expect(stats.lastUpdated).toBeDefined();
    });
  });

  describe('FileStore', () => {
    let store;
    let tempDir;

    beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `rag-test-${Date.now()}`);
      store = new FileStore({ path: tempDir });
      await store.initialize();
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('initializes directory structure', async () => {
      const stats = await fs.stat(tempDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('persists documents to disk', async () => {
      const doc = {
        id: 'doc-1',
        title: 'Test',
        team: 'default',
        chunks: [{ text: 'chunk 1' }]
      };
      store.addDocument(doc.id, doc, null);
      await store.flush();

      const content = await fs.readFile(path.join(tempDir, 'documents.jsonl'), 'utf-8');
      expect(content).toContain('doc-1');
    });

    it('loads documents from disk on initialization', async () => {
      const doc = {
        id: 'doc-1',
        title: 'Test',
        team: 'default',
        chunks: []
      };
      store.addDocument(doc.id, doc, null);
      await store.flush();

      // Create new store instance
      const store2 = new FileStore({ path: tempDir });
      await store2.initialize();

      const retrieved = store2.getDocument('doc-1');
      expect(retrieved).toBeDefined();
      expect(retrieved.title).toBe('Test');
    });

    it('persists embeddings', async () => {
      const doc = { id: 'doc-1', team: 'default', chunks: [] };
      const embedding = new Float32Array([0.1, 0.2, 0.3]);
      store.addDocument(doc.id, doc, embedding);
      await store.flush();

      const content = await fs.readFile(path.join(tempDir, 'embeddings.jsonl'), 'utf-8');
      expect(content).toContain('doc-1');
    });

    it('maintains team index', async () => {
      store.addDocument('doc-1', { id: 'doc-1', team: 'teamA', chunks: [] }, null);
      store.addDocument('doc-2', { id: 'doc-2', team: 'teamB', chunks: [] }, null);
      await store.flush();

      const indexContent = await fs.readFile(path.join(tempDir, 'metadata-index.json'), 'utf-8');
      const index = JSON.parse(indexContent);
      expect(index.teamA).toContain('doc-1');
      expect(index.teamB).toContain('doc-2');
    });
  });
});
