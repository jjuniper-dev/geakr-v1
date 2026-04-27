/**
 * Base Provider Class
 *
 * Defines the interface that all LLM providers must implement.
 * Subclasses: OpenAI, Claude, Local, etc.
 */

export class BaseProvider {
  constructor(config = {}) {
    this.name = config.name || 'unknown';
    this.model = config.model || null;
    this.config = config;
  }

  async structuredExtract({ schema, messages, temperature = 0.1 }) {
    throw new Error(`${this.constructor.name}.structuredExtract() not implemented`);
  }

  async generate({ prompt, temperature = 0.7, maxTokens = 2048 }) {
    throw new Error(`${this.constructor.name}.generate() not implemented`);
  }

  async embed({ text }) {
    throw new Error(`${this.constructor.name}.embed() not implemented`);
  }

  async chat({ messages, temperature = 0.7, maxTokens = 2048 }) {
    throw new Error(`${this.constructor.name}.chat() not implemented`);
  }

  getInfo() {
    return {
      name: this.name,
      model: this.model,
      capabilities: this.getCapabilities()
    };
  }

  getCapabilities() {
    return {
      structuredExtract: true,
      generate: true,
      embed: true,
      chat: true
    };
  }
}
