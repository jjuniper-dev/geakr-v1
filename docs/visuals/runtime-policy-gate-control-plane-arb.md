# Runtime Policy Gate — ARB Control Plane View

Date: 2026-04-25
Status: v0.1 ARB diagram
Audience: ARB / EA / TPO / OCDO
Related:
- `docs/security/runtime-policy-gate-spec.md`
- `apps/mobile-capture/policy/gate.js`
- `QUICKSTART.md`

---

## Purpose

Show the Runtime Policy Gate as the control plane that governs whether captured content may be stored locally, processed by a local model, sent to an external API, or routed to an approved enterprise endpoint.

The key message for ARB:

> External model use is not a default behavior. Every outbound model call is evaluated against source classification, sanitizer findings, runtime mode, hosting verification, and explicit allowed operations before execution.

---

## ARB control plane diagram

```mermaid
flowchart LR

  %% ==============================
  %% Intake / data plane
  %% ==============================

  subgraph Z1[Capture / Data Plane]
    A1[URL / Source Capture]
    A2[Title + User Notes]
    A3[Optional Page Text Fetch]
  end

  subgraph Z2[Pre-Gate Signals]
    B1[Source Classification\npublic / unknown / work / personal]
    B2[Sanitizer\nregex risk signals]
    B3[Runtime Configuration\nmode + hosting + endpoint]
  end

  %% ==============================
  %% Control plane
  %% ==============================

  subgraph CP[Runtime Policy Gate — Control Plane]
    C1[Mode Ceiling\ndefault = metadata_only]
    C2[Hosting Verification\napproved_enterprise requires trusted hosting]
    C3[Severity Rules\nhigh = block\nmedium = external controls]
    C4[Override Rules\ndowngrade only\nper-capture\nreason required]
    C5[Decision Engine\nALLOW / BLOCK\nallowedOperations[]]
    C6[Audit Entry\nJSONL decision log]
  end

  %% ==============================
  %% Execution outcomes
  %% ==============================

  subgraph Z3[Allowed Operations]
    D1[Store Metadata Only]
    D2[Store Local Content]
    D3[Invoke Local LLM]
    D4[Invoke External API\npublic only]
    D5[Invoke Enterprise Endpoint\napproved hosting only]
  end

  subgraph Z4[Blocked / Safe Fallback]
    E1[No Model Call]
    E2[No External Transmission]
    E3[Return Reason to User]
    E4[Persist Audit Record]
  end

  subgraph Z5[Governance Consumers]
    F1[EA / TPO Review]
    F2[Security / Privacy Review]
    F3[AIA / ARB Evidence]
    F4[Operational Audit Trail]
  end

  %% ==============================
  %% Flow
  %% ==============================

  A1 --> A2
  A1 --> A3
  A1 --> B1
  A2 --> B1
  A3 --> B2
  B1 --> C1
  B2 --> C3
  B3 --> C1
  B3 --> C2

  C1 --> C5
  C2 --> C5
  C3 --> C5
  C4 --> C5
  C5 --> C6

  C5 -->|allowedOperations includes store_metadata| D1
  C5 -->|allowedOperations includes store_local_content| D2
  C5 -->|allowedOperations includes invoke_local_llm| D3
  C5 -->|allowedOperations includes invoke_external_api| D4
  C5 -->|allowedOperations includes invoke_enterprise_endpoint| D5

  C5 -->|BLOCK| E1
  C5 -->|BLOCK| E2
  C5 -->|BLOCK| E3
  C6 --> E4

  C6 --> F1
  C6 --> F2
  C6 --> F3
  C6 --> F4

  %% ==============================
  %% Styling — DTB-inspired
  %% ==============================

  classDef intake fill:#EAF3F4,stroke:#2F6F73,stroke-width:1px,color:#1F2A30;
  classDef signal fill:#F4F6F7,stroke:#3D8589,stroke-width:1px,color:#1F2A30;
  classDef control fill:#FFF6E5,stroke:#C98A00,stroke-width:2px,color:#1F2A30;
  classDef allow fill:#E8F4EA,stroke:#4B8B57,stroke-width:1px,color:#1F2A30;
  classDef block fill:#FDECEC,stroke:#A33F3F,stroke-width:1px,color:#1F2A30;
  classDef gov fill:#EDEAF6,stroke:#5B4A8B,stroke-width:1px,color:#1F2A30;

  class A1,A2,A3 intake;
  class B1,B2,B3 signal;
  class C1,C2,C3,C4,C5,C6 control;
  class D1,D2,D3,D4,D5 allow;
  class E1,E2,E3,E4 block;
  class F1,F2,F3,F4 gov;
```

---

## Executive interpretation

### 1. The gate is the enforcement point

The Runtime Policy Gate is the mandatory control plane between captured content and any model execution or outbound transmission.

### 2. The sanitizer is not the security boundary

The sanitizer generates risk signals. The gate enforces policy using those signals plus runtime mode, source classification, and hosting verification.

### 3. `ALLOW` does not mean unrestricted execution

The gate returns explicit `allowedOperations[]`. Callers must check the operation list before executing anything.

Examples:

```text
local_only → store_metadata + store_local_content
local_llm → store_metadata + store_local_content + invoke_local_llm
external_api_public_only → invoke_external_api only if source is public and sanitizer permits
approved_enterprise → invoke_enterprise_endpoint only if hosting is verified
```

### 4. Blocked captures still produce value

A blocked capture does not disappear. The system can still store metadata, return a reason to the user, and write an audit entry.

### 5. Auditability is built into the decision

Every gate decision produces a structured audit entry with source classification, runtime mode, hosting, endpoint, sanitizer findings, decision reason, and allowed operations.

---

## ARB narrative

The Runtime Policy Gate converts AI-use guidance into enforceable runtime behavior. It ensures that no external API call, cross-context promotion, or model invocation occurs solely because a user or developer triggered a capture. The gate evaluates the source, runtime, hosting, sanitizer findings, and override semantics, then returns a constrained execution contract. This supports safer experimentation while preserving an enterprise path for approved runtime use.

---

## One-slide title suggestion

**Runtime Policy Gate: Control Plane for Safe AI Capture and Execution**

---

## Key ARB talking points

- Default mode is `metadata_only`.
- Unknown sources do not go to external APIs.
- Work sources cannot use personal or public external API paths.
- High-severity sanitizer findings always block.
- Medium findings are allowed only in local modes or controlled public external cases with explicit override.
- Enterprise model use requires approved hosting verification.
- The caller must check `allowedOperations[]`, not just `decision`.
- Every decision is auditable.
