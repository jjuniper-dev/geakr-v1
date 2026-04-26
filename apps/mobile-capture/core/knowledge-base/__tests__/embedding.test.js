import { OpenAIEmbedder } from '../embedding/openai-embedder.js';
import { Embedder } from '../embedding/base-embedder.js';

describe('Embedder', () => {
  describe('Base class', () => {
    it('throws on unimplemented methods', async () => {
      const embedder = new Embedder();
      expect(() => embedder.embed('test')).rejects.toThrow();
      expect(() => embedder.getDimensions()).rejects.toThrow();
    });
  });

  describe('OpenAI Embedder', () => {
    beforeEach(() => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY not set; skipping OpenAI embedder tests');
      }
    });

    it('throws without API key', () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      try {
        expect(() => new OpenAIEmbedder()).toThrow('OPENAI_API_KEY required');
      } finally {
        if (originalKey) process.env.OPENAI_API_KEY = originalKey;
      }
    });

    it('initializes with API key', () => {
      if (!process.env.OPENAI_API_KEY) return;
      const embedder = new OpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY });
      expect(embedder).toBeDefined();
      expect(embedder.model).toBe('text-embedding-3-small');
      expect(embedder.dimensions).toBe(1536);
    });

    it('accepts custom model and dimensions', () => {
      if (!process.env.OPENAI_API_KEY) return;
      const embedder = new OpenAIEmbedder({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'text-embedding-3-large',
        dimensions: 3072
      });
      expect(embedder.model).toBe('text-embedding-3-large');
      expect(embedder.dimensions).toBe(3072);
    });
  });
});
