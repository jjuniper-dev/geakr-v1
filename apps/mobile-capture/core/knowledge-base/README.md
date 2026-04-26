# RAG (Retrieval-Augmented Generation) Module

The RAG module enables teams to build and query their own knowledge bases. It provides:

- **Document Ingestion**: Upload and chunk documents (Markdown, JSON, PDF)
- **Semantic Search**: Find relevant documents using embedding similarity
- **Team-Based Access Control**: Enforce boundaries between team knowledge bases
- **Persistent Storage**: JSON-based file storage with in-memory caching
- **Metadata Filtering**: Filter results by classification, team, and custom metadata

## Quickstart

### Initialize RAG

```javascript
import { initializeRAG, getRAG } from './core/knowledge-base/index.js';

await initializeRAG({
  enabled: true,
  storage: {
    type: 'file',
    path: './data/knowledge-base'
  },
  embedding: {
    provider: 'openai',
    model: 'text-embedding-3-small'
  },
  retrieval: {
    topK: 5,
    similarityThreshold: 0.5
  }
});

const rag = getRAG();
```

### Ingest Documents

```javascript
const result = await rag.ingest({
  documents: [
    {
      title: 'Kubernetes Best Practices',
      content: '# Kubernetes\n\nBest practices for production deployments...',
      format: 'markdown',
      classification: 'work',
      team: 'platform',
      source: {
        type: 'internal',
        url: 'https://docs.example.com/kubernetes',
        version: '1.0'
      },
      metadata: {
        domain: 'kubernetes',
        author: 'alice@example.com'
      }
    }
  ],
  upsert: true // Update if document already exists
});

console.log(`Ingested: ${result.ingested} documents`);
```

### Retrieve Documents

```javascript
const results = await rag.retrieve(
  'How do I configure Kubernetes networking?',
  {
    topK: 5,
    threshold: 0.5,
    teamId: 'platform',
    filters: {
      metadata: { domain: 'kubernetes' }
    }
  }
);

results.results.forEach(doc => {
  console.log(`${doc.title} (similarity: ${doc.similarity})`);
  doc.chunks.forEach(chunk => {
    console.log(`  - ${chunk.text}`);
  });
});
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY` — Required for embeddings (set automatically by LLM adapter)
- `RAG_ENABLED` — Enable/disable RAG module (default: true)
- `RAG_EMBEDDING_PROVIDER` — Embedding provider (default: "openai")
- `RAG_STORAGE_TYPE` — Storage backend: "memory" or "file" (default: "file")
- `RAG_STORAGE_PATH` — Path for file storage (default: "./data/knowledge-base")

### Configuration Object

```javascript
initializeRAG({
  // Feature flag
  enabled: true,

  // Embedding configuration
  embedding: {
    provider: 'openai',              // 'openai' | 'huggingface' | 'local'
    model: 'text-embedding-3-small', // Model name
    dimensions: 1536,                // Embedding dimensions
    cacheSize: 1000                  // LRU cache size
  },

  // Storage configuration
  storage: {
    type: 'file',                          // 'memory' | 'file'
    path: './data/knowledge-base',         // Path for file storage
    maxDocuments: 5000                     // Limit (soft)
  },

  // Retrieval configuration
  retrieval: {
    similarityThreshold: 0.5,  // Minimum similarity (0-1)
    topK: 5,                   // Return top-K results
    maxTokensPerDocument: 2000 // Limit context size
  },

  // Team/access control configuration
  team: {
    defaultTeam: 'default',           // Default team for documents
    enforceTeamBoundaries: true       // Enforce team filtering
  }
});
```

## Document Format

### Markdown Documents

```javascript
{
  title: 'My Document',
  content: '# Heading\n\nContent...',
  format: 'markdown',
  classification: 'work|public|unknown|personal',
  team: 'team-name',
  source: {
    type: 'internal|external|generated',
    url: 'https://...',
    version: '1.0'
  },
  metadata: {
    domain: 'kubernetes',
    author: 'email@example.com'
    // Custom fields
  }
}
```

### JSON Documents

JSON objects are converted to text format:

```javascript
{
  title: 'Config Document',
  content: JSON.stringify({
    name: 'My Config',
    description: 'Configuration details',
    version: '1.0'
  }),
  format: 'json'
}
```

### PDF Documents (Base64)

```javascript
{
  title: 'PDF Document',
  content: Buffer.from(pdfBytes).toString('base64'),
  format: 'pdf'
}
```

## API Reference

### initializeRAG(config)

Initialize the RAG module with configuration.

- **config** (object): Configuration object
- **Returns**: Promise<RAG instance>

### getRAG()

Get the initialized RAG instance.

- **Returns**: RAG instance
- **Throws**: Error if not initialized

### rag.ingest(options)

Ingest documents into the knowledge base.

```javascript
{
  documents: [
    {
      title: string,
      content: string,
      format?: 'markdown' | 'json' | 'pdf' (default: 'markdown'),
      classification?: string (default: 'unknown'),
      team?: string (default: 'default'),
      source?: object,
      metadata?: object
    }
  ],
  upsert?: boolean (default: true)
}
```

**Returns**:
```javascript
{
  ok: boolean,
  ingested: number,
  documents: [
    {
      documentId: string,
      title: string,
      chunks?: number,
      status: 'ingested' | 'skipped' | 'failed',
      error?: string
    }
  ]
}
```

### rag.retrieve(query, options)

Retrieve relevant documents for a query.

```javascript
{
  topK?: number,
  threshold?: number,
  teamId?: string,
  classification?: string,
  filters?: {
    metadata?: object,
    timeRange?: { after: string, before: string }
  }
}
```

**Returns**:
```javascript
{
  ok: boolean,
  query: string,
  results: [
    {
      documentId: string,
      title: string,
      similarity: number (0-1),
      classification: string,
      team: string,
      chunks: [
        {
          text: string,
          index: number
        }
      ],
      metadata: object
    }
  ],
  resultCount: number,
  executionTimeMs: number
}
```

### rag.getStats()

Get statistics about the knowledge base.

**Returns**:
```javascript
{
  totalDocuments: number,
  totalChunks: number,
  lastUpdated: string (ISO timestamp)
}
```

### rag.flush()

Force persistence of in-memory data to disk.

**Returns**: Promise<void>

## Usage in Plugins

### Example: Identify-Issues Plugin using RAG

```javascript
export class IdentifyIssuesPlugin extends Plugin {
  async execute({ context, input }) {
    const rag = getRAG();

    // 1. Retrieve relevant knowledge
    const knowledgeContext = await rag.retrieve(
      input.domain || input.description,
      {
        teamId: context.team,
        topK: 3
      }
    );

    if (!knowledgeContext.ok) {
      throw new Error('Failed to retrieve knowledge');
    }

    // 2. Build augmented prompt
    const contextText = knowledgeContext.results
      .map(r => `# ${r.title}\n\n${r.chunks.map(c => c.text).join('\n')}`)
      .join('\n\n---\n\n');

    const augmentedPrompt = `
Given the following knowledge base context:

${contextText}

Identify potential issues in:
${input.description}
    `;

    // 3. Call LLM with augmented context
    const provider = getProvider();
    const result = await provider.structuredExtract({
      schema: issuesSchema,
      messages: [
        {
          role: 'user',
          content: augmentedPrompt
        }
      ]
    });

    return result;
  }
}
```

## Architecture

```
RAG Module
├── Storage Layer
│   ├── InMemoryStore (runtime)
│   └── FileStore (persistent)
├── Embedding Layer
│   ├── OpenAIEmbedder
│   └── Base class for custom providers
├── Retrieval Layer
│   ├── Scoring (cosine similarity + metadata)
│   ├── Filtering (team, classification, metadata)
│   └── Top-K selection
├── Ingestion Layer
│   ├── DocumentLoader (format parsing)
│   ├── TextChunker (segmentation)
│   └── Metadata extraction
└── Main API
    ├── initialize + getRAG
    ├── ingest()
    ├── retrieve()
    └── getStats()
```

## Performance Characteristics

- **Embedding**: ~0.5-2s per document (API call dependent)
- **Retrieval**: <200ms for typical KB (1000 documents)
- **Storage**: ~2-5KB per document (metadata + chunks)
- **Memory**: ~10-20MB for 1000-document KB in-memory

## Limitations (MVP)

- No support for semantic similarity beyond embeddings
- Team boundaries are soft-enforced (checked at retrieval, not storage)
- No document versioning (overwrites on upsert)
- No full-text search index
- No spell correction or fuzzy matching

## Future Enhancements

- HuggingFace embeddings for local-only deployments
- SQLite backend for larger KBs
- Full-text search integration
- Document versioning and change tracking
- Multi-language support
- Automatic document categorization
