# SDK Options for GEAkr / PCA / Graph Integration

Date: 2026-04-25
Status: v0.1 guidance

## Purpose

Identify SDKs and APIs that can support the GEAkr capture, knowledge extraction, graph, search, skills, MCP, and enterprise-integration roadmap.

---

## 1. GitHub SDK / API

Use for:
- read/write knowledge files
- create branches
- create pull requests
- version control
- promotion workflows
- CI/CD integration
- graph artifact publishing

Recommended options:
- GitHub REST API
- Octokit.js for Node.js
- GitHub Actions SDK/toolkit for CI/CD

GEAkr fit:
- GitHub = version/control mechanism
- PRs = review/promotion mechanism
- Actions = validation/automation mechanism

---

## 2. OpenAI / Azure OpenAI SDK

Use for:
- source extraction
- knowledge-file generation
- PCA immediate response
- skills execution
- summarization
- classification/tagging
- later embeddings/vector search

Recommended options:
- OpenAI JavaScript/TypeScript SDK
- Azure OpenAI SDK or Azure AI Inference SDK
- REST API for minimal prototype

GEAkr fit:
- LLM runtime = extraction, synthesis, decision-support engine
- Azure OpenAI/OpenLM-style runtime = controlled work/enterprise runtime

---

## 3. Microsoft Graph SDK

Use for work/enterprise scenarios:
- SharePoint file access
- OneDrive file access
- Teams/Planner integration
- M365 context retrieval where approved

Recommended options:
- Microsoft Graph JavaScript SDK
- Graph REST API

GEAkr fit:
- Graph/SharePoint = access mechanism for approved work folders
- should only be used in approved environments for work material

---

## 4. Azure SDKs

Use for controlled deployment:
- Azure App Service / Functions hosting
- Key Vault secrets management
- Storage Account / Blob storage
- Application Insights / Monitor
- Managed Identity

Recommended options:
- Azure SDK for JavaScript
- Azure Functions SDK
- Azure Identity SDK
- Azure Key Vault SDK
- Azure Monitor / Application Insights

GEAkr fit:
- Azure = approved runtime and operations layer for work use

---

## 5. MCP SDKs

Use for:
- tool access abstraction
- controlled file access
- GitHub/SharePoint/Azure tools
- skill-to-tool routing

Recommended options:
- Model Context Protocol TypeScript SDK
- MCP server wrappers for GitHub, filesystem, Azure, SharePoint where available/approved

GEAkr fit:
- MCP = access mechanism
- Skills = capability/task patterns
- GEAkr = context pattern

---

## 6. Search / Vector SDKs

Use for:
- semantic search over knowledge files
- retrieval across branches
- concept discovery
- graph enrichment

Recommended options:
- Azure AI Search SDK
- local embeddings + vector store for personal/PCA
- OpenAI/Azure embeddings endpoint
- SQLite/DuckDB for lightweight local indexing

GEAkr fit:
- current v0.1 search is lexical
- next stage can add embeddings behind the same `search-index.json` contract

---

## 7. Graph Visualization SDKs

Use for:
- browser graph exploration
- smart search and node details
- branch filtering
- conflict visualization

Recommended options:
- Cytoscape.js
- D3.js
- Sigma.js

GEAkr fit:
- current viewer uses Cytoscape.js
- future viewers can load the same `graph.json` and `search-index.json`

---

## 8. Data Platform Integration SDKs

Future work use:
- metadata/catalog integration
- lineage linkage
- data product context
- governed retrieval

Potential options depend on HC platform choices:
- Microsoft Purview APIs
- Microsoft Fabric APIs
- Azure AI Search
- Databricks SDK/API if relevant

GEAkr fit:
- GEAkr prepares context upstream
- platform APIs become integration points once a use case matures

---

## Recommended prototype stack

Personal prototype:
- Node.js
- Express
- GitHub REST API or Octokit
- OpenAI SDK/REST
- Cytoscape.js
- local JSON graph files

Work/enterprise target:
- Azure Functions or App Service
- Managed Identity
- Key Vault
- Azure OpenAI / approved model endpoint
- Microsoft Graph for SharePoint only where approved
- GitHub Enterprise or approved repo hosting
- Azure Monitor / Application Insights

---

## Core rule

SDKs should not define the architecture. The architecture remains:

- GEAkr = context pattern
- Projects = persistence mechanism
- Connectors/MCP = access mechanism
- GitHub = version/control mechanism
- CI/CD = validation/automation mechanism
- Azure/OpenLM-style runtime = controlled execution mechanism
- HC Data Platform = governed data/platform integration mechanism
