export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

export function scoreDocument(queryEmbedding, document, metadata = {}) {
  const embedding = document.embedding;

  // 1. Semantic similarity (cosine distance)
  const semanticScore = cosineSimilarity(queryEmbedding, embedding);

  // 2. Metadata relevance boost
  let metadataBoost = 0;

  // Boost work classification
  if (document.classification === 'work') {
    metadataBoost += 0.05;
  }

  // Penalize very old documents (older than 1 year)
  if (document.timestamp) {
    const ageMs = Date.now() - new Date(document.timestamp).getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears > 1) {
      metadataBoost -= 0.02 * Math.min(ageYears, 5);
    }
  }

  // 3. Final score: semantic + metadata boost
  return Math.max(0, semanticScore + metadataBoost);
}
