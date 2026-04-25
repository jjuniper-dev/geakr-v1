# ADR-0001: Version the GEAkr PCA Mobile Capture Pipeline

Date: 2026-04-25
Status: Accepted for prototype
Version: GEAkr v0.2.0-prototype

## Context

GEAkr began as a lightweight folder pattern for bounded project context. It has now expanded into a mobile-first capture and cognition pipeline that can feed a Personal Cognitive Architecture (PCA).

The current prototype supports:

- atomic knowledge files generated from captured URLs
- GitHub-backed versioned storage
- optional immediate PCA-style response generation
- separation between extracted knowledge and synthesized response artifacts
- optional write-back through a GitHub-capable backend

The concept needs explicit versioning so future changes do not blur the difference between the base GEAkr pattern, the mobile capture app, skills, MCP integration, and PCA-specific synthesis flows.

## Decision

Version the idea as a layered capability stack rather than a single monolithic app.

### Version layers

1. GEAkr Core Pattern
   - folder structure
   - source registry
   - briefing, notes, file index
   - instructions for bounded context

2. Knowledge Capture Pipeline
   - URL capture
   - extraction into atomic Markdown knowledge files
   - metadata and traceability
   - GitHub write-back

3. PCA Immediate Response Flow
   - optional synthesis at capture time
   - reconciliation check
   - decision-support output
   - response saved separately from knowledge files

4. Skills Layer
   - repeatable prompt/task patterns
   - e.g., strategy alignment, AIA pre-check, architecture implications

5. MCP / Tool Access Layer
   - optional connectors for GitHub, SharePoint, Azure, search, or local files
   - access mechanism, not the context pattern itself

6. CI/CD Validation Layer
   - metadata validation
   - required file checks
   - stale source checks
   - policy/privacy guardrail checks

## Version naming

Use semantic versioning for the repo and feature maturity labels for concepts.

- v0.x = prototype / design still changing
- v1.0 = stable Level 0 pattern usable by non-technical users
- v1.1+ = additive improvements that do not break Level 0
- v2.0 = breaking structural change or enterprise mode introduced

Current working version:

GEAkr v0.2.0-prototype

Reason:

- v0.1 introduced the folder/context pattern
- v0.2 adds mobile capture, knowledge extraction, GitHub storage, and optional PCA immediate response
- not yet v1.0 because CI checks, stable docs, security hardening, and user testing are incomplete

## Artifact versioning rules

### Knowledge files

Each captured source becomes its own atomic file:

`YYYY-MM-DD-title-slug-urlhash.md`

Example:

`2026-04-25-canadian-ai-strategy-a1b2c3d4.md`

Knowledge files should include:

- source
- source_type
- status
- last_updated
- confidence
- pca_state
- trust_state
- reconciliation_status
- source_layer
- capture_method

### Response files

Immediate PCA outputs are stored separately:

`YYYY-MM-DD-title-slug-urlhash-pca-response.md`

Response files are provisional and should not be treated as validated knowledge.

### Status states

Knowledge state:

- registered
- extracted
- reviewed
- validated
- stale

PCA state:

- captured
- synthesized
- reconciled
- promoted
- discarded

Trust state:

- provisional
- trusted
- rejected

## Consequences

Positive:

- keeps the Everyman Level 0 pattern simple
- allows PCA features to evolve without confusing the base pattern
- supports GitHub version control and future CI/CD
- preserves traceability from URL to knowledge file to response artifact

Trade-offs:

- requires discipline around metadata
- creates more files than a single appended note
- needs future index generation for easier navigation
- immediate responses must be clearly marked provisional

## Next version targets

### v0.3

- add `schemas/knowledge-file.schema.json`
- add CI validation for required metadata
- add knowledge index generator
- add response index generator

### v0.4

- add first formal skill definitions
- add skill registry
- add strategy-alignment skill

### v0.5

- add MCP/tool-access design notes
- define GitHub MCP, SharePoint MCP, and Azure/OpenLM runtime options

### v1.0

- stable Level 0 template
- tested with real users
- clear README and setup guide
- mobile capture documented as optional extension
- CI checks passing for template and knowledge files
