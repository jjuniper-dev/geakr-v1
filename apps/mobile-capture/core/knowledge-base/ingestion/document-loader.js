import { TextChunker } from './chunker.js';
import crypto from 'crypto';

export class DocumentLoader {
  constructor(options = {}) {
    this.chunker = new TextChunker(options.chunker);
  }

  async loadDocument({ title, content, format = 'markdown', classification = 'unknown', team = 'default', source = {}, metadata = {} }) {
    if (!title || !content) {
      throw new Error('title and content are required');
    }

    // Parse content based on format
    let text = '';
    if (format === 'markdown') {
      text = content;
    } else if (format === 'json') {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        text = this._jsonToText(parsed);
      } catch (error) {
        throw new Error(`Failed to parse JSON: ${error.message}`);
      }
    } else if (format === 'pdf') {
      // For MVP, just handle base64-encoded text representation
      text = Buffer.from(content, 'base64').toString('utf-8');
    } else {
      text = content;
    }

    // Validate classification
    const validClassifications = ['public', 'unknown', 'work', 'personal'];
    if (!validClassifications.includes(classification)) {
      throw new Error(`Invalid classification: ${classification}`);
    }

    // Generate document ID from title and content hash
    const hash = crypto.createHash('sha256').update(title + content).digest('hex').slice(0, 12);
    const documentId = `doc-${hash}`;

    // Chunk the text
    const chunks = this.chunker.chunk(text);

    // Build document metadata
    const document = {
      id: documentId,
      title,
      classification,
      team,
      format,
      timestamp: new Date().toISOString(),
      source: {
        type: source.type || 'internal',
        url: source.url || null,
        version: source.version || null
      },
      metadata: metadata || {},
      chunks: chunks.map(chunk => ({
        text: chunk.text,
        index: chunks.indexOf(chunk),
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex
      }))
    };

    return {
      documentId,
      document,
      chunkCount: chunks.length
    };
  }

  _jsonToText(obj, prefix = '') {
    let text = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        text += this._jsonToText(item, prefix) + '\n';
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const keyText = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
          text += `${keyText}: ${value}\n`;
        } else {
          text += this._jsonToText(value, keyText);
        }
      }
    } else if (obj !== null && obj !== undefined) {
      text += String(obj) + '\n';
    }

    return text;
  }
}
