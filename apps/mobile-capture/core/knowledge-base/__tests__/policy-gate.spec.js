import {
  MODE_ALLOWED_CLASSIFICATIONS,
  evaluateClassificationAccess,
  filterDocumentsByPolicy,
  buildRAGPolicyAuditEntry,
  enforceRAGPolicy
} from '../policy-gate.js';

describe('RAG Policy Gate', () => {
  describe('MODE_ALLOWED_CLASSIFICATIONS', () => {
    it('has all required modes', () => {
      expect(MODE_ALLOWED_CLASSIFICATIONS).toHaveProperty('metadata_only');
      expect(MODE_ALLOWED_CLASSIFICATIONS).toHaveProperty('local_only');
      expect(MODE_ALLOWED_CLASSIFICATIONS).toHaveProperty('local_llm');
      expect(MODE_ALLOWED_CLASSIFICATIONS).toHaveProperty('external_api_public_only');
      expect(MODE_ALLOWED_CLASSIFICATIONS).toHaveProperty('approved_enterprise');
    });

    it('metadata_only blocks all access', () => {
      expect(MODE_ALLOWED_CLASSIFICATIONS.metadata_only.allowed).toHaveLength(0);
    });

    it('local_only allows public and unknown', () => {
      expect(MODE_ALLOWED_CLASSIFICATIONS.local_only.allowed).toEqual(
        expect.arrayContaining(['public', 'unknown'])
      );
    });

    it('approved_enterprise allows all non-personal classifications', () => {
      const allowed = MODE_ALLOWED_CLASSIFICATIONS.approved_enterprise.allowed;
      expect(allowed).toContain('public');
      expect(allowed).toContain('unknown');
      expect(allowed).toContain('work');
      expect(allowed).not.toContain('personal');
    });
  });

  describe('evaluateClassificationAccess', () => {
    it('grants access for allowed classifications', () => {
      const result = evaluateClassificationAccess('approved_enterprise', 'work');
      expect(result).toBe(true);
    });

    it('denies access for blocked classifications', () => {
      const result = evaluateClassificationAccess('external_api_public_only', 'work');
      expect(result).toBe(false);
    });

    it('denies all access in metadata_only mode', () => {
      expect(evaluateClassificationAccess('metadata_only', 'public')).toBe(false);
      expect(evaluateClassificationAccess('metadata_only', 'unknown')).toBe(false);
      expect(evaluateClassificationAccess('metadata_only', 'work')).toBe(false);
    });

    it('treats unknown classification as public for access control', () => {
      const publicResult = evaluateClassificationAccess('local_only', 'public');
      const unknownResult = evaluateClassificationAccess('local_only', 'unknown');
      expect(publicResult).toBe(unknownResult);
    });

    it('throws on invalid mode', () => {
      expect(() => {
        evaluateClassificationAccess('invalid_mode', 'public');
      }).toThrow('Unknown runtime mode');
    });
  });

  describe('filterDocumentsByPolicy', () => {
    const testDocs = [
      { id: 'doc-1', title: 'Public', classification: 'public' },
      { id: 'doc-2', title: 'Work', classification: 'work' },
      { id: 'doc-3', title: 'Unknown', classification: 'unknown' },
      { id: 'doc-4', title: 'Personal', classification: 'personal' }
    ];

    it('filters documents by mode', () => {
      const result = filterDocumentsByPolicy(testDocs, 'approved_enterprise');
      expect(result.filtered).toHaveLength(3); // public, work, unknown
      expect(result.filtered.map(d => d.id)).toContain('doc-1');
      expect(result.filtered.map(d => d.id)).toContain('doc-2');
      expect(result.filtered.map(d => d.id)).toContain('doc-3');
    });

    it('blocks personal documents in all modes', () => {
      const modes = ['local_only', 'external_api_public_only', 'approved_enterprise'];
      for (const mode of modes) {
        const result = filterDocumentsByPolicy(testDocs, mode);
        const hasPersonal = result.filtered.some(d => d.classification === 'personal');
        expect(hasPersonal).toBe(false);
      }
    });

    it('returns empty for metadata_only mode', () => {
      const result = filterDocumentsByPolicy(testDocs, 'metadata_only');
      expect(result.filtered).toHaveLength(0);
      expect(result.blockedCount).toBe(4);
    });

    it('counts blocked classifications', () => {
      const result = filterDocumentsByPolicy(testDocs, 'local_only');
      expect(result.blockedClassifications.work).toBe(1);
      expect(result.blockedClassifications.personal).toBe(1);
    });

    it('handles empty document set', () => {
      const result = filterDocumentsByPolicy([], 'approved_enterprise');
      expect(result.filtered).toHaveLength(0);
      expect(result.blockedCount).toBe(0);
    });

    it('throws on invalid mode', () => {
      expect(() => {
        filterDocumentsByPolicy(testDocs, 'invalid_mode');
      }).toThrow('Unknown runtime mode');
    });
  });

  describe('buildRAGPolicyAuditEntry', () => {
    it('creates valid audit entry', () => {
      const entry = buildRAGPolicyAuditEntry({
        query: 'test query',
        runtimeMode: 'approved_enterprise',
        userId: 'user-123',
        captureId: 'capture-456',
        sourceClassification: 'work',
        requestCount: 5,
        allowedCount: 4,
        blockedCount: 1,
        blockedClassifications: { personal: 1 },
        policyDecision: 'PARTIAL',
        decisionReason: 'Some documents blocked'
      });

      expect(entry.type).toBe('rag_policy_gate');
      expect(entry.timestamp).toBeDefined();
      expect(entry.rag_operation_id).toBeDefined();
      expect(entry.runtime_mode).toBe('approved_enterprise');
      expect(entry.policy_decision).toBe('PARTIAL');
    });

    it('truncates long queries', () => {
      const longQuery = 'a'.repeat(500);
      const entry = buildRAGPolicyAuditEntry({
        query: longQuery,
        runtimeMode: 'approved_enterprise',
        userId: 'user-123',
        captureId: 'capture-456',
        sourceClassification: 'public',
        requestCount: 1,
        allowedCount: 1,
        blockedCount: 0,
        policyDecision: 'ALLOW',
        decisionReason: null
      });

      expect(entry.query.length).toBeLessThanOrEqual(200);
    });

    it('includes allowed classifications from mode', () => {
      const entry = buildRAGPolicyAuditEntry({
        query: 'test',
        runtimeMode: 'approved_enterprise',
        userId: 'user-123',
        captureId: 'capture-456',
        sourceClassification: 'public',
        requestCount: 1,
        allowedCount: 1,
        blockedCount: 0,
        policyDecision: 'ALLOW'
      });

      expect(entry.allowed_classifications).toEqual(['public', 'unknown', 'work']);
    });
  });

  describe('enforceRAGPolicy', () => {
    const testDocs = [
      { id: 'doc-1', title: 'Public', classification: 'public' },
      { id: 'doc-2', title: 'Work', classification: 'work' },
      { id: 'doc-3', title: 'Personal', classification: 'personal' }
    ];

    it('enforces policy and returns filtered results', async () => {
      const result = await enforceRAGPolicy(
        {
          runtimeMode: 'approved_enterprise',
          userId: 'user-123',
          captureId: 'capture-456',
          sourceClassification: 'work',
          query: 'test query'
        },
        testDocs,
        null
      );

      expect(result.policyEnforced).toBe(true);
      expect(result.filtered).toHaveLength(2); // public + work
      expect(result.blockedCount).toBe(1);
    });

    it('blocks all documents in metadata_only mode', async () => {
      const result = await enforceRAGPolicy(
        {
          runtimeMode: 'metadata_only',
          userId: 'user-123',
          captureId: 'capture-456',
          sourceClassification: 'public',
          query: 'test'
        },
        testDocs,
        null
      );

      expect(result.policyDecision).toBe('BLOCK');
      expect(result.filtered).toHaveLength(0);
    });

    it('returns PARTIAL when some documents are filtered', async () => {
      const result = await enforceRAGPolicy(
        {
          runtimeMode: 'local_only',
          userId: 'user-123',
          captureId: 'capture-456',
          sourceClassification: 'unknown',
          query: 'test'
        },
        testDocs,
        null
      );

      expect(result.policyDecision).toBe('PARTIAL');
      expect(result.filtered.length).toBeGreaterThan(0);
      expect(result.filtered.length).toBeLessThan(testDocs.length);
    });

    it('logs audit entry when logger provided', async () => {
      const auditLog = [];
      const mockLogger = {
        log: (entry) => Promise.resolve(auditLog.push(entry))
      };

      await enforceRAGPolicy(
        {
          runtimeMode: 'approved_enterprise',
          userId: 'user-123',
          captureId: 'capture-456',
          sourceClassification: 'work',
          query: 'test'
        },
        testDocs,
        mockLogger
      );

      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].type).toBe('rag_policy_gate');
    });

    it('gracefully handles logging errors', async () => {
      const mockLogger = {
        log: () => Promise.reject(new Error('Log failed'))
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await enforceRAGPolicy(
        {
          runtimeMode: 'approved_enterprise',
          userId: 'user-123',
          captureId: 'capture-456',
          sourceClassification: 'work',
          query: 'test'
        },
        testDocs,
        mockLogger
      );

      expect(result.filtered).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('throws on invalid mode', () => {
      expect(() => {
        enforceRAGPolicy(
          {
            runtimeMode: 'invalid_mode',
            userId: 'user-123',
            captureId: 'capture-456',
            sourceClassification: 'public',
            query: 'test'
          },
          testDocs,
          null
        );
      }).rejects.toThrow('Unknown runtime mode');
    });
  });
});
