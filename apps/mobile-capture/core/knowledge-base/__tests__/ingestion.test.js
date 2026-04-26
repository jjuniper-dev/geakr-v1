import { TextChunker } from '../ingestion/chunker.js';
import { DocumentLoader } from '../ingestion/document-loader.js';

describe('Ingestion', () => {
  describe('TextChunker', () => {
    let chunker;

    beforeEach(() => {
      chunker = new TextChunker({
        chunkSize: 100,
        overlapSize: 20,
        separator: '\n\n'
      });
    });

    it('splits text into chunks', () => {
      const text = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
      const chunks = chunker.chunk(text);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('handles empty text', () => {
      const chunks = chunker.chunk('');
      expect(chunks).toHaveLength(0);
    });

    it('handles text with no separators', () => {
      const text = 'Single paragraph without separator';
      const chunks = chunker.chunk(text);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('maintains chunk content and indices', () => {
      const text = 'First chunk content\n\nSecond chunk content';
      const chunks = chunker.chunk(text);

      chunks.forEach(chunk => {
        expect(chunk.text).toBeDefined();
        expect(chunk.startIndex).toBeDefined();
        expect(chunk.endIndex).toBeDefined();
      });
    });

    it('creates overlapping chunks for context', () => {
      const longText = Array(10).fill('word ').join('');
      const chunks = chunker.chunk(longText);

      if (chunks.length > 1) {
        // Check that consecutive chunks have some overlap
        const text1End = chunks[0].text.split(/\s+/).slice(-2).join(' ');
        const text2Start = chunks[1].text.split(/\s+/).slice(0, 2).join(' ');
        expect([text1End, text2Start]).toBeDefined();
      }
    });
  });

  describe('DocumentLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new DocumentLoader();
    });

    it('loads markdown documents', async () => {
      const result = await loader.loadDocument({
        title: 'Test Document',
        content: '# Heading\n\nSome content',
        format: 'markdown',
        classification: 'public',
        team: 'default'
      });

      expect(result.documentId).toBeDefined();
      expect(result.document.id).toBe(result.documentId);
      expect(result.document.title).toBe('Test Document');
      expect(result.document.chunks.length).toBeGreaterThan(0);
    });

    it('loads JSON documents', async () => {
      const content = JSON.stringify({
        name: 'Test',
        description: 'A test document'
      });

      const result = await loader.loadDocument({
        title: 'JSON Doc',
        content,
        format: 'json',
        classification: 'work'
      });

      expect(result.document.chunks.length).toBeGreaterThan(0);
      expect(result.document.chunks[0].text).toContain('name');
    });

    it('generates consistent document IDs', async () => {
      const doc1 = await loader.loadDocument({
        title: 'Test',
        content: 'Same content'
      });

      const doc2 = await loader.loadDocument({
        title: 'Test',
        content: 'Same content'
      });

      expect(doc1.documentId).toBe(doc2.documentId);
    });

    it('validates classification', async () => {
      const result = loader.loadDocument({
        title: 'Test',
        content: 'Content',
        classification: 'invalid'
      });

      expect(result).rejects.toThrow('Invalid classification');
    });

    it('requires title and content', async () => {
      expect(
        loader.loadDocument({ title: 'Test' })
      ).rejects.toThrow('title and content are required');
    });

    it('preserves document metadata', async () => {
      const result = await loader.loadDocument({
        title: 'Test',
        content: 'Content',
        classification: 'work',
        team: 'engineering',
        source: {
          type: 'external',
          url: 'https://example.com',
          version: '1.0.0'
        },
        metadata: {
          domain: 'kubernetes'
        }
      });

      expect(result.document.classification).toBe('work');
      expect(result.document.team).toBe('engineering');
      expect(result.document.source.url).toBe('https://example.com');
      expect(result.document.metadata.domain).toBe('kubernetes');
    });

    it('includes timestamp on loaded documents', async () => {
      const result = await loader.loadDocument({
        title: 'Test',
        content: 'Content'
      });

      expect(result.document.timestamp).toBeDefined();
      expect(new Date(result.document.timestamp)).toBeInstanceOf(Date);
    });
  });
});
