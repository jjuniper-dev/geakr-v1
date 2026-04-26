# GEAkr Modular Architecture: Implementation Tasks

**Project:** Git EA Knowledge Registry (GEAkr) v1.0  
**Scope:** Refactor monolithic capture server into modular, pluggable architecture  
**Timeline:** 4 weeks, 44 tasks across 4 phases  
**Branch:** `claude/refactor-modular-structure-1wzOc`

---

## PHASE 1: FOUNDATION (Week 1) — 11 Tasks

### Task Group 1.1: LLM Adapter System

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **1.1.1** | Create base provider abstract class | `core/llm-adapter/providers/base.js` | None | ⏳ |
| **1.1.2** | Extract OpenAI provider from server.js | `core/llm-adapter/providers/openai.js` | 1.1.1 | ⏳ |
| **1.1.3** | Create Claude provider (Anthropic SDK) | `core/llm-adapter/providers/claude.js` | 1.1.1 | ⏳ |
| **1.1.4** | Create local provider stub | `core/llm-adapter/providers/local.js` | 1.1.1 | ⏳ |
| **1.1.5** | Create adapter registry & config | `core/llm-adapter/index.js`, `core/llm-adapter/config.js` | 1.1.2-1.1.4 | ⏳ |
| **1.1.6** | Create adapter test suite | `core/llm-adapter/__tests__/*.test.js` | 1.1.1-1.1.5 | ⏳ |

### Task Group 1.2: Config Orchestration System

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **1.2.1** | Extract runtime config | `core/config/runtime.js` | None | ⏳ |
| **1.2.2** | Extract source config | `core/config/source.js` | None | ⏳ |
| **1.2.3** | Create provider routing config | `core/config/providers.js` | 1.1.5 | ⏳ |
| **1.2.4** | Create main config orchestrator | `core/config/index.js` | 1.2.1-1.2.3 | ⏳ |
| **1.2.5** | Create config test suite | `core/config/__tests__/*.test.js` | 1.2.1-1.2.4 | ⏳ |

---

## PHASE 2: DATA & AUDIT (Week 2) — 15 Tasks

### Task Group 2.1: Data/Context Module

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **2.1.1** | Extract fetcher | `core/data-context/fetcher.js` | None | ⏳ |
| **2.1.2** | Extract sanitizer | `core/data-context/sanitizer.js` | None | ⏳ |
| **2.1.3** | Create knowledge schema & extractor | `core/data-context/knowledge/*.js` | None | ⏳ |
| **2.1.4** | Create markdown renderer | `core/data-context/knowledge/renderer.js` | 2.1.2, 2.1.3 | ⏳ |
| **2.1.5** | Create graph fragmenter | `core/data-context/graph/fragmenter.js` | None | ⏳ |
| **2.1.6** | Create data-context main module | `core/data-context/index.js` | 2.1.1-2.1.5 | ⏳ |
| **2.1.7** | Create data-context test suite | `core/data-context/__tests__/*.test.js` | 2.1.1-2.1.6 | ⏳ |

### Task Group 2.2: Audit/Compliance Module

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **2.2.1** | Create base audit entry schema | `core/audit-compliance/entries/base.js` | None | ⏳ |
| **2.2.2** | Extract gate decision audit | `core/audit-compliance/entries/gate-decision.js` | 2.2.1 | ⏳ |
| **2.2.3** | Create LLM call audit entry | `core/audit-compliance/entries/llm-call.js` | 2.2.1 | ⏳ |
| **2.2.4** | Create data-access audit entry | `core/audit-compliance/entries/data-access.js` | 2.2.1 | ⏳ |
| **2.2.5** | Create plugin-exec audit entry | `core/audit-compliance/entries/plugin-exec.js` | 2.2.1 | ⏳ |
| **2.2.6** | Create main audit logger | `core/audit-compliance/index.js`, `core/audit-compliance/storage/jsonl-file.js` | 2.2.1-2.2.5 | ⏳ |
| **2.2.7** | Create audit test suite | `core/audit-compliance/__tests__/*.test.js` | 2.2.1-2.2.6 | ⏳ |

---

## PHASE 3: CORE & PLUGINS (Weeks 3-4) — 16 Tasks

### Task Group 3.1: Core Baseline Module

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **3.1.1** | Create baseline pipeline | `core/baseline/pipeline.js` | 1.1.5, 1.2.4, 2.1, 2.2 | ⏳ |
| **3.1.2** | Create baseline URL handler | `core/baseline/handlers/url.js` | 3.1.1 | ⏳ |
| **3.1.3** | Create baseline main module | `core/baseline/index.js` | 3.1.1, 3.1.2 | ⏳ |
| **3.1.4** | Create baseline test suite | `core/baseline/__tests__/*.test.js` | 3.1.1-3.1.3 | ⏳ |

### Task Group 3.2: Plugin System

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **3.2.1** | Create plugin base class | `plugins/plugin-interface.js` | 1.1.5, 1.2.4, 2.2.6 | ⏳ |
| **3.2.2** | Create assess plugin | `plugins/assess/index.js`, `config.js` | 3.2.1 | ⏳ |
| **3.2.3** | Create identify-issues plugin | `plugins/identify-issues/index.js`, `config.js` | 3.2.1 | ⏳ |
| **3.2.4** | Create generate-content plugin | `plugins/generate-content/index.js`, `config.js` | 3.2.1 | ⏳ |
| **3.2.5** | Create graph-viz plugin | `plugins/graph-viz/index.js`, `config.js` | 3.2.1 | ⏳ |
| **3.2.6** | Create plugin test suite | `plugins/__tests__/*.test.js` | 3.2.1-3.2.5 | ⏳ |

### Task Group 3.3: Server Refactoring & Cutover

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **3.3.1** | Refactor /extract endpoint to use baseline | `server.js` | 3.1.3, 2.2.6 | ⏳ |
| **3.3.2** | Add /extract-and-assess endpoint | `server.js` | 3.1.3, 3.2.2 | ⏳ |
| **3.3.3** | Update server.js imports & cleanup | `server.js` | All Phase 3 | ⏳ |
| **3.3.4** | Verify existing tests pass | N/A | All Phase 3 | ⏳ |

---

## PHASE 4: EXPANSION (Weeks 4+) — 2 Task Groups

### Task Group 4.1: RAG/Knowledge Base

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **4.1.1** | Create embedding interface | `core/data-context/rag/embedder.js` | 1.1.5 | ⏳ |
| **4.1.2** | Create vector store abstraction | `core/data-context/rag/store.js` | 4.1.1 | ⏳ |
| **4.1.3** | Create retriever | `core/data-context/rag/retriever.js` | 4.1.1, 4.1.2 | ⏳ |

### Task Group 4.2: Document Ingestion & Config Files

| Task | Description | Files | Dependencies | Status |
|------|-------------|-------|--------------|--------|
| **4.2.1** | Create document loader | `core/data-context/loader.js` | 2.1 | ⏳ |
| **4.2.2** | Add config file support | `core/config/loaders/file.js` | 1.2.4 | ⏳ |

---

## Implementation Sequence by Dependencies

### Week 1 (Parallel)
- **1.1.1** → **1.1.2, 1.1.3, 1.1.4** (parallel) → **1.1.5** → **1.1.6**
- **1.2.1, 1.2.2** (parallel) → **1.2.3** → **1.2.4** → **1.2.5**

### Week 2 (Parallel)
- **2.1.1, 2.1.2** (parallel) → **2.1.3** → **2.1.4, 2.1.5** (parallel) → **2.1.6** → **2.1.7**
- **2.2.1** → **2.2.2, 2.2.3, 2.2.4, 2.2.5** (parallel) → **2.2.6** → **2.2.7**

### Week 3-4 (Sequential)
- **3.1.1** → **3.1.2** → **3.1.3** → **3.1.4**
- **3.2.1** → **3.2.2, 3.2.3, 3.2.4, 3.2.5** (parallel) → **3.2.6**
- **3.3.1** → **3.3.2** → **3.3.3** → **3.3.4**

### Phase 4+ (After Phase 3 cutover)
- **4.1.1** → **4.1.2** → **4.1.3**
- **4.2.1, 4.2.2** (parallel)

---

## Key Metrics

| Metric | Target |
|--------|--------|
| **Total new files** | 60+ modules |
| **Lines of code extracted from server.js** | 161 → 50 (server only) |
| **Test coverage** | >85% per module |
| **API backward compatibility** | 100% (existing /extract unchanged) |
| **Phase 3 cutover risk** | Low (new modules in parallel, cutover at end) |

---

## Success Criteria (End of Phase 3)

- ✅ All 39 Phase 1-3 tasks completed
- ✅ All new unit tests pass (>85% coverage)
- ✅ Existing policy gate tests pass without modification
- ✅ `/extract` endpoint returns identical response format
- ✅ `/extract-and-assess` endpoint works end-to-end
- ✅ Audit logs capture: gate decisions, LLM calls, data access, plugin executions
- ✅ Config routes providers correctly (env override tests pass)
- ✅ No breaking changes to existing API
- ✅ Server starts with all modules successfully
- ✅ Performance: /extract completes in <5s (same as before)

---

## Critical Architectural Constraints

1. **Backward Compatibility**: Gate decision audit entries must preserve existing format exactly
2. **LLM Provider Pluggability**: All LLM calls route through adapter, never direct
3. **No Circular Dependencies**: Audit can import entry builders, not execution code
4. **Config Before First Use**: `config.init()` must be called before modules access configuration
5. **Test Isolation**: All external APIs mocked (no real HTTP/LLM calls in CI)
6. **Phase 3 Cutover Safety**: Existing tests must pass before server.js refactoring

---

## Next Steps

1. **Start Phase 1.1.1**: Create base provider abstract class
2. **Parallel Phase 1.1 & 1.2**: Both task groups can proceed independently
3. **Track progress**: Update task status (⏳ → ✅ or ❌) as each completes
4. **Run tests after each task**: Unit tests + integration with existing gate tests
5. **Commit frequently**: Small, focused commits per task group

