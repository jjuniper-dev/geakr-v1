import { initializeRAG, getRAG } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('RAG Policy Gate Integration', () => {
  let tempDir;
  let rag;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `rag-policy-test-${Date.now()}`);

    // Mock audit logger
    const auditLog = [];
    const mockAuditLogger = {
      log: (entry) => {
        auditLog.push(entry);
        return Promise.resolve();
      },
      entries: auditLog
    };

    rag = await initializeRAG({
      enabled: true,
      storage: {
        type: 'file',
        path: tempDir
      },
      auditLogger: mockAuditLogger
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

  it('enforces metadata_only mode blocks all RAG access', async () => {
    // Ingest documents
    await rag.ingest({
      documents: [
        {
          title: 'Public Doc',
          content: 'Public content',
          classification: 'public'
        },
        {
          title: 'Work Doc',
          content: 'Work content',
          classification: 'work'
        }
      ]
    });

    // Retrieve with metadata_only enforcement
    const result = await rag.retrieve('content', {
      enforcementContext: {
        runtimeMode: 'metadata_only',
        userId: 'user-123',
        captureId: 'capture-456'
      }
    });

    expect(result.ok).toBe(true);
    expect(result.policyEnforced).toBe(true);
    expect(result.policyDecision).toBe('BLOCK');
    expect(result.results).toHaveLength(0);
  });

  it('enforces external_api_public_only blocks work documents', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Public Doc',
          content: 'Public content',
          classification: 'public'
        },
        {
          title: 'Work Doc',
          content: 'Work content',
          classification: 'work'
        }
      ]
    });

    const result = await rag.retrieve('content', {
      enforcementContext: {
        runtimeMode: 'external_api_public_only',
        userId: 'user-123',
        captureId: 'capture-456'
      }
    });

    expect(result.policyEnforced).toBe(true);
    expect(result.policyDecision).toBe('PARTIAL');
    expect(result.results.every(r => r.classification === 'public')).toBe(true);
    expect(result.policyDetails.blockedCount).toBe(1);
  });

  it('enforces approved_enterprise allows all non-personal documents', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Public Doc',
          content: 'Public content',
          classification: 'public'
        },
        {
          title: 'Work Doc',
          content: 'Work content',
          classification: 'work'
        },
        {
          title: 'Personal Doc',
          content: 'Personal content',
          classification: 'personal'
        }
      ]
    });

    const result = await rag.retrieve('content', {
      enforcementContext: {
        runtimeMode: 'approved_enterprise',
        userId: 'user-123',
        captureId: 'capture-456'
      }
    });

    expect(result.policyEnforced).toBe(true);
    expect(result.policyDecision).toBe('PARTIAL');
    expect(result.results.length).toBe(2);
    expect(result.results.every(r => r.classification !== 'personal')).toBe(true);
  });

  it('allows unknown classification as public in filtered modes', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Unknown Doc',
          content: 'Unknown content',
          classification: 'unknown'
        }
      ]
    });

    const result = await rag.retrieve('content', {
      enforcementContext: {
        runtimeMode: 'local_only',
        userId: 'user-123',
        captureId: 'capture-456'
      }
    });

    expect(result.policyEnforced).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.policyDecision).toBe('ALLOW');
  });

  it('maintains backward compatibility without enforcementContext', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Any Doc',
          content: 'Any content',
          classification: 'work'
        }
      ]
    });

    // Retrieve without enforcement context
    const result = await rag.retrieve('content', {});

    expect(result.ok).toBe(true);
    expect(result.policyEnforced).toBeUndefined();
    expect(result.results).toHaveLength(1);
  });

  it('logs audit entries for policy-enforced retrieval', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Doc 1',
          content: 'Content 1',
          classification: 'public'
        },
        {
          title: 'Doc 2',
          content: 'Content 2',
          classification: 'work'
        }
      ]
    });

    await rag.retrieve('content', {
      enforcementContext: {
        runtimeMode: 'external_api_public_only',
        userId: 'alice@example.com',
        captureId: 'capture-789',
        sourceClassification: 'unknown'
      }
    });

    const auditLogger = rag.auditLogger;
    expect(auditLogger.entries.length).toBeGreaterThan(0);

    const policyEntry = auditLogger.entries.find(e => e.type === 'rag_policy_gate');
    expect(policyEntry).toBeDefined();
    expect(policyEntry.runtime_mode).toBe('external_api_public_only');
    expect(policyEntry.user_id).toBe('alice@example.com');
    expect(policyEntry.capture_id).toBe('capture-789');
    expect(policyEntry.request_count).toBeGreaterThan(0);
    expect(policyEntry.allowed_count).toBeGreaterThan(0);
    expect(policyEntry.blocked_count).toBeGreaterThan(0);
  });

  it('combines team filtering with policy enforcement', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Team A Public',
          content: 'Team A public content',
          team: 'teamA',
          classification: 'public'
        },
        {
          title: 'Team B Work',
          content: 'Team B work content',
          team: 'teamB',
          classification: 'work'
        },
        {
          title: 'Team A Work',
          content: 'Team A work content',
          team: 'teamA',
          classification: 'work'
        }
      ]
    });

    const result = await rag.retrieve('content', {
      teamId: 'teamA',
      enforcementContext: {
        runtimeMode: 'external_api_public_only',
        userId: 'user-123',
        captureId: 'capture-123'
      }
    });

    // Should have only teamA + public classification
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe('Team A Public');
  });

  it('handles empty results after policy filtering', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Work Only',
          content: 'Work content',
          classification: 'work'
        }
      ]
    });

    const result = await rag.retrieve('content', {
      enforcementContext: {
        runtimeMode: 'local_only',
        userId: 'user-123',
        captureId: 'capture-456'
      }
    });

    expect(result.ok).toBe(true);
    expect(result.policyDecision).toBe('BLOCK');
    expect(result.results).toHaveLength(0);
  });

  it('includes policy details in response', async () => {
    await rag.ingest({
      documents: [
        {
          title: 'Public Doc',
          content: 'Public content',
          classification: 'public'
        },
        {
          title: 'Work Doc',
          content: 'Work content',
          classification: 'work'
        }
      ]
    });

    const result = await rag.retrieve('content', {
      enforcementContext: {
        runtimeMode: 'local_only',
        userId: 'user-123',
        captureId: 'capture-456'
      }
    });

    expect(result.policyDetails).toBeDefined();
    expect(result.policyDetails.decision).toBe('PARTIAL');
    expect(result.policyDetails.reason).toBeDefined();
    expect(result.policyDetails.blockedCount).toBe(1);
    expect(result.policyDetails.blockedClassifications).toBeDefined();
  });

  it('handles all runtime modes correctly', async () => {
    const modes = [
      'metadata_only',
      'local_only',
      'local_llm',
      'external_api_public_only',
      'approved_enterprise'
    ];

    await rag.ingest({
      documents: [
        {
          title: 'Public',
          content: 'content',
          classification: 'public'
        },
        {
          title: 'Work',
          content: 'content',
          classification: 'work'
        }
      ]
    });

    for (const mode of modes) {
      const result = await rag.retrieve('content', {
        enforcementContext: {
          runtimeMode: mode,
          userId: 'user-123',
          captureId: 'capture-456'
        }
      });

      expect(result.ok).toBe(true);
      expect(result.policyEnforced).toBe(true);
      expect(result.policyDecision).toBeDefined();

      if (mode === 'metadata_only') {
        expect(result.results).toHaveLength(0);
      } else if (mode === 'approved_enterprise') {
        expect(result.results.length).toBe(2);
      } else {
        expect(result.results.length).toBe(1);
      }
    }
  });

  it('short-circuits metadata_only without calling retriever', async () => {
    // Create a spy on the retriever to verify it's not called
    const originalRetrieve = rag.retriever.retrieve;
    let retrieverCalled = false;
    rag.retriever.retrieve = async () => {
      retrieverCalled = true;
      return originalRetrieve.call(rag.retriever, 'test', {});
    };

    await rag.ingest({
      documents: [
        {
          title: 'Test Doc',
          content: 'Test content',
          classification: 'public'
        }
      ]
    });

    const result = await rag.retrieve('sensitive query', {
      enforcementContext: {
        runtimeMode: 'metadata_only',
        userId: 'user-123',
        captureId: 'capture-456'
      }
    });

    // Verify retriever was NOT called (short-circuited)
    expect(retrieverCalled).toBe(false);
    // Verify empty result returned
    expect(result.results).toHaveLength(0);
    expect(result.policyDecision).toBe('BLOCK');

    // Restore original
    rag.retriever.retrieve = originalRetrieve;
  });
});
