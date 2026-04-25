# PPTX Generator Mode — Connector / Skill / MCP Design

Date: 2026-04-25
Status: v0.1 design
Scope: GEAkr / PCA / EA diagram and deck generation

## Purpose

Define how GEAkr can use a PowerPoint generation capability through a connector, skill, or MCP-style interface rather than relying on manual slide creation.

This document describes a generator mode that can turn architecture specs, C4 views, Mermaid diagrams, graph intelligence outputs, and executive narratives into repeatable PowerPoint artifacts.

---

## Core idea

GEAkr should treat PowerPoint generation as an optional execution capability.

```text
GEAkr context + visual specs + graph outputs
        ↓
PPTX Generation Skill
        ↓
PPTX Connector / MCP Server / Local PPTX Renderer
        ↓
Versioned deck artifact
```

PowerPoint generation should not be embedded into the core GEAkr pattern. It should be a skill layered on top.

---

## Concept map

```text
GEAkr = context pattern
Visual specs = declarative slide/diagram instructions
PPTX skill = generation logic and deck assembly instructions
PPTX connector/MCP = tool access layer for PowerPoint creation/editing
Template = DTB slide design system
Deck artifact = generated output
GitHub = version/control mechanism
```

---

## Why this matters

Manual PPTX creation is slow, inconsistent, and hard to govern.

A PPTX generator mode allows:

- repeatable slide creation
- consistent DTB styling
- versioned visual specs
- traceable source-to-slide lineage
- faster ARB / EA / TPO deck production
- future accessibility checks
- separation between content model and rendering tool

---

## Target generation flow

```text
1. Source material
   - GEAkr knowledge files
   - graph/convergence outputs
   - Chad mode report
   - C4 architecture markdown
   - DTB visual architecture markdown

2. Slide manifest
   - deck title
   - theme
   - slide list
   - source files
   - diagram specs
   - speaker notes
   - accessibility metadata

3. PPTX skill
   - reads manifest
   - validates required inputs
   - selects slide layouts
   - calls PPTX connector / MCP / renderer

4. PPTX connector / MCP / renderer
   - creates or updates PowerPoint
   - applies template
   - inserts diagrams, text, shapes
   - exports deck

5. Governance output
   - deck artifact
   - generation log
   - source manifest
   - revision history
```

---

## Skill definition

### Skill name

```text
Generate EA PPTX Deck
```

### Skill purpose

Generate a DTB-style PowerPoint deck from GEAkr architecture, graph, and decision-support artifacts.

### Inputs

```yaml
deck_title: string
theme: DTB Option A
classification: Unclassified / Non classifié
audience: EA / TPO / ARB / Executive
source_files:
  - docs/visuals/geakr-pca-architecture-dtb.md
  - docs/visuals/geakr-pca-c4-architecture.md
  - graph/chad-report.md
  - graph/conflict-report.md
slide_manifest: path/to/manifest.json
output_path: path/to/output.pptx
```

### Outputs

```text
output.pptx
generation-log.json
source-lineage.json
```

### Guardrails

- Do not include personal/PCA content in work decks unless promoted and sanitized.
- For work decks, use public and approved internal-unclassified content only.
- Do not claim compliance; say WCAG-aligned or governance-supporting where appropriate.
- Keep generated diagrams readable at 16:9.
- Maintain DTB visual style and low text density.

---

## Slide manifest structure

```json
{
  "deck_title": "GEAkr + PCA Architecture Flow",
  "version": "0.1",
  "theme": "DTB Option A",
  "classification": "Unclassified / Non classifié",
  "audience": "EA / TPO / ARB",
  "slides": [
    {
      "id": "s01",
      "title": "Why GEAkr",
      "layout": "title_and_message",
      "source": "docs/positioning/shadow-ai-positioning.md",
      "message": "GEAkr reduces shadow AI by making the governed path easier than the unmanaged path."
    },
    {
      "id": "s02",
      "title": "Architecture Flow",
      "layout": "layered_flow",
      "source": "docs/visuals/geakr-pca-architecture-dtb.md",
      "diagram": "visual-architecture-diagram"
    },
    {
      "id": "s03",
      "title": "C4 Container View",
      "layout": "architecture_diagram",
      "source": "docs/visuals/geakr-pca-c4-architecture.md",
      "diagram": "c4-level-2-container-view"
    },
    {
      "id": "s04",
      "title": "EA Decision Signals",
      "layout": "decision_summary",
      "source": "graph/chad-report.md"
    },
    {
      "id": "s05",
      "title": "Risks and Controls",
      "layout": "risk_controls",
      "source": "graph/conflict-report.md"
    }
  ]
}
```

---

## Connector / MCP interface contract

A future PPTX connector or MCP server should expose tools like:

```text
create_deck(template_path, output_path)
add_title_slide(deck_id, title, subtitle, classification)
add_layered_flow_slide(deck_id, slide_spec)
add_mermaid_diagram_slide(deck_id, mermaid_source, title)
add_c4_view_slide(deck_id, view_spec)
add_decision_summary_slide(deck_id, decision_items)
add_risk_controls_slide(deck_id, risks, mitigations)
apply_theme(deck_id, theme_spec)
validate_accessibility(deck_id)
export_pptx(deck_id)
```

---

## MCP-style tool schema sketch

```json
{
  "tool": "pptx.create_deck_from_manifest",
  "arguments": {
    "manifest_path": "docs/pptx/geakr-pca-deck.manifest.json",
    "template_path": "templates/pptx/DTB_OptionA_Template.pptx",
    "output_path": "artifacts/pptx/geakr-pca-architecture-flow.pptx",
    "mode": "graphic",
    "accessibility_level": "basic"
  }
}
```

---

## Rendering modes

### 1. Graphic mode

Purpose:
- executive diagrams
- visual storytelling
- ARB decks

Characteristics:
- high visual polish
- limited text density
- not necessarily fully accessible by itself
- may require companion notes or accessible version

### 2. Accessible mode

Purpose:
- compliance-friendly distribution
- screen-reader-friendly content

Characteristics:
- native PPTX text where possible
- reading order checks
- alt text
- contrast checks
- structured notes

### 3. Hybrid mode

Purpose:
- practical default

Characteristics:
- graphic slides with native text overlays
- speaker notes capture full details
- accessibility metadata added where practical

---

## Proposed folder structure

```text
docs/pptx/
  geakr-pca-deck.manifest.json
  pptx-generator-mode.md

artifacts/pptx/
  geakr-pca-architecture-flow.pptx
  generation-log.json
  source-lineage.json

templates/pptx/
  DTB_OptionA_Template.pptx
```

---

## Data and privacy boundary

The PPTX generator must obey the same context rules as GEAkr:

- public content can be used in public/shared decks
- work content requires approved environment and classification controls
- personal/PCA content must not enter work decks unless sanitized and promoted
- generated decks must indicate classification where appropriate

---

## Relationship to current implementation

Current state:

- C4 markdown exists
- DTB visual markdown exists
- graph outputs exist or are planned
- manual PPTX generation has been tested outside the repo

Next state:

- create a manifest-driven PPTX generator path
- use a connector, MCP server, or local renderer to consume the manifest
- commit slide manifests and generated logs to the repo

---

## Recommended next implementation steps

1. Add `docs/pptx/geakr-pca-deck.manifest.json`.
2. Add a local renderer script or connector wrapper.
3. Support one layout first: `layered_flow`.
4. Add C4 diagram rendering second.
5. Add generation log and source lineage output.
6. Later integrate with a PPTX MCP server if available and approved.

---

## Key principle

The deck should be generated from versioned architecture specs, not hand-authored as an isolated artifact.

```text
Architecture spec → slide manifest → generator skill → PPTX artifact
```

This keeps PowerPoint production traceable, repeatable, and governable.
