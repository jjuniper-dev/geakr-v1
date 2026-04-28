# Architecture Rationale: How GEAkr's Design Solves the Context Problem

## The Bridge: Problem → Architecture

The context problem requires solutions to five challenges. Here's how GEAkr's architecture addresses each.

---

## Challenge 1: Data Classification Enforcement

**The Problem**:
- "Work" documents must not be accessible to users in "metadata_only" mode
- "Personal" documents must never be shared
- "Public" documents are safe everywhere
- Classification must be enforced *mechanically*, not by trust

**The Architecture Solution**:

```
┌─────────────────────────────────────────────────────┐
│ Policy Gate (policy/gate.js)                        │
│ Determines: Who can do what, based on classification│
│ - 5 runtime modes: metadata_only → approved_enterprise
│ - Maps modes to allowed document classifications    │
│ - Enforces at point of operation                    │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│ RAG Policy Gate (knowledge-base/policy-gate.js)     │
│ Applies policy specifically to document retrieval   │
│ - Filters documents by allowed classification      │
│ - Returns decision: ALLOW / PARTIAL / BLOCK        │
│ - Logs which classifications were blocked + why    │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│ Knowledge Base (knowledge-base/index.js)            │
│ Returns filtered results respecting policy         │
│ - Only classifications allowed by mode are shown   │
│ - Full count of blocked documents logged           │
│ - No way to bypass filtering (it happens before    │
│   results are returned)                            │
└─────────────────────────────────────────────────────┘
```

**Why This Design**:
- Classification isn't a suggestion; it's enforced by code logic
- Can't accidentally send "work" docs to "metadata_only" user
- Audit log shows exactly which documents were filtered and why
- Compliance teams can verify filtering happened correctly

**Modes → Classifications Matrix**:
```
Mode                      | Public | Unknown | Work | Personal
--------------------------|--------|---------|------|----------
metadata_only             |   ❌   |   ❌   |  ❌  |    ❌
local_only                |   ✅   |   ✅   |  ❌  |    ❌
external_api_public_only  |   ✅   |   ✅   |  ❌  |    ❌
approved_enterprise       |   ✅   |   ✅   |  ✅  |    ❌
```

This is **policy as code**—a single source of truth that can't be misconfigured.

---

## Challenge 2: Complete Audit Trail

**The Problem**:
- "We need to prove we made this decision with proper authorization"
- "Show me who accessed this sensitive document and when"
- "Was this decision made with full context, or was info blocked?"
- "Can't trust that someone remembers the rationale"

**The Architecture Solution**:

```
Every operation flows through audit logging:

┌─ User Request ─┐
       ↓
┌─ Policy Gate ──────────────────────────────┐
│ Log: WHO attempted WHAT, mode, decision    │
│ Entry: type=gate_decision, user_id, mode  │
└────────────────────────────────────────────┘
       ↓
┌─ Operation (Ingest/Retrieve) ──────────────┐
│ Log: WHAT data was accessed, results       │
│ Entry: type=rag_ingestion or rag_retrieval │
└────────────────────────────────────────────┘
       ↓
┌─ Policy Enforcement ───────────────────────┐
│ Log: WHICH docs were filtered, why         │
│ Entry: type=rag_policy_gate, blocked_count │
└────────────────────────────────────────────┘
       ↓
┌─ LLM Call ─────────────────────────────────┐
│ Log: WHICH LLM, tokens, cost               │
│ Entry: type=llm_call, model, cost          │
└────────────────────────────────────────────┘
       ↓
All entries written to audit/logs/{date}.jsonl
```

**Audit Entry Example**:
```json
{
  "type": "rag_retrieval",
  "timestamp": "2026-04-27T14:35:22Z",
  "user_id": "alice@hc.ca",
  "capture_id": "capture-789",
  "query": "How do we implement Kubernetes networking?",
  "runtime_mode": "approved_enterprise",
  "retrieved_count": 5,
  "returned_count": 4,
  "blocked_count": 1,
  "blocked_classifications": {"personal": 1},
  "policy_decision": "PARTIAL",
  "documents_returned": [
    {"title": "Kubernetes for HC", "classification": "work", "similarity": 0.92}
  ]
}
```

**Why This Design**:
- Each operation leaves a permanent record (JSONL format = immutable)
- Timestamp proves WHEN it happened
- User ID proves WHO did it
- Document details prove WHAT was accessed
- Policy decision proves it was AUTHORIZED
- Blocked counts prove CLASSIFICATION was enforced

Compliance auditor asks: "Prove alice@hc.ca properly accessed work documents"
→ Pull audit log entry above. ✓ Proven in one record.

---

## Challenge 3: Team Isolation Without Siloing Knowledge

**The Problem**:
- Security team's documents shouldn't be accessible to communications team
- But both teams need to be able to share when authorized
- Can't require constant permission-asking for every document
- Must scale to many teams with different access levels

**The Architecture Solution**:

```
┌─────────────────────┐
│ Document Metadata   │
├─────────────────────┤
│ classification      │  ← Public / Work / Personal
│ team                │  ← "platform" / "security" / "communications"
│ source_url          │  ← Document origin
└─────────────────────┘
       ↓
┌─────────────────────┐
│ Retrieval Request   │
├─────────────────────┤
│ teamId: "platform"  │  ← User's team context
│ runtimeMode: "..."  │  ← Policy enforcement mode
└─────────────────────┘
       ↓
┌────────────────────────────────────────┐
│ Filtering (Two-layer approach)         │
├────────────────────────────────────────┤
│ 1. Team Filter: Only docs from        │
│    matching team OR public=true        │
│ 2. Classification Filter: Only        │
│    classifications allowed by mode    │
└────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────┐
│ Result: Documents visible to user      │
│ - Team member: Own + shared docs      │
│ - Other team: Shared public docs      │
│ - No way to access blocked docs       │
└────────────────────────────────────────┘
```

**Example Scenario**:

Security team ingests: "Incident Response Playbook" (team=security, classification=work)
Communications team tries to retrieve: "incident response"

```
Filtering:
1. Team check: Doc team is "security", user team is "communications"
   → Only visible if explicitly marked "public"
2. Classification check: Doc classification is "work"
   → User in metadata_only mode → BLOCKED
Result: Document not retrieved. Audit log shows it was filtered.
```

Later, Security team marks "Incident Response Playbook" (public=true, classification=public)
Same retrieval now succeeds. Audit shows it was ALLOWED.

**Why This Design**:
- Knowledge flows when authorized, is blocked when not
- No manual permission-checking for each document
- Scaling to 100 teams requires zero additional configuration
- Audit trail proves every access was appropriate

---

## Challenge 4: Institutional Memory Without External Dependencies

**The Problem**:
- Can't use cloud-based vector databases (government data restrictions)
- Can't rely on external APIs we don't control
- Can't afford licensing costs that scale with document count
- Must work with tools already approved for HC use

**The Architecture Solution**:

```
┌────────────────────────────────────────────────────────┐
│ Storage Layer (No External Dependencies)               │
├────────────────────────────────────────────────────────┤
│ In-Memory Store (runtime caching)                      │
│ - Fast access for current documents                    │
│ - Embeddings cached (avoid re-running expensive math)  │
│                                                         │
│ File Store (persistent, local)                         │
│ - JSON-based (human-readable, debuggable)              │
│ - All data stays in HC controlled environments         │
│ - No external vector DB needed                         │
│ - No vendor lock-in                                    │
└────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────┐
│ Embedding Provider (Pluggable)                         │
├────────────────────────────────────────────────────────┤
│ Default: OpenAI (via policy gate)                      │
│ Alt: Local (Ollama if available)                       │
│ Alt: HuggingFace (self-hosted)                         │
│                                                         │
│ Key: Policy gate controls WHICH provider per mode     │
│ - external_api_public_only → OpenAI OK                │
│ - metadata_only → No embeddings at all                │
│ - local_only → Ollama only                            │
└────────────────────────────────────────────────────────┘
```

**Cost & Compliance Model**:
```
Documents stored locally:
- 1,000 docs: ~2-5 MB on disk, <10 MB in memory
- 10,000 docs: ~20-50 MB on disk, <100 MB in memory
- Scaling is linear, predictable, cost-zero after tooling

Embeddings:
- Pay OpenAI per embedding (one-time, when document ingested)
- Cached locally after first run (no repeated costs)
- If document unchanged, embedding is reused

Result: No subscription to external vector DB vendor
        No scaling costs as organization grows
        100% control over data location
```

**Why This Design**:
- Government data stays in government infrastructure
- No vendor lock-in (can switch embedding provider anytime)
- Costs are predictable and minimal
- Compliance teams understand data flow (no black boxes)

---

## Challenge 5: Multi-LLM Strategy Based on Policy

**The Problem**:
- Some information is safe for public APIs (OpenAI)
- Some information requires local/private LLMs
- Different LLMs have different costs and capabilities
- Can't make team members choose the right LLM manually

**The Architecture Solution**:

```
┌────────────────────────────────────────┐
│ LLM Adapter (knowledge-base/../adapter/│
├────────────────────────────────────────┤
│ Provider Registry:                      │
│ - OpenAI (cheapest, fine for public)   │
│ - Claude (most capable, for sensitive) │
│ - Local (Ollama, for restricted data)  │
│                                         │
│ Routing Rules:                          │
│ - Operation: structuredExtract         │
│ - Mode: approved_enterprise            │
│ - Provider: Claude ← Most capable      │
│                                         │
│ - Operation: structuredExtract         │
│ - Mode: external_api_public_only       │
│ - Provider: OpenAI ← Cost-effective    │
│                                         │
│ - Operation: structuredExtract         │
│ - Mode: metadata_only                  │
│ - Provider: None ← No LLM call made    │
└────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────┐
│ Result: User requests retrieval        │
│ System automatically selects:          │
│ - Correct provider per policy mode     │
│ - Correct model per operation          │
│ - Logs which LLM was used + cost       │
│                                         │
│ User doesn't need to know rules        │
│ System enforces them automatically     │
└────────────────────────────────────────┘
```

**Example**:
```
Request: "Analyze this health policy document"
System checks: mode=approved_enterprise, classification=work
Routing rule: approved_enterprise → use Claude
Decision: Automatic. User gets best answer with appropriate LLM.

Audit log captures:
- Which LLM was used (Claude)
- Cost (tokens × rate)
- Query tokens (input)
- Response tokens (output)

Later: Finance asks "Total LLM spend by mode"
→ Query audit log: sum where mode="approved_enterprise" → $X
  Prove which work was done at which cost
```

**Why This Design**:
- Intelligent provider selection without manual effort
- Cost optimization (cheap LLM for public data, capable LLM for sensitive)
- Compliance audit shows exactly which LLM accessed which data
- Can change routing rules globally without touching application code

---

## Challenge 6: Modularity for Government Maintenance

**The Problem**:
- Government projects change teams frequently
- Code must be maintainable by people who didn't write it
- Can't have monolithic systems (can't understand, can't modify)
- Future policy changes must be implementable without full rewrite

**The Architecture Solution**:

```
GEAkr = Loosely coupled modules:

┌─────────────────────────────────────┐
│ Policy Gate (policy/gate.js)         │ ← Change policy rules here
│ Rules: What each mode allows         │   (isolated, testable)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ LLM Adapter (core/llm-adapter/)      │ ← Add new LLM providers here
│ Providers, Routing                   │   (isolated, plug-in pattern)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ RAG Module (knowledge-base/)         │ ← Improve search independently
│ Storage, Embedding, Retrieval        │   (isolated, versioned)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Audit Module (audit-compliance/)     │ ← Add new compliance checks here
│ Logging, Compliance, Reporting       │   (isolated, new entry types)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Plugin System (plugins/)             │ ← Teams add custom tools here
│ Assess, Identify-Issues, Generate    │   (don't modify core)
└─────────────────────────────────────┘

Each module:
- Has clear inputs/outputs
- Can be tested independently
- Can be upgraded without touching others
- Can be understood by reading one file/folder
```

**Why This Design**:
- New team member can understand one module without learning all 5
- Policy change? Update policy/gate.js, run tests, deploy
- Want better embeddings? Swap embedding provider, no code changes elsewhere
- Need to audit something new? Add entry type to audit-compliance
- Teams want custom plugins? Add plugin, it uses core APIs

---

## Summary: Why This Architecture

| Challenge | Why It Matters | How GEAkr Solves It |
|-----------|---|---|
| **Classification enforcement** | Must be automatic, not trust-based | Policy gate at operation level; filters before results returned |
| **Complete audit trail** | Government compliance requires proof | Every operation logged to immutable JSONL with WHO/WHAT/WHEN |
| **Team isolation** | Sensitive docs must stay isolated | Two-layer filtering: team + classification; audit proves enforcement |
| **Local data storage** | Government data restrictions | JSON-based file storage, pluggable embedding provider |
| **Smart LLM selection** | Cost optimization + appropriate tool use | Routing rules based on policy mode; automatic selection |
| **Maintainability** | Teams change, code must persist | Loosely coupled modules, each with clear responsibility |

**Result**: A system that solves the context problem while respecting government constraints:
- Data stays classified throughout the pipeline
- Every decision is auditable
- Teams can collaborate without exposing sensitive info
- No vendor lock-in or external dependencies
- Future policy changes don't require rewrite
