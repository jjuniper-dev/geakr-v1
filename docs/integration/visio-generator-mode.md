# Visio Generator Mode — Connector / Skill / MCP Design

Date: 2026-04-25
Status: v0.1 design
Scope: GEAkr / PCA / EA diagram generation

## Purpose

Define how GEAkr can use a Visio generation capability through a connector, skill, local renderer, or MCP-style interface.

This mirrors the PPTX generator mode but targets architecture diagrams that may need to be editable as diagrams rather than presented as slides.

---

## Core idea

GEAkr should treat Visio generation as an optional execution capability layered on top of the core context pattern.

```text
GEAkr context + architecture specs + graph outputs
        ↓
Visio Diagram Generation Skill
        ↓
Visio Connector / MCP Server / Local Renderer
        ↓
Versioned diagram artifact (.vsdx / .svg / .png / .drawio)
```

Visio generation should not be embedded into the base GEAkr pattern. It should be invoked as a diagram-production skill.

---

## Concept map

```text
GEAkr = context pattern
Diagram specs = declarative architecture/flow instructions
Visio skill = diagram generation logic
Visio connector/MCP = tool access layer
Stencil library = shape/icon vocabulary
Diagram artifact = generated .vsdx or alternate output
GitHub = version/control mechanism
```

---

## Why this matters

Manual Visio creation is hard to reproduce and easy to drift from the architecture source.

A Visio generator mode enables:

- repeatable architecture diagram production
- editable enterprise diagrams
- consistent notation and stencils
- source-to-diagram traceability
- easier updates when architecture changes
- export to SVG/PNG/PDF/PPTX where required
- potential alignment with EA repository or ARB artifacts

---

## Target generation flow

```text
1. Source material
   - GEAkr knowledge files
   - DTB architecture markdown
   - C4 markdown
   - graph/chad-view.json
   - graph/conflicts.json

2. Diagram manifest
   - diagram title
   - notation style
   - shape library
   - source files
   - nodes and edges
   - layout rules
   - classification / metadata

3. Visio skill
   - reads manifest
   - validates diagram spec
   - maps logical nodes to Visio shapes
   - maps relationships to connectors
   - applies layout rules

4. Visio connector / MCP / renderer
   - creates or updates diagram
   - applies stencil/theme
   - exports .vsdx or alternate formats

5. Governance output
   - diagram artifact
   - generation log
   - source lineage
   - version metadata
```

---

## Skill definition

### Skill name

```text
Generate EA Visio Diagram
```

### Skill purpose

Generate a Visio-compatible enterprise architecture diagram from GEAkr architecture, graph, C4, and decision-support artifacts.

### Inputs

```yaml
diagram_title: string
notation: C4 | layered-flow | capability-map | integration-flow | graph-view
classification: Unclassified / Non classifié
audience: EA / TPO / ARB / Solution Architecture
source_files:
  - docs/visuals/geakr-pca-architecture-dtb.md
  - docs/visuals/geakr-pca-c4-architecture.md
  - graph/graph.json
  - graph/chad-view.json
diagram_manifest: path/to/manifest.json
output_path: path/to/output.vsdx
```

### Outputs

```text
output.vsdx
output.svg
output.png
generation-log.json
source-lineage.json
```

### Guardrails

- Do not include personal/PCA content in work diagrams unless sanitized and promoted.
- For work diagrams, use public and approved internal-unclassified content only.
- Do not claim compliance based only on diagram generation.
- Maintain readable labels and spacing.
- Prefer editable shapes over flattened screenshots.
- Preserve source lineage for every generated node/edge where practical.

---

## Diagram manifest structure

```json
{
  "diagram_title": "GEAkr + PCA Architecture Flow",
  "version": "0.1",
  "notation": "layered-flow",
  "classification": "Unclassified / Non classifié",
  "audience": "EA / TPO / ARB",
  "style": "DTB-clean-light",
  "canvas": {
    "orientation": "landscape",
    "size": "wide"
  },
  "source_files": [
    "docs/visuals/geakr-pca-architecture-dtb.md",
    "docs/visuals/geakr-pca-c4-architecture.md"
  ],
  "layers": [
    {
      "id": "capture",
      "title": "Capture & Intake",
      "nodes": ["Mobile Share", "Manual Folder Input", "Registered Sources"]
    },
    {
      "id": "context",
      "title": "GEAkr Context Pattern",
      "nodes": ["sources.txt", "briefing.md", "notes.md", "GEAKR_INSTRUCTIONS.md"]
    },
    {
      "id": "safety",
      "title": "Safety & Runtime Policy",
      "nodes": ["Sanitization Gate", "Runtime Mode Check", "Data Sharing Boundary"]
    },
    {
      "id": "knowledge",
      "title": "Knowledge & Graph",
      "nodes": ["Structured Output", "Knowledge Files", "Graph Fragments"]
    }
  ],
  "relationships": [
    { "from": "Mobile Share", "to": "Sanitization Gate", "label": "capture" },
    { "from": "Sanitization Gate", "to": "Structured Output", "label": "approved payload" },
    { "from": "Structured Output", "to": "Knowledge Files", "label": "render" },
    { "from": "Structured Output", "to": "Graph Fragments", "label": "derive" }
  ]
}
```

---

## Connector / MCP interface contract

A future Visio connector or MCP server should expose tools like:

```text
visio.create_diagram(template_path, output_path)
visio.add_page(diagram_id, title, metadata)
visio.add_container(diagram_id, page_id, container_spec)
visio.add_shape(diagram_id, page_id, shape_spec)
visio.add_connector(diagram_id, page_id, connector_spec)
visio.apply_layout(diagram_id, page_id, layout_spec)
visio.apply_theme(diagram_id, theme_spec)
visio.import_stencil(diagram_id, stencil_path)
visio.export(diagram_id, format)
visio.validate_readability(diagram_id)
```

---

## MCP-style tool schema sketch

```json
{
  "tool": "visio.create_diagram_from_manifest",
  "arguments": {
    "manifest_path": "docs/visio/geakr-pca-diagram.manifest.json",
    "template_path": "templates/visio/DTB_EA_Template.vsdx",
    "output_path": "artifacts/visio/geakr-pca-architecture-flow.vsdx",
    "export_formats": ["svg", "png"],
    "mode": "editable_shapes"
  }
}
```

---

## Rendering modes

### 1. Editable shapes mode

Purpose:
- formal Visio diagrams
- EA / TPO review
- architecture repositories

Characteristics:
- each node is an editable shape
- connectors are editable
- labels are editable
- strongest fit for Visio

### 2. SVG import mode

Purpose:
- fast visual import from Mermaid, C4, or generated SVG

Characteristics:
- high layout fidelity
- lower editability
- useful for quick diagrams

### 3. Hybrid mode

Purpose:
- balance speed and editability

Characteristics:
- major containers and labels are editable
- complex sub-diagrams may be imported as SVG

---

## Shape/stencil mapping

Recommended default mapping:

| Logical type | Visio shape |
|---|---|
| Person / user | Actor / person icon |
| System | Rounded rectangle |
| Container | Group / container shape |
| Component | Rectangle |
| Data / file | Document shape |
| Repository | Database / storage shape |
| Runtime | Server / cloud shape |
| Policy / control | Shield / rule shape |
| Concept | Tag / hexagon |
| Risk/conflict | Warning shape |
| Decision | Diamond or callout |

---

## Layout patterns

### Layered flow

Use for:
- DTB-style architecture flows
- GEAkr lifecycle
- safety/runtime policy diagrams

Layout:

```text
Capture → Context → Safety → Knowledge → Graph → Decision → Enterprise
```

### C4 context/container

Use for:
- solution architecture
- system boundary explanation

Layout:

```text
Users / External Systems around central GEAkr system
```

### Graph intelligence

Use for:
- knowledge graph overlay
- convergence/conflict visualization

Layout:

```text
Source nodes → Knowledge nodes → Concept nodes → Decision nodes
```

---

## Data and privacy boundary

The Visio generator must follow the same context rules as GEAkr:

- public content can be used in public/shared diagrams
- work content requires approved environment and classification controls
- personal/PCA content must not enter work diagrams unless sanitized and promoted
- generated diagrams must indicate classification where appropriate

Visio output can accidentally expose sensitive labels, filenames, systems, or inferred relationships. The generator must treat diagram labels as data and apply the same promotion/sanitization rules.

---

## Relationship to current implementation

Current state:

- DTB visual architecture markdown exists
- C4 architecture markdown exists
- graph extraction and Chad mode exist
- PPTX generator mode design exists
- Visio generation has not yet been implemented

Next state:

- create `docs/visio/geakr-pca-diagram.manifest.json`
- build local renderer or connector wrapper
- support one mode first: editable layered-flow
- later add C4 and graph intelligence views

---

## Proposed folder structure

```text
docs/visio/
  geakr-pca-diagram.manifest.json
  visio-generator-mode.md

artifacts/visio/
  geakr-pca-architecture-flow.vsdx
  geakr-pca-architecture-flow.svg
  generation-log.json
  source-lineage.json

templates/visio/
  DTB_EA_Template.vsdx
  HC_PHAC_EA_Stencil.vssx
```

---

## Recommended next implementation steps

1. Add `docs/visio/geakr-pca-diagram.manifest.json`.
2. Define canonical shape taxonomy.
3. Build a renderer stub that emits an intermediate diagram JSON.
4. Choose a generation path:
   - Visio COM automation on Windows
   - Microsoft Graph / Visio web integration if feasible
   - draw.io XML as interim editable format
   - SVG export for quick rendering
5. Add source-lineage metadata per shape.
6. Add governance and label checks.

---

## Practical implementation note

Direct Visio automation is more constrained than PPTX because true `.vsdx` generation often depends on:

- Windows COM automation with installed Visio
- specialized libraries
- Visio web / Microsoft 365 integration
- or generation through alternative editable formats such as draw.io XML

For early prototyping, a draw.io or SVG intermediate may be more portable than native `.vsdx`.

---

## Key principle

The diagram should be generated from versioned architecture specs, not hand-authored as an isolated artifact.

```text
Architecture spec → diagram manifest → Visio skill → connector / renderer → diagram artifact
```

This keeps diagram production traceable, repeatable, and governable.
