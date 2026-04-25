# New Agent Onboarding — GEAkr / PCA / EA Intelligence System

Date: 2026-04-25
Status: v0.1 onboarding baseline
Repository: `jjuniper-dev/geakr-v1`
Primary working branch: `feature/geakr-v1-scaffold`

---

## 1. Purpose of this document

This document gives a new agent enough context to work safely and productively on the GEAkr repository and its related Personal Cognitive Architecture (PCA), Enterprise Architecture (EA), and Technology Portfolio Office (TPO) use cases.

The agent should treat this as the orientation layer before making changes.

---

## 2. Core concept

GEAkr is a lightweight, storage-agnostic context pattern for AI-assisted knowledge work.

At its simplest:

```text
Sources + notes + files + instructions
        ↓
Bounded project context
        ↓
AI-assisted output
        ↓
Human review / governance handoff
```

GEAkr is not a single platform. It is a pattern that can run across local folders, SharePoint, GitHub, ChatGPT Projects, Claude Projects, Google Drive, approved enterprise environments, or personal/PCA environments.

---

## 3. Concept map

Use this framing consistently:

```text
GEAkr = context pattern
Projects = persistence mechanism
Connectors = access mechanism
GitHub = version/control mechanism
CI/CD = validation/automation mechanism
Skills = capability/task bundles
MCP servers = tool access layer
Azure/OpenLM/OpenAI = runtime/execution mechanism
HC Data Platform = governed enterprise data/platform integration mechanism
PCA = personal reasoning, synthesis, reconciliation, and decision-support layer
```

Do not confuse these layers.

---

## 4. Strategic positioning

### 4.1 Shadow AI positioning

GEAkr helps prevent shadow AI by making the governed path easier than the unmanaged path.

Recommended line:

> GEAkr provides a low-friction governed lane for AI-assisted work. It helps teams organize context, use approved tools, preserve traceability, and produce reviewable outputs.

GEAkr does not itself create approval, security, privacy, or compliance. It supports governance by improving structure, traceability, reviewability, and repeatability.

### 4.2 HC data platform positioning

GEAkr should be positioned as a pre-platform context and knowledge-preparation layer.

Recommended line:

> GEAkr structures project context and early AI/data work so it can be cleanly onboarded into the HC data platform when it matures.

GEAkr does not replace the HC data platform, data governance, metadata management, official analytics environments, or enterprise storage.

### 4.3 GC AI Strategy positioning

GEAkr supports the Government of Canada AI strategy by helping teams structure context, identify use cases, preserve traceability, and produce reviewable AI-assisted outputs.

It aligns with themes such as:

- approved AI use
- reducing shadow AI
- traceability
- explainability
- human review
- data readiness
- AI governance
- enterprise AI adoption

---

## 5. Branch model

The repo uses a multi-branch mental model.

### 5.1 `main`

Role: public/shared baseline.

Contains:
- public-safe knowledge
- generalized patterns
- reusable intelligence
- stable templates

Constraints:
- no internal-sensitive material
- no personal-sensitive material
- only public-safe or sanitized/promoted content

### 5.2 `work/geakr-enterprise`

Role: work/EA/TPO branch.

Contains:
- enterprise architecture analysis
- TPO patterns
- internal unclassified notes if appropriate
- work-safe context only

Constraints:
- UNCLASSIFIED only unless an approved environment and repo/storage policy explicitly allow more
- no personal data
- no Protected B or higher
- no sensitive operational details

### 5.3 `personal/pca`

Role: personal cognitive architecture branch.

Contains:
- personal reasoning
- PCA experiments
- personal synthesis
- provisional thinking

Constraints:
- not intended for enterprise sharing
- may include speculative thought
- promotion to `main` requires sanitization/generalization

### 5.4 `feature/geakr-v1-scaffold`

Current active development branch for the scaffold and prototype work.

---

## 6. Cross-pollination policy

Knowledge should not be copied directly across branch contexts. It must be promoted through a transformation step.

Allowed flows:

```text
main → work/geakr-enterprise
main → personal/pca
personal/pca → main, only after sanitization/generalization
work/geakr-enterprise → main, only after sanitization/generalization
```

Disallowed direct flows:

```text
personal/pca → work/geakr-enterprise
work/geakr-enterprise → personal/pca
```

Promotion means:

1. Remove names, internal systems, personal context, sensitive details.
2. Reframe specific insights as general patterns.
3. Validate against public or safe sources where possible.
4. Add metadata showing origin and promotion status.

Example metadata:

```yaml
origin_branch: personal/pca
source_layer: personal
promotion_status: promoted
trust_state: provisional
```

---

## 7. Safety and data-sharing boundaries

### 7.1 Critical rule

SDK use does not define privacy. The endpoint, runtime, payload, hosting, storage, and account terms define the data-sharing boundary.

```text
SDK ≠ privacy boundary
Endpoint + payload + runtime + hosting + account terms = privacy boundary
```

### 7.2 Personal experimentation

Replit or equivalent may be used for personal experimentation with public or non-sensitive sources.

It should not be used for work material unless explicitly approved.

### 7.3 Work use

For work use, host the capture backend in an approved organizational environment.

Work use requires controls for:

- identity and access
- secrets management
- logging and monitoring
- approved model endpoint
- approved storage
- data classification and privacy
- retention and audit requirements

Potential target environments:

- Azure App Service
- Azure Functions
- approved internal container hosting
- approved organizational GitHub/DevOps hosting

### 7.4 Local-only/no-sharing options

GEAkr can operate without external model sharing.

Runtime modes:

```text
metadata_only
local_only
local_llm
external_api_public_only
approved_enterprise
```

For maximum privacy:

```text
capture URL/title/notes only → no model call
```

or:

```text
local extraction/local LLM → knowledge file → no external provider
```

---

## 8. Sanitization layer

A sanitization layer has been added to the mobile capture backend before model calls.

Current sanitizer version:

```text
SANITIZER_VERSION = 0.1.0-regex-risk-gate
```

Current pipeline version:

```text
CAPTURE_PIPELINE_VERSION = 0.3.0-sanitized-structured-capture
```

Current graph fragment version:

```text
GRAPH_FRAGMENT_VERSION = 0.1.0-capture-fragment
```

The sanitizer attempts to redact:

- emails
- phone numbers
- SIN-like numbers
- credit-card-like numbers
- bearer tokens
- API keys/secrets/password-like values

High-risk findings can block model calls unless explicitly overridden.

Important: sanitization is risk reduction, not a security boundary.

---

## 9. Mobile capture app

Location:

```text
apps/mobile-capture/
```

Key files:

```text
apps/mobile-capture/server.js
apps/mobile-capture/package.json
apps/mobile-capture/public/index.html
apps/mobile-capture/ios-shortcut-spec.md
```

Purpose:

A tap-first capture system for turning a high-interest URL into:

- a structured knowledge file
- graph nodes and edges
- optional GitHub write-back

Current flow:

```text
URL
 ↓
fetch readable page text
 ↓
sanitize text
 ↓
structured LLM extraction via JSON schema
 ↓
render deterministic Markdown knowledge file
 ↓
generate graph fragment
 ↓
optionally write to GitHub
```

The app currently uses the OpenAI JavaScript SDK.

Important: OpenAI SDK use means the sanitized payload is sent to the configured OpenAI endpoint. For work use, do not use external API mode unless explicitly approved.

---

## 10. Structured knowledge output

The capture backend uses JSON-schema structured output.

The model returns JSON containing:

```text
title
source_type
confidence
summary[]
key_points[]
architecture_implications[]
geakr_implications[]
constraints_risks[]
concepts[]
```

The backend then renders Markdown deterministically.

This avoids uncontrolled model-generated Markdown drift.

Knowledge files include metadata such as:

```yaml
source: <url>
source_type: <type>
status: extracted
last_updated: <date>
confidence: <low|medium|high>
pipeline_version: <version>
sanitizer_version: <version>
pca_state: captured
trust_state: provisional
reconciliation_status: not_reconciled
source_layer: public
capture_method: mobile_url
sanitizer_findings: []
concepts:
  - ai-governance
```

---

## 11. Graph system

GEAkr includes a graph overlay that maps:

- sources
- knowledge files
- response files
- concepts
- skills
- branches

without collapsing boundaries.

### 11.1 Node types

```text
source
knowledge
response
concept
skill
branch
document
```

### 11.2 Edge types

```text
derived_from
supports
challenges
promoted_to
related_to
uses_skill
belongs_to_branch
```

### 11.3 Graph fragment generation

Each mobile capture can generate:

```text
graph/fragments/<capture-name>.graph.json
```

A graph fragment contains nodes and edges for the captured source and its extracted concepts.

### 11.4 Extractor script

```bash
node scripts/graph/extract-graph.js
```

Outputs:

```text
graph/nodes.json
graph/edges.json
graph/graph.json
```

### 11.5 Search index builder

```bash
node scripts/graph/build-search-index.js
```

Outputs:

```text
graph/search-index.json
```

### 11.6 Convergence analyzer

```bash
node scripts/graph/analyze-convergence.js
```

Outputs:

```text
graph/convergence.json
graph/confidence.json
```

### 11.7 Conflict detector

```bash
node scripts/graph/detect-conflicts.js
```

Outputs:

```text
graph/conflicts.json
graph/conflict-report.md
```

### 11.8 Chad mode EA view

```bash
node scripts/graph/chad-view.js
```

Outputs:

```text
graph/chad-view.json
graph/chad-report.md
```

### 11.9 Conflict resolution task generator

Planned/partially added:

```bash
node scripts/graph/generate-resolution-tasks.js
```

Expected output:

```text
graph/resolution-tasks.md
```

---

## 12. Graph viewer UX

Location:

```text
graph/view.html
```

Purpose:

Static Cytoscape.js graph viewer with:

- graph file load
- smart search/autocomplete
- tap result to zoom to node
- details panel showing status, branch, confidence, and issues

Desired UX:

```text
type a few letters
 ↓
smart list suggests nodes
 ↓
tap correct node
 ↓
graph zooms to node
 ↓
side panel shows current status, key issues, confidence, etc.
```

The viewer depends on:

```text
graph/graph.json
graph/search-index.json
```

Future improvements:

- confidence-weighted search ranking
- inline conflict warning badges
- branch view toggles
- Chad mode toggle
- click-through to source/knowledge file
- graph fragment merge support

---

## 13. Convergence, confidence, and conflict logic

### 13.1 Convergence

Convergence analysis scores concepts based on:

- number of supporting artifacts
- branch diversity
- source diversity
- trust state
- promotion signals

It is signal detection, not truth detection.

### 13.2 Confidence

Confidence scores are heuristic.

They help prioritize review but do not validate a claim.

### 13.3 Conflict detection

Conflict detection flags:

- internal/PCA concepts without public support
- PCA + work convergence not promoted
- low-trust or rejected support
- public-only concepts without operational uptake
- single-artifact fragile signals

Conflict detection is a review aid, not a final decision engine.

### 13.4 Conflict resolution

Conflict states:

```text
open
triaged
evidence_needed
sanitize_for_promotion
accepted_risk
resolved
rejected
```

Resolution actions:

```text
add_public_evidence
promote_sanitized
keep_provisional
reject_signal
local_only
```

---

## 14. Chad mode

Chad mode is an EA decision view over the graph.

Purpose:

Filter the knowledge graph for architecture-decision-relevant concepts, signals, risks, and promotion candidates.

Focus areas:

- architecture
- governance
- risk
- compliance
- AIA / Directive on Automated Decision-Making
- platform
- data
- integration
- security
- privacy
- auditability
- traceability
- cloud/Azure
- MCP
- skills
- AI strategy
- TPO / EA

Chad mode produces:

```text
Decision signals
Risks and constraints
Platform implications
Capability implications
Promotion candidates
```

---

## 15. Public intelligence baseline

Location:

```text
docs/strategic-context/ai-public-intelligence.md
```

Purpose:

Capture public-source intelligence on Canadian and Government of Canada AI strategy, compute, governance, and federal implementation expectations.

Key source categories:

- ISED AI ecosystem
- Canadian Sovereign AI Compute Strategy
- Government of Canada responsible AI hub
- AI Strategy for the Federal Public Service 2025-2027
- Directive on Automated Decision-Making
- Algorithmic Impact Assessment
- peer review guidance
- GC AI Register

Important framing:

```text
ISED → enables AI ecosystem and compute
TBS/GC strategy → governs AI
GEAkr → operationalizes structured AI use at project level
```

---

## 16. SDK and integration options

Location:

```text
docs/integration/sdk-options.md
```

Relevant SDK/API layers:

### GitHub / Octokit

Use for:
- file read/write
- PRs
- promotion workflows
- CI/CD
- graph artifact publishing

### OpenAI / Azure OpenAI SDK

Use for:
- extraction
- structured output
- PCA response
- embeddings
- skills execution

### Microsoft Graph SDK

Use for approved work scenarios:
- SharePoint
- OneDrive
- Teams/M365 contexts

### Azure SDKs

Use for enterprise runtime:
- App Service / Functions
- Key Vault
- Storage
- Managed Identity
- Monitor / Application Insights

### MCP SDKs

Use for:
- tool access abstraction
- GitHub/SharePoint/Azure tools
- skills calling tools

### Search / vector SDKs

Use for:
- semantic search
- embeddings
- retrieval across branches
- concept discovery

### Visualization

Current viewer uses Cytoscape.js.

---

## 17. Skills and MCP concept

Skills are repeatable task patterns.

Examples:

```text
Strategy Alignment Check
AIA Pre-Assessment Helper
Architecture Diagram Generator
Capability Mapping Assistant
Risk & Compliance Scan
Data Quality Assessment
```

MCP servers are optional tool-access connectors.

Examples:

```text
GitHub MCP → repo/file operations
SharePoint MCP → approved document access
Azure MCP → cloud/resource access
Search MCP → source retrieval
```

Do not make skills or MCP required for Level 0.

Level 0 must work as a folder + instructions pattern.

---

## 18. Versioning model

Relevant ADR:

```text
docs/decisions/ADR-0001-geakr-pca-mobile-capture.md
```

Versioning layers:

```text
GEAkr Core Pattern
Knowledge Capture Pipeline
PCA Immediate Response Flow
Skills Layer
MCP / Tool Access Layer
CI/CD Validation Layer
```

Current conceptual version:

```text
GEAkr v0.2.0-prototype
```

Current capture pipeline:

```text
v0.3.0-sanitized-structured-capture
```

Guidance:

```text
v0.x = prototype / design changing
v1.0 = stable Level 0 pattern usable by non-technical users
v1.1+ = additive improvements
v2.0 = breaking structural change or enterprise mode
```

---

## 19. Recommended operating commands

Typical graph build flow:

```bash
node scripts/graph/extract-graph.js
node scripts/graph/analyze-convergence.js
node scripts/graph/detect-conflicts.js
node scripts/graph/build-search-index.js
node scripts/graph/chad-view.js
```

Then open:

```text
graph/view.html
```

Load:

```text
graph/graph.json
```

For Chad mode, load:

```text
graph/chad-view.json
```

---

## 20. Current implementation caveats

A new agent must be aware of the following:

1. Some files are prototype quality and may need cleanup.
2. The backend has evolved quickly; confirm current server.js before editing.
3. The sanitizer is regex-based and incomplete.
4. Sanitization is not a security boundary.
5. Work use requires approved runtime, not Replit/personal hosting.
6. Graph fragments are generated, but a graph-fragment merger is still needed.
7. Search is lexical/semantic-lite, not true vector search yet.
8. Confidence is heuristic.
9. Conflict detection is heuristic and requires human review.
10. The repo has multiple branches with different context and sharing assumptions.

---

## 21. Recommended next work items

### High priority

1. Add graph fragment merger:

```text
graph/fragments/*.json → graph/graph.json
```

2. Add runtime policy gate:

```text
metadata_only | local_only | external_api_public_only | approved_enterprise
```

3. Add branch-specific defaults:

```text
main = conservative public
personal/pca = user-controlled public/non-sensitive
work/geakr-enterprise = approved enterprise only
```

4. Add structured PCA output:

```text
PCA response → JSON schema → rendered Markdown
```

5. Add CI validation for knowledge files:

```text
required metadata
concepts present
sanitizer version present
pipeline version present
no obvious secrets
```

### Medium priority

6. Add embedding-based semantic search.
7. Add confidence-weighted search ranking.
8. Add UI conflict badges.
9. Add click-through file/source links.
10. Add promotion workflow and PR templates.

### Later

11. MCP server integration.
12. Azure/approved enterprise runtime design.
13. HC Data Platform integration mapping.
14. Purview/Fabric/metadata API integration, if relevant and approved.

---

## 22. Agent behavioral rules

A new agent working in this repo should:

1. Preserve Level 0 simplicity.
2. Never make Replit or external APIs mandatory.
3. Treat work use as requiring approved organizational hosting.
4. Keep public, work, and personal/PCA contexts separate.
5. Promote knowledge only through sanitization/generalization.
6. Keep traceability metadata intact.
7. Avoid claiming compliance; say the system supports governance/compliance workflows.
8. Treat confidence and conflict outputs as decision-support signals, not truth.
9. Version pipeline changes.
10. Prefer additive changes over breaking structural changes.

---

## 23. Standard language to reuse

### GEAkr definition

GEAkr is a lightweight, storage-agnostic context pattern for organizing sources, notes, files, and instructions so AI-assisted outputs are bounded, traceable, and reviewable.

### Shadow AI

GEAkr reduces shadow AI by making the governed path easier than the unmanaged path.

### Data platform

GEAkr prepares project context and early AI/data work so it can later align with governed enterprise data platforms.

### Privacy boundary

The SDK is not the privacy boundary. The endpoint, runtime, payload, hosting, and account terms define the data-sharing boundary.

### Sanitization

Sanitization reduces risk but does not create a security boundary.

### Graph

The graph overlays relationships across public, work, and PCA knowledge without collapsing their boundaries.

---

## 24. Minimal mental model

If the new agent remembers only one thing, remember this:

```text
Capture → Sanitize → Structure → Store → Graph → Analyze → Review → Promote
```

And this:

```text
GEAkr is the context pattern.
Everything else is an optional mechanism layered around it.
```
