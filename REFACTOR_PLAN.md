# Modular Architecture Refactor Plan

## Executive Summary

Refactor the monolithic `server.js` (161 lines) into a clean, pluggable architecture designed for HC government use. The strategy: extract existing partial implementations into proper modules, expand with missing capabilities (RAG/KB, expanded auditing), and build a plugin system on top.

**Key Principle:** Minimize new surface area while maximizing modularity and government compliance.

---

## Current State → Target State

### Current (Monolithic)
```
server.js (161 lines)
├── Data handling (fetch, sanitize, extract, render)
├── Audit (gate decisions only)
├── Config (inline functions)
├── LLM integration (hardcoded OpenAI)
└── API routes (mixed concerns)
```

### Target (Modular + Pluggable)
```
core/
├── llm-adapter/           ← BUILD (missing)
├── data-context/          ← REFACTOR + EXPAND
├── audit-compliance/      ← REFACTOR + EXPAND
├── config/                ← REFACTOR + EXTRACT
└── baseline/              ← EXTRACT from /extract endpoint

plugins/
├── assess/
├── identify-issues/
├── generate-content/
└── graph-viz/

policy/
└── gate.js                ← KEEP as-is (already modular)

server.js                  ← LEAN (plugin orchestration only)
```

---

## Module Specifications

### 1. LLM Adapter (`core/llm-adapter/`)
**Status:** BUILD NEW

#### Purpose
Abstract provider interface. Swap between Claude, OpenAI, local models without changing plugins or core.

#### Files
```
core/llm-adapter/
├── index.js               ← Main adapter registry
├── providers/
│   ├── openai.js          ← OpenAI client (refactored from server.js:7-19)
│   ├── claude.js          ← Claude Anthropic SDK
│   ├── local.js           ← Ollama/local model stubs
│   └── base.js            ← Abstract provider interface
├── config.js              ← Provider configuration + env parsing
└── __tests__/
    ├── adapter.test.js
    └── providers.test.js
```

#### Interface
```javascript
// Usage pattern (all plugins use this)
const llm = getProvider('claude');  // from config/env
const result = await llm.structuredExtract({
  input: sanitizedText,
  schema: knowledgeSchema,
  options: { temperature: 0.1, model: 'claude-opus' }
});

// Provider interface
class Provider {
  async structuredExtract(config) { }
  async generate(prompt, options) { }
  async embed(text) { }  // for RAG
}
```

#### Migration Path
1. Extract OpenAI usage from `server.js:85-88` → `openai.js`
2. Add Claude provider (Anthropic SDK)
3. Create registry that selects provider from config
4. All plugins call through adapter, never directly to LLM

---

### 2. Data/Context Module (`core/data-context/`)
**Status:** REFACTOR + EXPAND

#### Current Code (to Extract)
- `fetchReadable()` (server.js:55-62)
- `sanitizeText()` (server.js:64-81)
- `renderKnowledgeMarkdown()` (server.js:91)
- `buildGraphFragment()` (server.js:93)
- `writeToGitHub()` (server.js:95)

#### New Capabilities
- **RAG/Knowledge Base:** Embed documents, semantic search
- **Document Ingestion:** Handle multiple formats (markdown, PDF, text)
- **Versioning:** Track document versions, lineage

#### Files
```
core/data-context/
├── index.js               ← Main exports
├── fetcher.js             ← fetchReadable() refactored
├── sanitizer.js           ← sanitizeText() refactored (PII redaction)
├── knowledge/
│   ├── extractor.js       ← renderKnowledgeMarkdown() + schema
│   ├── schema.js          ← Knowledge object schema (currently inline)
│   └── loader.js          ← Document ingestion (NEW)
├── rag/                   ← Knowledge base + retrieval (NEW)
│   ├── embedder.js        ← Embedding interface (plugs into llm-adapter)
│   ├── store.js           ← Vector DB abstraction (Pinecone, local, etc)
│   └── retriever.js       ← Semantic search
├── graph/
│   ├── fragmenter.js      ← buildGraphFragment() refactored
│   └── renderer.js        ← Export to various formats
├── storage/
│   ├── github.js          ← writeToGitHub() refactored
│   └── local.js           ← Local file storage
└── __tests__/
    ├── fetcher.test.js
    ├── sanitizer.test.js
    ├── rag.test.js
    └── storage.test.js
```

#### Interface
```javascript
// Core data pipeline
const { fetcher, sanitizer, extractor } = require('core/data-context');

const readable = await fetcher.fromUrl(url);
const sanitized = await sanitizer.redact(readable.text);
const structured = await extractor.extract(sanitized);

// RAG (knowledge base queries)
const { rag } = require('core/data-context');
const retrieved = await rag.search('system architecture concepts', topK: 5);

// Document ingestion
const { loader } = require('core/data-context');
await loader.ingestPdf(filePath);  // or .ingestMarkdown(), etc
```

#### Notes
- Sanitizer patterns stay the same (6 PII categories)
- Schemas extracted to separate file for clarity
- RAG abstraction allows swapping vector DBs later

---

### 3. Audit/Compliance Module (`core/audit-compliance/`)
**Status:** REFACTOR + EXPAND

#### Current Code (to Extract)
- `appendGateAudit()` (server.js:48-53)
- `buildAuditEntry()` (policy/gate.js:109-148)

#### Expanded Scope
Current: Only gate decisions  
New: **All operations** (LLM calls, data access, plugin execution, user actions)

#### Files
```
core/audit-compliance/
├── index.js               ← Main audit logger
├── entries/
│   ├── base.js            ← Base audit entry schema
│   ├── gate-decision.js   ← Gate decisions (current)
│   ├── llm-call.js        ← LLM invocations (NEW)
│   ├── data-access.js     ← Data reads/writes (NEW)
│   └── plugin-exec.js     ← Plugin executions (NEW)
├── storage/
│   ├── jsonl-file.js      ← Current file-based JSONL
│   └── database.js        ← Pluggable DB backend (NEW: for HC)
├── compliance/
│   ├── reporters.js       ← Generate compliance reports (NEW)
│   └── retention.js       ← Data retention policies (NEW)
└── __tests__/
    ├── audit.test.js
    └── compliance.test.js
```

#### Interface
```javascript
const { audit } = require('core/audit-compliance');

// Gate decision (existing)
await audit.recordGateDecision(gateDecision);

// LLM call (NEW)
await audit.recordLLMCall({
  provider: 'claude',
  model: 'claude-opus',
  operation: 'structuredExtract',
  inputTokens: 1234,
  outputTokens: 567,
  costEstimate: 0.02,
  userId: req.user.id,
  timestamp: new Date()
});

// Data access (NEW)
await audit.recordDataAccess({
  operation: 'read',  // or 'write', 'delete'
  source: 'knowledge/document-123.md',
  userId: req.user.id,
  reason: 'assess_plugin_execution'
});

// Compliance report (NEW)
const report = await audit.generateComplianceReport({
  startDate: '2026-01-01',
  endDate: '2026-04-26',
  includeFields: ['llm_calls', 'data_access', 'policy_gates']
});
```

#### Government Compliance
- **Audit Trail:** Who did what, when, with which LLM/data
- **Retention:** Configurable per HC policy
- **Attribution:** Every operation tied to user/service account
- **Immutability:** JSONL append-only (or audit DB)

---

### 4. Config Orchestration (`core/config/`)
**Status:** REFACTOR + EXTRACT

#### Current Code (to Extract)
- `getRuntimeConfig()` (server.js:33-39)
- `getSourceConfig()` (server.js:41-46)
- Env variable parsing

#### New Responsibilities
- Plugin registration + lifecycle
- LLM provider routing (which provider for which operation)
- Parameter overrides per team/context
- Runtime mode management

#### Files
```
core/config/
├── index.js               ← Main config loader
├── runtime.js             ← Runtime modes (from gate.js, refactored)
├── source.js              ← Source classification (from gate.js, refactored)
├── providers.js           ← LLM provider selection
├── plugins.js             ← Plugin registration + wiring
├── overrides.js           ← Team/context-specific parameter overrides
├── schema.js              ← Config schema (for validation)
└── loaders/
    ├── env.js             ← From env variables
    ├── file.js            ← From YAML/JSON config files (NEW)
    └── runtime.js         ← From request headers/body
```

#### Interface
```javascript
const { config } = require('core/config');

// Initialize from env + files
await config.init({
  envFile: '.env.local',
  configDir: './config'
});

// Get runtime config
const runtime = config.getRuntime(req);  
// { mode: 'approved_enterprise', hosting: 'azure_approved', endpoint: '...' }

// Get LLM provider for operation
const llmProvider = config.getLLMProvider('structuredExtract', runtime.mode);
// Returns: 'claude' or 'openai' based on rules

// Plugin chain for a use case
const plugins = config.getPluginChain('extract_and_assess', userId);
// Returns: [extract_plugin, assess_plugin] with their configs

// Team-specific overrides
const teamConfig = config.getTeamOverrides('health-outcomes-team');
// { llmModel: 'claude-opus', temperature: 0.05, dataRetention: '7y' }
```

#### Configuration File Example
```yaml
# config/llm.yaml
providers:
  claude:
    apiKey: env:ANTHROPIC_API_KEY
    models:
      structuredExtract: claude-opus
      generation: claude-sonnet
  openai:
    apiKey: env:OPENAI_API_KEY
    models:
      structuredExtract: gpt-4-turbo

# Routing: which operations use which provider
routing:
  structuredExtract:
    approved_enterprise: claude
    external_api_public_only: openai
    local_only: local

# Team overrides
teams:
  health-outcomes:
    llmProvider: claude
    temperature: 0.1
    dataRetention: 7y
```

---

### 5. Core Baseline (`core/baseline/`)
**Status:** EXTRACT + REFACTOR

#### Purpose
Minimal value generator. Current `/extract` endpoint, cleaned up and separated from plugins.

#### Responsibility
1. Ingest URL/document
2. Fetch readable content
3. Sanitize (redact PII)
4. Check policy gate
5. Return structured knowledge

**Does NOT:** assess, identify issues, generate content (those are plugins)

#### Files
```
core/baseline/
├── index.js               ← Main baseline handler
├── pipeline.js            ← Core extraction pipeline
├── handlers/
│   ├── url.js             ← URL-based ingestion
│   └── document.js        ← Document-based ingestion (NEW)
└── __tests__/
    └── pipeline.test.js
```

#### Interface
```javascript
const { baseline } = require('core/baseline');

// Minimal extraction (current /extract without plugins)
const result = await baseline.extract({
  url,
  sourceClassification: 'public',
  contextLayer: 'work',
  userOverride: null
});

// Returns:
// {
//   status: 'extracted' | 'blocked' | 'local_only',
//   structured: { title, concepts, summary, ... },
//   markdown: '# ...',
//   graphFragment: { nodes, edges },
//   gate: { decision, reason, allowedOperations },
//   sanitizer: { findings }
// }
```

---

### 6. Plugin Architecture (`plugins/`)
**Status:** BUILD NEW

#### Pattern
Each plugin:
- Has its own config (which LLM provider, model, parameters)
- Receives structured knowledge from baseline
- Outputs domain-specific result
- Logs operations to audit module
- Can chain to other plugins

#### Files
```
plugins/
├── plugin-interface.js    ← Base class for all plugins
├── assess/
│   ├── index.js
│   ├── config.js
│   └── __tests__/
├── identify-issues/
│   ├── index.js
│   ├── config.js
│   └── __tests__/
├── generate-content/
│   ├── index.js
│   ├── config.js
│   └── __tests__/
└── graph-viz/
    ├── index.js
    ├── config.js
    └── __tests__/
```

#### Plugin Interface
```javascript
class Plugin {
  constructor(config) {
    this.config = config;
    this.llm = getProvider(config.llmProvider);
  }

  async execute(input) {
    // input: { structured, markdown, url }
    // Returns domain-specific output
  }
}

// Usage
const assessPlugin = new AssessPlugin(config);
const assessment = await assessPlugin.execute(baselineResult);
await audit.recordPluginExecution({ plugin: 'assess', input, output, duration });
```

---

## Implementation Order

### Phase 1: Foundation (Weeks 1-2)
1. **LLM Adapter** - Create abstraction, migrate OpenAI code, add Claude provider
2. **Config Orchestration** - Extract config logic, add provider routing

### Phase 2: Data & Audit (Weeks 2-3)
3. **Audit/Compliance** - Expand from gate decisions to all operations
4. **Data/Context** - Extract and refactor data handling

### Phase 3: Core & Plugins (Weeks 3-4)
5. **Core Baseline** - Extract /extract endpoint into clean module
6. **Plugin System** - Build plugin interface, migrate logic into assess/identify/generate plugins

### Phase 4: Expansion (Weeks 4+)
7. **RAG/Knowledge Base** - Add semantic search to data-context module
8. **Document Ingestion** - Add multi-format support

---

## File Structure (After Refactor)

```
apps/mobile-capture/
├── core/
│   ├── llm-adapter/
│   │   ├── index.js
│   │   ├── providers/
│   │   │   ├── base.js
│   │   │   ├── claude.js
│   │   │   ├── openai.js
│   │   │   └── local.js
│   │   └── config.js
│   ├── data-context/
│   │   ├── index.js
│   │   ├── fetcher.js
│   │   ├── sanitizer.js
│   │   ├── knowledge/
│   │   ├── rag/
│   │   ├── graph/
│   │   └── storage/
│   ├── audit-compliance/
│   │   ├── index.js
│   │   ├── entries/
│   │   ├── storage/
│   │   └── compliance/
│   ├── config/
│   │   ├── index.js
│   │   ├── runtime.js
│   │   ├── source.js
│   │   ├── providers.js
│   │   ├── plugins.js
│   │   └── loaders/
│   └── baseline/
│       ├── index.js
│       └── pipeline.js
├── plugins/
│   ├── plugin-interface.js
│   ├── assess/
│   ├── identify-issues/
│   ├── generate-content/
│   └── graph-viz/
├── policy/
│   └── gate.js  (unchanged)
├── public/
├── server.js    (refactored: orchestration only)
└── package.json
```

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **LLM Flexibility** | Hardcoded OpenAI | Swap providers (Claude, OpenAI, local) |
| **Auditability** | Gate decisions only | All operations (LLM, data, plugins) |
| **Extensibility** | New features = modify server.js | Add plugins without touching core |
| **Testability** | Integration tests only | Unit tests per module |
| **Team/Context Config** | Env variables | Config files + team overrides |
| **Government Compliance** | Basic audit trail | Full trail + reports + retention policies |
| **RAG/KB** | Not possible | Plug in semantic search + embeddings |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Over-engineering early | Expand RAG/KB in Phase 4, not Phase 1 |
| Breaking existing /extract | Build new modules in parallel, test extensively before cutover |
| Config complexity | Start simple (env vars), add file-based config in Phase 3 |
| LLM adapter bloat | Keep interfaces minimal, one method per operation type |

---

## Success Criteria

- [ ] All existing `/extract` behavior works without change
- [ ] New `/extract-and-assess` endpoint chains core + assess plugin
- [ ] Audit logs capture LLM calls, data access, policy decisions
- [ ] Config system routes different LLM providers per operation
- [ ] Adding a new plugin requires <100 lines of code
- [ ] Tests pass (unit + integration)

---

## Notes for HC Government Compliance

- **Audit Trail:** Every LLM call, data access, and decision is logged with userId, timestamp, model used, cost estimate
- **Data Retention:** Configurable per HC data classification
- **User Attribution:** All operations tied to authenticated user or service account
- **Policy Gate:** Retained as-is (critical compliance control)
- **Immutable Logs:** JSONL append-only (or audit database for compliance)

