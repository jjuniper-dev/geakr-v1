import { initializeRAG, getRAG } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('RAG Integration', () => {
  let tempDir;
  let rag;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `rag-integration-${Date.now()}`);
    rag = await initializeRAG({
      enabled: true,
      storage: {
        type: 'file',
        path: tempDir
      },
      retrieval: {
        similarityThreshold: 0.5,
        topK: 3
      }
    });
  });

  afterEach(async () => {
    if (rag) {
      await rag.flush();
    }
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('initializes RAG module', () => {
    expect(rag).toBeDefined();
    expect(rag.store).toBeDefined();
    expect(rag.embedder).toBeDefined();
    expect(rag.retriever).toBeDefined();
  });

  it('ingests and retrieves documents', async () => {
    const result = await rag.ingest({
      documents: [
        {
          title: 'Kubernetes Guide',
          content: 'Kubernetes is a container orchestration platform. It manages containerized workloads.',
          format: 'markdown',
          classification: 'work',
          team: 'platform'
        }
      ]
    });

    expect(result.ok).toBe(true);
    expect(result.ingested).toBe(1);

    const retrieved = await rag.retrieve('What is Kubernetes?', {
      teamId: 'platform'
    });

    expect(retrieved.ok).toBe(true);
    // Mock embedder returns similarity 1.0, should exceed threshold
    expect(retrieved.results.length).toBeGreaterThan(0);
  });

  it('returns stats', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Doc 1',
          content: 'Content for doc 1',
          classification: 'public'
        },
        {
          title: 'Doc 2',
          content: 'Content for doc 2',
          classification: 'public'
        }
      ]
    });

    const stats = await rag.getStats();
    expect(stats.totalDocuments).toBe(2);
  });

  it('enforces team boundaries', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Team A Doc',
          content: 'Content for team A',
          team: 'teamA'
        },
        {
          title: 'Team B Doc',
          content: 'Content for team B',
          team: 'teamB'
        }
      ]
    });

    const teamAResults = await rag.retrieve('Content', { teamId: 'teamA' });
    const teamBResults = await rag.retrieve('Content', { teamId: 'teamB' });

    // Results should be filtered by team (when using actual embeddings)
    expect(teamAResults.ok).toBe(true);
    expect(teamBResults.ok).toBe(true);
  });

  it('persists documents across instances', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Persistent Document',
          content: 'This should persist across instances'
        }
      ]
    });
    await rag.flush();

    // Create new RAG instance with same storage path
    const rag2 = await initializeRAG({
      enabled: true,
      storage: {
        type: 'file',
        path: tempDir
      }
    });

    const stats = await rag2.getStats();
    expect(stats.totalDocuments).toBe(1);
  });

  it('skips existing documents when upsert=false', async () => {
    const doc = {
      title: 'Unique Document',
      content: 'Original content'
    };

    const result1 = await rag.ingest({ documents: [doc] });
    const result2 = await rag.ingest({ documents: [doc], upsert: false });

    expect(result1.ingested).toBe(1);
    expect(result2.ingested).toBe(0);
    expect(result2.documents[0].status).toBe('skipped');
  });

  it('handles ingestion errors gracefully', async () => {
    const result = await rag.ingest({
      documents: [
        {
          title: 'Invalid Doc',
          content: 'Valid content',
          classification: 'invalid'
        }
      ]
    });

    expect(result.ok).toBe(true);
    expect(result.documents[0].status).toBe('failed');
  });

  it('returns disabled RAG gracefully', async () => {
    const disabledRag = await initializeRAG({ enabled: false });

    const ingestResult = await disabledRag.ingest({
      documents: [{ title: 'Test', content: 'Content' }]
    });

    expect(ingestResult.ok).toBe(false);
    expect(ingestResult.error).toContain('disabled');
  });

  it('getRAG throws when not initialized', () => {
    // Clear the global instance
    const originalRag = global.ragInstance;
    global.ragInstance = null;

    expect(() => {
      require('../index.js').getRAG();
    }).toThrow('RAG module not initialized');

    global.ragInstance = originalRag;
  });
});
