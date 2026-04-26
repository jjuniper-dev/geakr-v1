import { cosineSimilarity, scoreDocument } from '../retrieval/scoring.js';
import { Retriever } from '../retrieval/retriever.js';
import { InMemoryStore } from '../storage/in-memory-store.js';

describe('Retrieval', () => {
  describe('Scoring', () => {
    it('calculates cosine similarity', () => {
      const a = new Float32Array([1, 0, 0]);
      const b = new Float32Array([1, 0, 0]);
      expect(cosineSimilarity(a, b)).toBeCloseTo(1);
    });

    it('handles orthogonal vectors', () => {
      const a = new Float32Array([1, 0, 0]);
      const b = new Float32Array([0, 1, 0]);
      expect(cosineSimilarity(a, b)).toBeCloseTo(0);
    });

    it('handles opposite vectors', () => {
      const a = new Float32Array([1, 0, 0]);
      const b = new Float32Array([-1, 0, 0]);
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
    });

    it('handles null embeddings', () => {
      expect(cosineSimilarity(null, new Float32Array([1, 2, 3]))).toBe(0);
      expect(cosineSimilarity(new Float32Array([1, 2, 3]), null)).toBe(0);
    });

    it('scores documents with metadata boost', () => {
      const query = new Float32Array([0.8, 0.2]);
      const doc = {
        embedding: new Float32Array([0.8, 0.2]),
        classification: 'work',
        timestamp: new Date().toISOString()
      };

      const score = scoreDocument(query, doc);
      expect(score).toBeGreaterThan(0.9);
    });

    it('penalizes old documents', () => {
      const query = new Float32Array([0.8, 0.2]);

      const recentDoc = {
        embedding: new Float32Array([0.8, 0.2]),
        classification: 'public',
        timestamp: new Date().toISOString()
      };

      const oldDoc = {
        embedding: new Float32Array([0.8, 0.2]),
        classification: 'public',
        timestamp: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const recentScore = scoreDocument(query, recentDoc);
      const oldScore = scoreDocument(query, oldDoc);

      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });

  describe('Retriever', () => {
    let store;
    let retriever;

    beforeEach(() => {
      store = new InMemoryStore();

      const mockEmbedder = {
        embed: async (text) => new Float32Array([0.8, 0.2]),
        getDimensions: async () => 2
      };

      retriever = new Retriever(store, mockEmbedder, {
        similarityThreshold: 0.5,
        topK: 2
      });
    });

    it('returns empty results for empty store', async () => {
      const results = await retriever.retrieve('test query');
      expect(results.results).toHaveLength(0);
    });

    it('filters by team', async () => {
      store.addDocument('doc-1', {
        id: 'doc-1',
        title: 'Doc 1',
        team: 'teamA',
        chunks: [{ text: 'content' }],
        classification: 'public'
      }, new Float32Array([0.8, 0.2]));

      store.addDocument('doc-2', {
        id: 'doc-2',
        title: 'Doc 2',
        team: 'teamB',
        chunks: [{ text: 'content' }],
        classification: 'public'
      }, new Float32Array([0.8, 0.2]));

      const results = await retriever.retrieve('test', { teamId: 'teamA' });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].documentId).toBe('doc-1');
    });

    it('applies similarity threshold', async () => {
      store.addDocument('doc-1', {
        id: 'doc-1',
        title: 'Doc 1',
        team: 'default',
        chunks: [{ text: 'content' }],
        classification: 'public'
      }, new Float32Array([0.8, 0.2]));

      const results = await retriever.retrieve('test', { threshold: 0.95 });
      expect(results.results).toHaveLength(0);
    });

    it('respects topK limit', async () => {
      for (let i = 0; i < 5; i++) {
        store.addDocument(`doc-${i}`, {
          id: `doc-${i}`,
          title: `Doc ${i}`,
          team: 'default',
          chunks: [{ text: 'content' }],
          classification: 'public'
        }, new Float32Array([0.8, 0.2]));
      }

      const results = await retriever.retrieve('test');
      expect(results.results.length).toBeLessThanOrEqual(2);
    });

    it('returns document metadata', async () => {
      store.addDocument('doc-1', {
        id: 'doc-1',
        title: 'Test Document',
        team: 'engineering',
        chunks: [{ text: 'content', index: 0 }],
        classification: 'work',
        metadata: { domain: 'kubernetes' }
      }, new Float32Array([0.8, 0.2]));

      const results = await retriever.retrieve('test');
      expect(results.results[0].title).toBe('Test Document');
      expect(results.results[0].classification).toBe('work');
      expect(results.results[0].metadata.domain).toBe('kubernetes');
    });
  });
});
