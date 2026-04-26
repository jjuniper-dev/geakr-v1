import OpenAI from 'openai';
import { Embedder } from './base-embedder.js';

export class OpenAIEmbedder extends Embedder {
  constructor(options = {}) {
    super();
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY required for OpenAI embedder');
    }
    this.client = new OpenAI({ apiKey });
    this.model = options.model || 'text-embedding-3-small';
    this.dimensions = options.dimensions || 1536;
  }

  async embed(text) {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text
    });
    return new Float32Array(response.data[0].embedding);
  }

  async embedBatch(texts) {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts
    });
    return response.data
      .sort((a, b) => a.index - b.index)
      .map(item => new Float32Array(item.embedding));
  }

  async getDimensions() {
    return this.dimensions;
  }

  isAvailable() {
    return !!process.env.OPENAI_API_KEY;
  }
}
