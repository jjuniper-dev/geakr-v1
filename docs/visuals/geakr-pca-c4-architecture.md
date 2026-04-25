# GEAkr + PCA Architecture — C4 Model

Date: 2026-04-25
Status: v0.1 C4 architecture draft
Scope: GEAkr / PCA / Graph Intelligence / Enterprise alignment

## Purpose

This document describes the GEAkr + PCA system using a C4-style architecture model:

1. System Context
2. Container View
3. Component View
4. Deployment View

The goal is to complement the DTB-style layered architecture diagram with a more software-architecture-oriented view.

---

## C4 Level 1 — System Context

```mermaid
flowchart LR

  User[User / Knowledge Worker]
  EA[EA / TPO Reviewer]
  PCA[Personal Cognitive Architecture]
  GEAkr[GEAkr Context + Knowledge System]
  GitHub[GitHub Repository]
  LLM[Model Runtime\nOpenAI / Azure OpenAI / Local LLM]
  HCData[HC Data Platform\nFuture Integration]
  Gov[Governance Processes\nAIA / ARB / Review / Register]

  User -->|captures URLs, notes, sources| GEAkr
  User -->|uses personal synthesis| PCA
  PCA -->|feeds provisional reasoning| GEAkr
  EA -->|reviews decision signals| GEAkr

  GEAkr -->|stores versioned knowledge, graph files| GitHub
  GEAkr -->|optional structured extraction| LLM
  GEAkr -->|matured context / metadata| HCData
  GEAkr -->|reviewable artifacts| Gov
  EA -->|governance feedback| Gov

  classDef person fill:#F4F6F7,stroke:#2F6F73,color:#1F2A30;
  classDef system fill:#EAF3F4,stroke:#3D8589,color:#1F2A30;
  classDef external fill:#FFF6E5,stroke:#C98A00,color:#1F2A30;
  classDef future fill:#F1F7E8,stroke:#6A8B2F,color:#1F2A30;

  class User,EA person;
  class GEAkr,PCA system;
  class GitHub,LLM,Gov external;
  class HCData future;
```

### Context notes

- GEAkr is the central context and knowledge-preparation system.
- PCA is a personal reasoning layer that may feed provisional synthesis into GEAkr.
- GitHub provides version control, branching, PRs, traceability, and future CI/CD.
- LLM runtime is optional and depends on runtime/data-sharing policy.
- HC Data Platform integration is a future maturity path, not a current dependency.

---

## C4 Level 2 — Container View

```mermaid
flowchart TB

  subgraph Client[Client / Interaction Layer]
    Shortcut[iPhone Shortcut / Share Sheet]
    WebUI[Mobile Capture Web UI]
    GraphUI[Cytoscape Graph Viewer]
  end

  subgraph CaptureBackend[Capture Backend]
    Fetcher[URL Fetcher + HTML Parser]
    Sanitizer[Sanitization Gate\nv0.1]
    RuntimePolicy[Runtime Policy Check]
    Extractor[Structured Extraction Service\nJSON Schema]
    Renderer[Markdown Renderer]
    GraphFragmenter[Graph Fragment Builder]
  end

  subgraph Repo[GitHub Repository]
    Knowledge[Atomic Knowledge Files\n/knowledge/*.md]
    Fragments[Graph Fragments\n/graph/fragments/*.json]
    Docs[Docs + ADRs + Policies]
    Scripts[Graph + Analysis Scripts]
  end

  subgraph Intelligence[Graph Intelligence Layer]
    GraphBuilder[Graph Extractor / Merger]
    SearchIndex[Search Index Builder]
    Convergence[Convergence + Confidence Analyzer]
    Conflict[Conflict Detector]
    Chad[Chad Mode EA View]
  end

  subgraph ExternalRuntime[Runtime / Tooling]
    Model[LLM Runtime\nOpenAI / Azure / Local]
    GitHubAPI[GitHub API]
  end

  Shortcut --> CaptureBackend
  WebUI --> CaptureBackend

  Fetcher --> Sanitizer
  Sanitizer --> RuntimePolicy
  RuntimePolicy --> Extractor
  Extractor --> Model
  Extractor --> Renderer
  Extractor --> GraphFragmenter

  Renderer -->|write optional| GitHubAPI
  GraphFragmenter -->|write optional| GitHubAPI
  GitHubAPI --> Knowledge
  GitHubAPI --> Fragments

  Knowledge --> GraphBuilder
  Fragments --> GraphBuilder
  Docs --> GraphBuilder
  GraphBuilder --> SearchIndex
  GraphBuilder --> Convergence
  Convergence --> Conflict
  Convergence --> Chad
  Conflict --> Chad
  SearchIndex --> GraphUI
  Chad --> GraphUI

  classDef client fill:#EAF3F4,stroke:#2F6F73,color:#1F2A30;
  classDef backend fill:#FFF6E5,stroke:#C98A00,color:#1F2A30;
  classDef repo fill:#EDEAF6,stroke:#5B4A8B,color:#1F2A30;
  classDef intel fill:#EAF0FA,stroke:#3F6FA3,color:#1F2A30;
  classDef runtime fill:#F1F7E8,stroke:#6A8B2F,color:#1F2A30;

  class Shortcut,WebUI,GraphUI client;
  class Fetcher,Sanitizer,RuntimePolicy,Extractor,Renderer,GraphFragmenter backend;
  class Knowledge,Fragments,Docs,Scripts repo;
  class GraphBuilder,SearchIndex,Convergence,Conflict,Chad intel;
  class Model,GitHubAPI runtime;
```

### Container notes

- The mobile capture backend is the only part that needs server-side hosting for URL fetch, LLM calls, and GitHub write-back.
- The graph viewer is static and can run locally or from GitHub Pages.
- The graph intelligence layer can run locally first, then later through GitHub Actions.
- Work use requires approved runtime and approved hosting.

---

## C4 Level 3 — Component View: Capture Backend

```mermaid
flowchart LR

  API[POST /extract]
  Validate[Request Validator]
  Fetch[URL Fetcher]
  Parse[HTML Parser\nCheerio]
  Sanitize[Sanitizer\nRegex Risk Gate]
  Policy[Runtime Policy Gate\nplanned]
  Schema[JSON Schema Extractor]
  LLM[LLM SDK Client]
  Render[Knowledge Markdown Renderer]
  Graph[Graph Fragment Builder]
  GitHub[GitHub Writer]
  Response[API Response]

  API --> Validate
  Validate --> Fetch
  Fetch --> Parse
  Parse --> Sanitize
  Sanitize --> Policy
  Policy --> Schema
  Schema --> LLM
  LLM --> Render
  LLM --> Graph
  Render --> GitHub
  Graph --> GitHub
  Render --> Response
  Graph --> Response

  classDef api fill:#EAF3F4,stroke:#2F6F73,color:#1F2A30;
  classDef safety fill:#FFF6E5,stroke:#C98A00,color:#1F2A30;
  classDef ai fill:#E8F4EA,stroke:#4B8B57,color:#1F2A30;
  classDef store fill:#EDEAF6,stroke:#5B4A8B,color:#1F2A30;

  class API,Validate,Fetch,Parse api;
  class Sanitize,Policy safety;
  class Schema,LLM,Render,Graph ai;
  class GitHub,Response store;
```

### Component notes

Current implemented components:

- URL fetcher
- Cheerio-based text extraction
- sanitization gate
- OpenAI SDK model call
- JSON-schema structured output
- deterministic Markdown renderer
- graph fragment builder
- optional GitHub write-back

Planned component:

- full runtime policy gate by branch/runtime mode

---

## C4 Level 3 — Component View: Graph Intelligence

```mermaid
flowchart LR

  Files[Markdown Knowledge + Docs]
  Fragments[Graph Fragments]
  Extract[extract-graph.js]
  GraphJSON[graph.json\nnodes.json\nedges.json]
  Search[build-search-index.js]
  Index[search-index.json]
  Conv[analyze-convergence.js]
  Conf[confidence.json\nconvergence.json]
  Conflict[detect-conflicts.js]
  Conflicts[conflicts.json\nconflict-report.md]
  Chad[chad-view.js]
  ChadOut[chad-view.json\nchad-report.md]
  Viewer[view.html\nCytoscape UI]

  Files --> Extract
  Fragments --> Extract
  Extract --> GraphJSON
  GraphJSON --> Search
  Search --> Index
  GraphJSON --> Conv
  Conv --> Conf
  GraphJSON --> Conflict
  Conf --> Conflict
  Conflict --> Conflicts
  GraphJSON --> Chad
  Conf --> Chad
  Conflicts --> Chad
  Chad --> ChadOut
  GraphJSON --> Viewer
  Index --> Viewer
  ChadOut --> Viewer

  classDef input fill:#F4F6F7,stroke:#2F6F73,color:#1F2A30;
  classDef script fill:#EAF0FA,stroke:#3F6FA3,color:#1F2A30;
  classDef output fill:#E8F4EA,stroke:#4B8B57,color:#1F2A30;
  classDef ui fill:#FFF6E5,stroke:#C98A00,color:#1F2A30;

  class Files,Fragments input;
  class Extract,Search,Conv,Conflict,Chad script;
  class GraphJSON,Index,Conf,Conflicts,ChadOut output;
  class Viewer ui;
```

### Graph notes

The graph layer supports:

- node/edge extraction
- searchable graph interface
- concept convergence
- confidence scoring
- conflict detection
- Chad Mode EA decision filtering

---

## C4 Level 4 — Deployment View: Personal Prototype

```mermaid
flowchart TB

  Phone[iPhone\nShortcut / Browser Share]
  PersonalBackend[Personal Capture Backend\nReplit / Local / Equivalent]
  OpenAI[External Model API\nPublic/non-sensitive only]
  PersonalGitHub[Personal GitHub Repo]
  LocalGraph[Local Browser\nGraph Viewer]

  Phone -->|URL capture| PersonalBackend
  PersonalBackend -->|sanitized public payload| OpenAI
  PersonalBackend -->|knowledge + graph fragment| PersonalGitHub
  PersonalGitHub -->|graph JSON files| LocalGraph

  classDef device fill:#EAF3F4,stroke:#2F6F73,color:#1F2A30;
  classDef backend fill:#FFF6E5,stroke:#C98A00,color:#1F2A30;
  classDef external fill:#FDECEC,stroke:#A33F3F,color:#1F2A30;
  classDef repo fill:#EDEAF6,stroke:#5B4A8B,color:#1F2A30;

  class Phone,LocalGraph device;
  class PersonalBackend backend;
  class OpenAI external;
  class PersonalGitHub repo;
```

### Personal deployment notes

- Replit or equivalent is acceptable only for personal experimentation with public or non-sensitive sources.
- External API calls send payloads to the configured provider endpoint.
- Sanitization reduces risk but is not a security boundary.

---

## C4 Level 4 — Deployment View: Work / Enterprise Target

```mermaid
flowchart TB

  UserDevice[Approved User Device]
  ApprovedFrontend[Approved Frontend\nShortcut / Web UI / Internal App]
  AzureBackend[Approved Backend\nAzure Functions / App Service]
  KeyVault[Key Vault]
  ApprovedModel[Approved Model Runtime\nAzure OpenAI / OpenLM / Org Endpoint]
  ApprovedRepo[Approved Repo / Storage]
  Monitoring[Logging + Monitoring\nApp Insights / SIEM]
  HCData[HC Data Platform\nFuture Alignment]
  Governance[EA / TPO / AIA / ARB]

  UserDevice --> ApprovedFrontend
  ApprovedFrontend --> AzureBackend
  AzureBackend --> KeyVault
  AzureBackend --> ApprovedModel
  AzureBackend --> ApprovedRepo
  AzureBackend --> Monitoring
  ApprovedRepo --> HCData
  ApprovedRepo --> Governance
  HCData --> Governance
  Monitoring --> Governance

  classDef device fill:#EAF3F4,stroke:#2F6F73,color:#1F2A30;
  classDef approved fill:#E8F4EA,stroke:#4B8B57,color:#1F2A30;
  classDef control fill:#EDEAF6,stroke:#5B4A8B,color:#1F2A30;
  classDef governance fill:#FFF6E5,stroke:#C98A00,color:#1F2A30;

  class UserDevice,ApprovedFrontend device;
  class AzureBackend,ApprovedModel,ApprovedRepo,HCData approved;
  class KeyVault,Monitoring control;
  class Governance governance;
```

### Enterprise deployment notes

- Replit or equivalent should not be used for work material unless explicitly approved.
- Work use requires approved hosting, approved model runtime, approved storage, identity, secrets management, logging, and governance alignment.
- GEAkr remains a context pattern; the deployment environment determines whether a specific use is acceptable.

---

## Key architectural decisions reflected in C4 model

1. GEAkr is a context pattern, not a platform.
2. Capture backend is optional and environment-specific.
3. Model runtime is optional and policy-dependent.
4. Sanitization happens before model calls but is not a security boundary.
5. Structured output makes knowledge files deterministic and graphable.
6. GitHub provides version/control, not privacy assurance by itself.
7. Public, work, and personal/PCA knowledge remain logically separated.
8. Graph intelligence is an overlay, not a permission model.
9. Work use requires approved enterprise runtime and storage.
10. HC Data Platform integration is a maturity path for governed use cases.

---

## One-line C4 summary

GEAkr captures and structures project context into versioned knowledge and graph intelligence, while separating personal, public, and work boundaries and allowing deployment to range from personal prototype to approved enterprise runtime.
