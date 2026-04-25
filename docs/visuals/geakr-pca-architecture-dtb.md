# GEAkr + PCA Architecture — DTB Style Visual

Date: 2026-04-25
Status: v0.1 visual architecture draft
Style: DTB-inspired, clean enterprise architecture view

## Purpose

Show how GEAkr functions as a portable context pattern that feeds a Personal Cognitive Architecture (PCA), graph intelligence layer, and optional enterprise integration pathway.

This diagram should communicate:

- GEAkr is not a platform by itself
- capture can be mobile, manual, or connector-enabled
- safety controls apply before model/runtime use
- knowledge is stored as atomic, traceable files
- graph intelligence supports search, convergence, conflict detection, and EA decision views
- work use requires approved enterprise runtime and hosting
- later integration with the HC Data Platform is positioned as a maturation path

---

## Visual architecture diagram

```mermaid
flowchart LR

  %% =========================
  %% DTB-style logical zones
  %% =========================

  subgraph Z1[Capture & Intake Layer]
    A1[Mobile Share / Shortcut]
    A2[Manual Folder Input]
    A3[Registered Public Sources]
    A4[Approved Internal Sources]
  end

  subgraph Z2[GEAkr Context Pattern]
    B1[sources.txt]
    B2[briefing.md]
    B3[notes.md]
    B4[files_index.md]
    B5[GEAKR_INSTRUCTIONS.md]
  end

  subgraph Z3[Safety & Runtime Policy Layer]
    C1[Sanitization Gate\nv0.1 regex risk gate]
    C2[Runtime Mode Check\nmetadata_only / local_only / external_public / approved_enterprise]
    C3[Data Sharing Boundary\nendpoint + payload + hosting + account terms]
  end

  subgraph Z4[Extraction & Knowledge Layer]
    D1[Structured Output\nJSON Schema]
    D2[Knowledge Renderer\nMarkdown]
    D3[Atomic Knowledge Files\n/knowledge/*.md]
    D4[Graph Fragments\n/graph/fragments/*.json]
  end

  subgraph Z5[Version & Control Layer]
    E1[GitHub Repository]
    E2[Branches\nmain / work / personal-pca]
    E3[Pull Requests\nPromotion / Review]
    E4[CI/CD Validation\nfuture]
  end

  subgraph Z6[Graph Intelligence Layer]
    F1[Graph Extractor]
    F2[Search Index]
    F3[Cytoscape Viewer]
    F4[Convergence + Confidence]
    F5[Conflict Detection]
    F6[Chad Mode\nEA Decision View]
  end

  subgraph Z7[PCA Reasoning Layer]
    G1[Immediate PCA Response\noptional]
    G2[Reconciliation]
    G3[Decision Support]
    G4[Promote / Keep / Discard]
  end

  subgraph Z8[Enterprise Alignment Path]
    H1[Approved Runtime\nAzure / OpenLM / Org Endpoint]
    H2[EA / TPO Review]
    H3[HC Data Platform Alignment]
    H4[Governance Artifacts\nAIA / ARB / Register Inputs]
  end

  %% =========================
  %% Flow relationships
  %% =========================

  A1 --> B1
  A2 --> B2
  A3 --> B1
  A4 --> B1

  B1 --> C1
  B2 --> C1
  B3 --> C1
  B4 --> C1
  B5 --> C2

  C1 --> C2
  C2 --> C3
  C3 --> D1

  D1 --> D2
  D2 --> D3
  D1 --> D4

  D3 --> E1
  D4 --> E1
  E1 --> E2
  E2 --> E3
  E3 --> E4

  E1 --> F1
  D4 --> F1
  F1 --> F2
  F1 --> F3
  F1 --> F4
  F4 --> F5
  F4 --> F6
  F5 --> F6

  D3 --> G1
  F4 --> G2
  F5 --> G2
  G2 --> G3
  G3 --> G4
  G4 --> E3

  F6 --> H2
  E4 --> H2
  H2 --> H1
  H1 --> H3
  H2 --> H4
  H3 --> H4

  %% =========================
  %% Styling — DTB-inspired
  %% =========================

  classDef capture fill:#EAF3F4,stroke:#2F6F73,stroke-width:1px,color:#1F2A30;
  classDef context fill:#F4F6F7,stroke:#3D8589,stroke-width:1px,color:#1F2A30;
  classDef safety fill:#FFF6E5,stroke:#C98A00,stroke-width:1px,color:#1F2A30;
  classDef knowledge fill:#E8F4EA,stroke:#4B8B57,stroke-width:1px,color:#1F2A30;
  classDef control fill:#EDEAF6,stroke:#5B4A8B,stroke-width:1px,color:#1F2A30;
  classDef graph fill:#EAF0FA,stroke:#3F6FA3,stroke-width:1px,color:#1F2A30;
  classDef pca fill:#F2EAF6,stroke:#7A4A8B,stroke-width:1px,color:#1F2A30;
  classDef enterprise fill:#F1F7E8,stroke:#6A8B2F,stroke-width:1px,color:#1F2A30;

  class A1,A2,A3,A4 capture;
  class B1,B2,B3,B4,B5 context;
  class C1,C2,C3 safety;
  class D1,D2,D3,D4 knowledge;
  class E1,E2,E3,E4 control;
  class F1,F2,F3,F4,F5,F6 graph;
  class G1,G2,G3,G4 pca;
  class H1,H2,H3,H4 enterprise;
```

---

## Executive reading guide

### 1. GEAkr starts simple

The lower-friction entry point is still a simple folder and a few project files.

### 2. Safety is explicit

Before any model call, the system applies sanitization and runtime policy checks.

### 3. Knowledge is atomic and traceable

Each captured source becomes a separate knowledge file and graph fragment.

### 4. Intelligence accumulates

The graph layer builds search, convergence, confidence, conflict detection, and EA-focused decision views.

### 5. PCA is optional but powerful

Personal reasoning can synthesize, reconcile, and support decisions without contaminating shared or work branches.

### 6. Work use requires approved runtime

For work material, the capture backend should run only in an approved organizational environment.

### 7. HC Data Platform integration is a maturity path

GEAkr prepares context and knowledge so mature use cases can align with the HC Data Platform and governance processes.

---

## One-line positioning

GEAkr provides the structured context and knowledge-preparation layer that turns scattered sources into traceable knowledge, graph intelligence, and reviewable decision support while preserving clear boundaries between personal, public, and work use.
