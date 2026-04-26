export class TextChunker {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 500;
    this.overlapSize = options.overlapSize || 50;
    this.separator = options.separator || '\n\n';
  }

  chunk(text) {
    if (!text || text.length === 0) return [];

    const chunks = [];
    let currentChunk = '';
    let startIndex = 0;

    // Split by primary separator
    const paragraphs = text.split(this.separator);

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;

      // If adding this paragraph would exceed chunk size, save current chunk
      if ((currentChunk + paragraph).length > this.chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          startIndex,
          endIndex: startIndex + currentChunk.length
        });

        // Apply overlap
        currentChunk = currentChunk.slice(-this.overlapSize) + paragraph;
        startIndex += currentChunk.length - paragraph.length - this.overlapSize;
      } else {
        currentChunk += (currentChunk ? this.separator : '') + paragraph;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length
      });
    }

    return chunks;
  }
}
