# AI Public Intelligence Baseline

Date: 2026-04-25
Status: v0.1 draft
Scope: Public information from Government of Canada and ISED sources to inform GEAkr, enterprise architecture, AI governance, and project-level AI adoption discussions.

## Purpose

This file captures public-source intelligence on the Canadian and Government of Canada AI ecosystem. It is intended to help shape GEAkr and related architecture/governance work by separating:

- source facts
- architectural interpretation
- implications for GEAkr
- open checks for future validation

GEAkr should treat this file as an interpreted intelligence note, not as a substitute for the original sources.

---

## Executive signal

Canada's public AI direction is moving from isolated experimentation toward enterprise-grade AI adoption. The public strategy stack now includes:

1. national AI ecosystem development
2. sovereign AI compute investment
3. federal responsible AI governance
4. AI Strategy for the Federal Public Service 2025-2027
5. transparency mechanisms such as the GC AI Register

For enterprise architecture, the important shift is that AI is no longer framed only as pilots or innovation experiments. It is increasingly framed as shared capacity, governed platforms, accountable usage, workforce readiness, and measurable public value.

---

## 1. National AI ecosystem

### Source facts

ISED describes Canada's AI ecosystem as including Budget 2024 measures to secure Canada's AI advantage, including:

- $2B for AI compute access and sovereign compute strategy
- $200M through regional development agencies to support AI start-ups
- $100M for NRC's AI Assist Program to help SMEs build and deploy AI solutions
- $50M through the Sectoral Workforce Solutions Program for workers affected by AI
- $50M for a Canadian AI Safety Institute
- $3.5M to advance Canada's role in the Global Partnership on Artificial Intelligence (GPAI)

### Architecture interpretation

This represents a national AI capability stack:

Research and talent -> compute capacity -> commercialization -> safety and trust -> international alignment

### GEAkr implication

GEAkr can help project teams consume this ecosystem by giving them a simple way to register sources, structure project context, and generate traceable AI-assisted outputs.

---

## 2. Sovereign AI compute

### Source facts

The Canadian Sovereign AI Compute Strategy is built around strategic investments in public and commercial infrastructure to increase domestic compute capacity, support the AI ecosystem, and drive economic growth.

Budget 2024 announced $2B over five years, starting in 2024-25, for initiatives to give Canadian researchers and AI companies access to globally competitive compute tools.

### Architecture interpretation

The compute strategy addresses the platform substrate: where AI workloads can run, who controls the infrastructure, and whether Canadian innovators have access to domestic compute capacity.

### GEAkr implication

GEAkr is not a compute platform. It is a context pattern that can sit above any approved compute or AI service. The compute strategy reinforces the need to separate:

- context pattern
- persistence mechanism
- access mechanism
- compute/runtime mechanism
- validation/automation mechanism

---

## 3. Responsible AI governance

### Source facts

The Government of Canada's responsible AI hub describes AI in government as governed by clear values, ethics, and laws. It links to key guidance and instruments, including:

- Guide on the Use of Generative AI
- Directive on Automated Decision-Making
- Algorithmic Impact Assessment Tool
- scope guidance for the Directive
- peer review guidance
- Microsoft Copilot for Work policy implementation notice
- AI Strategy for the Federal Public Service 2025-2027
- departmental AI responsibilities
- GC AI Register

The AIA is described as a mandatory risk assessment tool supporting the Directive on Automated Decision-Making. It uses 65 risk questions and 41 mitigation questions to determine impact level. Impact levels range from Level I to Level IV.

The scope guide states that the Directive applies to automated decision systems that fully or partially automate administrative decisions. It also clarifies that not all AI in the federal public service is in scope of the Directive; AI not used for administrative decisions is still subject to other requirements such as security, privacy, and information management.

Peer review guidance states that projects assigned impact level 2 or higher are subject to a peer review requirement before production.

### Architecture interpretation

For IT and EA work, the Directive and AIA translate into non-functional and lifecycle requirements:

- risk classification
- documentation
- transparency
- explainability
- human oversight
- legal/privacy/security review
- peer review for higher-impact systems
- publication and lifecycle updates where required

### GEAkr implication

GEAkr does not replace AIA, governance, privacy review, security review, or legal review. It can support those processes by improving source traceability, bounded context, documented assumptions, and human-reviewable outputs.

---

## 4. AI Strategy for the Federal Public Service 2025-2027

### Source facts

The AI Strategy for the Federal Public Service 2025-2027 presents a vision to serve Canadians better through responsible AI adoption. Public strategy pages include overview, priority areas, expectations for federal organizations, relevant strategies and policy, and engagement/consultation.

The responsible AI hub describes the strategy as outlining how the federal government will use AI to enhance efficiencies, boost research, and improve digital services.

### Architecture interpretation

The strategy represents a shift from isolated experimentation to coordinated adoption. Key architectural themes include:

- shared or common capacity
- responsible AI controls
- workforce readiness
- data stewardship
- transparency and public trust
- reduced duplication across institutions

### GEAkr implication

GEAkr can act as a low-friction project-level pattern for the strategy's implementation layer. It helps teams start with bounded context and source discipline before moving into more advanced retrieval, platform, or governance workflows.

---

## 5. GC AI Register and transparency

### Source facts

The Government of Canada published a minimum viable product version of the GC AI Register on November 28, 2025. The Register collects information about GC AI systems and was assembled from existing sources including AIAs, ATIP requests, parliamentary responses, Personal Information Banks, and the GC Service Inventory.

The launch release states that the Register supports planning, reduces duplication, and helps departments identify opportunities to work more efficiently.

### Architecture interpretation

The AI Register shows that AI system inventory, traceability, and transparency are becoming enterprise concerns rather than optional project documentation.

### GEAkr implication

GEAkr can help create upstream discipline before systems reach formal registers or governance gates. A project folder can capture:

- source registry
- briefing notes
- assumptions
- generated outputs
- files index
- decision context

This does not replace official registers, but it helps create better raw material for them.

---

## 6. Working architecture model

The public-source AI landscape can be understood as a layered model:

```text
National AI ecosystem
        ↓
Sovereign / shared compute capacity
        ↓
Common AI platforms and approved tools
        ↓
Departmental use cases and applications
        ↓
Responsible AI governance and lifecycle controls
        ↓
Transparency, auditability, and public trust
```

GEAkr insertion point:

```text
Sources + files + notes
        ↓
GEAkr bounded project context
        ↓
AI-assisted analysis and artifact generation
        ↓
Human review and governance handoff
```

---

## 7. Concept map

- GEAkr = context pattern
- Projects = persistence mechanism
- Connectors = access mechanism
- GitHub = version/control mechanism
- CI/CD = validation/automation mechanism
- Compute platforms = runtime mechanism
- AIA / Directive / policy = governance mechanism

---

## 8. Implications for GEAkr v1

GEAkr should remain deliberately simple at Level 0:

- folder structure
- source registry
- working notes
- briefing file
- file index
- instruction file

Advanced modes can layer on:

- GitHub version control
- pull request review
- CI validation
- link checks
- schema checks
- metadata extraction
- source status flags
- governance mapping

Recommended future CI/CD checks:

- required Level 0 files exist
- sources.txt is present and not empty
- files_index.md matches actual folder contents
- briefing.md has a project summary
- no obvious secrets or restricted markers are present
- public URLs are reachable
- source entries include title, URL, owner/source, and last checked date where practical

---

## 9. Open checks

The following should be verified from primary sources before using this intelligence file in a formal briefing:

- exact wording and current priority areas in the AI Strategy for the Federal Public Service 2025-2027
- current funding details for sovereign compute and AI ecosystem measures
- current AIA scoring thresholds and Directive requirements
- current status and maturity of the GC AI Register
- current departmental guidance for approved generative AI tools
- whether specific tools or connectors are approved for the sensitivity of the information involved

---

## 10. Registered public sources

- Government of Canada Responsible Use of AI hub: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai.html
- AI Strategy for the Federal Public Service 2025-2027 overview: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/gc-ai-strategy-foreword.html
- AI Strategy priority areas: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/gc-ai-strategy-priority-areas.html
- AI Strategy expectations for federal organizations: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/gc-ai-strategy-expectations-federal-organizations.html
- AI Strategy relevant strategies and policy: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/gc-ai-strategy-relevant-strategies-policy.html
- Algorithmic Impact Assessment tool: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/algorithmic-impact-assessment.html
- Scope guide for the Directive on Automated Decision-Making: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/guide-scope-directive-automated-decision-making.html
- Guide to Peer Review of Automated Decision Systems: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/guide-peer-review-automated-decision-systems.html
- Progress on AI in government / GC AI Register: https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/progress.html
- ISED Artificial Intelligence Ecosystem: https://ised-isde.canada.ca/site/ised/en/artificial-intelligence-ecosystem
- Canadian Sovereign AI Compute Strategy: https://ised-isde.canada.ca/site/ised/en/canadian-sovereign-ai-compute-strategy
