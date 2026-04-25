# Positioning for Later Integration with the HC Data Platform

Date: 2026-04-25
Status: v0.1 positioning

## Core position

GEAkr should be positioned as a lightweight context and knowledge-preparation pattern that can later integrate with the Health Canada data platform. It is not a replacement for the data platform, data governance, enterprise storage, metadata management, or official analytics environments.

GEAkr prepares project knowledge so it can become more usable, traceable, and governable before deeper integration with enterprise data services.

---

## One-line positioning

GEAkr provides the project-context and knowledge-preparation layer that can feed, align with, or be governed by the HC data platform when a use case matures.

---

## Why this matters

AI and analytics work often begins with scattered context:

- public sources
- internal notes
- briefing material
- architecture assumptions
- user questions
- extracted summaries
- provisional synthesis

The HC data platform is better positioned to govern enterprise datasets, curated data products, analytics, lineage, access, and stewardship. GEAkr can operate upstream of that environment by helping teams structure the knowledge and context around a use case before it becomes a formal data/platform workload.

---

## Separation of concerns

| Layer | Role |
|---|---|
| GEAkr | Project context, source registry, knowledge extraction, provisional synthesis |
| PCA | Personal reasoning, reconciliation, decision support, exploration |
| GitHub | Version control, review, CI/CD, traceability for the pattern and artifacts |
| HC Data Platform | Governed enterprise data, curated datasets, analytics, metadata, platform services |
| Governance | Classification, privacy, security, AIA/DADM, ARB/TPO review |

---

## Integration concept

```text
Sources / notes / public intelligence
        ↓
GEAkr knowledge files and graph
        ↓
Reviewed and promoted context
        ↓
Metadata / catalog / governed data platform alignment
        ↓
Enterprise analytics, AI, reporting, and decision support
```

---

## Integration scenarios

### 1. Source and context preparation

GEAkr captures and structures source material before a project enters formal data/platform intake.

Value:
- clearer use case definition
- better source traceability
- stronger architecture briefing material

---

### 2. Metadata and catalog enrichment

GEAkr-generated knowledge files can provide human-readable context for later metadata work.

Potential mapping:
- source URL -> data/reference source
- concepts -> tags/domains/capabilities
- knowledge file -> contextual documentation
- trust_state -> curation/readiness indicator

---

### 3. AI and analytics use case intake

GEAkr can help shape early AI/data use cases into structured intake packages.

Potential outputs:
- problem statement
- source registry
- data assumptions
- architecture implications
- governance risks
- confidence and conflict signals

---

### 4. Graph-to-platform alignment

The GEAkr graph can identify relationships among:
- sources
- concepts
- capabilities
- risks
- decisions
- artifacts

These relationships may later inform data catalog, knowledge graph, lineage, or semantic layer work on the HC data platform.

---

### 5. Controlled enterprise runtime

For work use, the capture and processing backend should not rely on personal prototype hosting. It should run in an approved organizational environment if used with work material.

Potential target pattern:
- approved Azure hosting
- approved model/runtime endpoint
- enterprise identity
- Key Vault for secrets
- logging and monitoring
- approved storage/data platform integration

---

## Guardrails

GEAkr does not:

- replace the HC data platform
- create an approved security boundary
- replace official metadata management
- replace data stewardship
- replace AIA, privacy, security, or architecture review
- make internal or protected data safe by itself

GEAkr does:

- structure context
- preserve traceability
- separate public, personal, and internal contexts
- support reviewable outputs
- prepare knowledge for promotion into more governed environments

---

## Shadow AI positioning

GEAkr helps prevent shadow AI by making structured, traceable, governed use easier than unmanaged use. Later integration with the HC data platform strengthens this by moving mature use cases from lightweight project context into approved enterprise data and AI services.

---

## Recommended maturity path

### Level 0 — Local/project context

Simple folder, sources, notes, briefing, instructions.

### Level 1 — GitHub/versioned context

Version control, graph extraction, CI checks, searchable knowledge.

### Level 2 — EA/TPO enriched context

Public intelligence plus unclassified, privacy-compatible internal context.

### Level 3 — Platform alignment

Metadata, catalog, governance, and intake alignment with the HC data platform.

### Level 4 — Enterprise integration

Approved runtime, approved storage, platform APIs, lineage, monitoring, and governance workflows.

---

## Executive framing

GEAkr gives teams a low-friction way to organize AI-relevant context early. As the use case matures, that context can be reviewed, promoted, and aligned with the HC data platform so enterprise data, governance, and AI capabilities are applied at the right time.
