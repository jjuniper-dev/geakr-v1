export class Embedder {
  async embed(text) {
    throw new Error('embed() must be implemented by subclass');
  }

  async embedBatch(texts) {
    const results = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  async getDimensions() {
    throw new Error('getDimensions() must be implemented by subclass');
  }

  isAvailable() {
    return true;
  }
}
