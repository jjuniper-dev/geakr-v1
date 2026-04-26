# Runtime Policy Gate — Specification

Version: `v0.1.0-spec`
Date: 2026-04-25
Status: Draft for review
Repository: `jjuniper-dev/geakr-v1`
Related: ADR-0002 (proposed), `SAFETY.md`, `apps/mobile-capture/server.js`

-----

## 1. Purpose

The runtime policy gate is a single decision point that sits between captured content and any external transmission or model call. It enforces:

- The configured runtime mode for the current environment
- The classification of the source being captured
- The findings of the sanitizer
- Explicit user overrides, where allowed and audited

It produces an `ALLOW`, `DOWNGRADE`, or `BLOCK` decision with a structured reason and an audit entry.

**One-line guarantee:** no external API call, no cross-context promotion, and no model invocation happens without passing through this gate.

-----

## 2. Where it sits in the pipeline

```text
capture request
      ↓
source classification
      ↓
sanitizer
      ↓
══════════════════════════════
   RUNTIME POLICY GATE
══════════════════════════════
      ↓
[ALLOW]     → model call / extraction / writeback
[DOWNGRADE] → fall through to next-most-restrictive mode, retry gate
[BLOCK]     → store metadata only, write block reason, surface to user
```

The gate is the **last** check before any outbound call. It cannot be bypassed by skipping it; every model-call code path must invoke it.

-----

## 3. Runtime modes

Ordered most restrictive to least.

|Mode                      |Allowed                                                                      |Blocked                                                      |Typical use                                 |
|--------------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------|--------------------------------------------|
|`metadata_only`           |URL, title, user notes saved locally                                         |Any model call. Any external transmission.                   |Default for unknown environments            |
|`local_only`              |Fetched page text saved locally; local file ops                              |All external API calls                                       |Air-gapped review                           |
|`local_llm`               |Local model inference (Ollama, llama.cpp)                                    |All external API calls                                       |PCA on a workstation with local models      |
|`external_api_public_only`|External API call iff source = `public` AND sanitizer passes                 |Any non-public source. Any `high`-severity sanitizer finding.|Personal experimentation with public sources|
|`approved_enterprise`     |Calls to approved enterprise endpoint iff runtime is also in approved hosting|Public OpenAI, personal accounts, non-approved hosting       |HC/PHAC work use                            |

### 3.1 Mode resolution rules

1. **Environment sets the ceiling.** A process starts in a mode. That mode is the maximum permission level for any capture in that process.
1. **Per-capture override can only DOWNGRADE.** A user can opt a single capture into a stricter mode. Never looser.
1. **Default is `metadata_only`.** If the environment does not declare a mode, the gate behaves as `metadata_only`.

### 3.2 Hosting verification for `approved_enterprise`

`approved_enterprise` mode requires hosting verification before the gate evaluates anything else. The `runtime.hosting` value:

- **MUST be injected by a trusted deployment pipeline** (Azure DevOps release variable, GitHub Actions deploy step with OIDC, or equivalent)
- **MUST NOT be user-settable** at runtime — no shell `export`, no config file edit, no UI toggle
- **MUST be validated at gate initialization**, before any decision is made
- **SHOULD be backed by a runtime probe** in v0.2 (managed identity check, instance metadata service, or signed deployment token verification) so the gate does not trust the env var alone

If hosting validation fails at init, the gate forces effective mode to `local_only` and emits a `BLOCK` audit entry on the first attempted external call with `decision_reason: "hosting verification failed"`.

This closes the obvious bypass: `export HOSTING=azure_approved` from a personal laptop.

-----

## 4. Source classifications

|Classification|Definition                                                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------|
|`public`      |Publicly accessible without login or organizational credentials; no PII in URL/title/payload; explicitly tagged or on the allowlist|
|`unknown`     |Default for any source not explicitly classified                                                                                   |
|`work`        |Originates from HC/PHAC, internal SharePoint, internal email, or any UNCLASSIFIED-or-higher organizational system                  |
|`personal`    |Contains identifiable personal context (PCA notes, personal email, personal cloud drive)                                           |

**Default classification: `unknown`.** Promotion to `public` requires explicit tagging at capture time or domain allowlist match.

-----

## 5. Decision matrix

Source × mode → outcome. Assumes sanitizer passes; `high`-severity findings override to BLOCK regardless.

|Source ↓ \ Mode →|`metadata_only`|`local_only`|`local_llm`|`external_api_public_only`|`approved_enterprise` |
|-----------------|---------------|------------|-----------|--------------------------|----------------------|
|`public`         |metadata       |local store |local LLM  |**ALLOW external**        |ALLOW enterprise      |
|`unknown`        |metadata       |local store |local LLM  |BLOCK (classify first)    |BLOCK (classify first)|
|`work`           |metadata       |local store |local LLM  |BLOCK                     |ALLOW enterprise      |
|`personal`       |metadata       |local store |local LLM  |BLOCK                     |BLOCK                 |

-----

## 6. Sanitizer integration

The sanitizer runs **before** the gate. The gate consumes its findings.

|Finding severity                                         |Effect                                                                                                     |
|---------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
|`high` (suspected secret, SIN, credit card, bearer token)|BLOCK in all modes. No override.                                                                           |
|`medium` (email, phone, named individuals)               |BLOCK unless user provides explicit override with reason. In `approved_enterprise`, BLOCK with no override.|
|`low` (URL parameters, generic identifiers)              |Log and allow                                                                                              |
|`none`                                                   |Pass through                                                                                               |

This addresses §20.3 and §20.4 of the onboarding doc — sanitization stays risk-reduction; the gate is what makes it an enforced policy.

-----

## 7. Override semantics

A user override:

- Applies per-capture only, never globally
- Can only DOWNGRADE (e.g., force `metadata_only` on a capture in an `external_api_public_only` environment)
- Can permit a `medium`-severity sanitizer finding **only** in non-enterprise modes
- Cannot upgrade the runtime mode
- Cannot bypass `high`-severity sanitizer findings
- Cannot bypass classification requirements (cannot force `unknown` to behave as `public`)
- Must include a free-text reason, recorded to the audit log

-----

## 8. Audit log schema

Every gate decision writes one entry, regardless of outcome.

```json
{
  "gate_decision_id": "uuid",
  "timestamp": "ISO-8601",
  "capture_id": "uuid",
  "source_url": "string",
  "source_classification": "public | unknown | work | personal",
  "runtime_mode": "metadata_only | local_only | local_llm | external_api_public_only | approved_enterprise",
  "runtime_hosting": "local | replit | azure_approved | other",
  "sanitizer_version": "string",
  "sanitizer_findings": [
    { "category": "string", "severity": "high | medium | low" }
  ],
  "user_override": {
    "applied": "boolean",
    "direction": "downgrade | none",
    "reason": "string"
  },
  "decision": "ALLOW | DOWNGRADE | BLOCK",
  "decision_reason": "string",
  "downgrade_to_mode": "string | null",
  "gate_version": "0.1.0-spec"
}
```

Audit log location: `audit/gate-decisions/YYYY-MM-DD.jsonl` (append-only daily file).

-----

## 9. Contract

```typescript
type RuntimeMode =
  | 'metadata_only'
  | 'local_only'
  | 'local_llm'
  | 'external_api_public_only'
  | 'approved_enterprise';

type SourceClassification = 'public' | 'unknown' | 'work' | 'personal';

type GateInput = {
  source: {
    url: string;
    classification: SourceClassification;
    contextLayer: 'public' | 'work' | 'personal';
  };
  runtime: {
    mode: RuntimeMode;
    hosting: 'local' | 'replit' | 'azure_approved' | 'other';
    endpoint?: string;
  };
  sanitizer: {
    version: string;
    findings: Array<{ category: string; severity: 'high' | 'medium' | 'low' }>;
  };
  userOverride?: {
    targetMode: RuntimeMode;
    reason: string;
  };
};

type GateDecision = {
  decision: 'ALLOW' | 'DOWNGRADE' | 'BLOCK';
  effectiveMode: RuntimeMode;
  reason: string;
  auditEntry: GateAuditEntry;
};

function evaluatePolicyGate(input: GateInput): GateDecision;
```

Note: `contextLayer` is not a Git branch and must not be treated as an access-control boundary. It is a declared knowledge-context label used for policy decisions.

-----

## 10. Implementation layout

```text
apps/mobile-capture/
  policy/
    gate.js              # core evaluatePolicyGate()
    modes.js             # mode definitions, ceiling logic
    classifications.js   # source classification helpers + allowlist
    audit.js             # append to audit log
    overrides.js         # override validation
  server.js              # imports and invokes gate before any model call
```

-----

## 11. Failure modes

|Failure                      |Behavior                                         |
|-----------------------------|-------------------------------------------------|
|Mode unspecified             |Default to `metadata_only`                       |
|Source classification missing|Default to `unknown`                             |
|Hosting cannot be determined |Default to `other` (blocks `approved_enterprise`)|
|Sanitizer did not run        |BLOCK                                            |
|Audit log write fails        |BLOCK; surface error to user                     |
|Gate function throws         |BLOCK; log exception                             |

Default-deny is the rule. Any ambiguity blocks.

-----

## 12. Test cases (must pass before merge)

1. `metadata_only` + any source + any sanitizer state → metadata stored, no model call invoked
1. `external_api_public_only` + `public` + sanitizer pass → ALLOW
1. `external_api_public_only` + `unknown` → BLOCK, reason “classify first”
1. `external_api_public_only` + `public` + `high` finding → BLOCK, no override possible
1. `external_api_public_only` + `public` + `medium` finding + override with reason → ALLOW, audit shows override
1. `approved_enterprise` + `personal` → BLOCK
1. `approved_enterprise` + `work` + hosting=`replit` → BLOCK (hosting fails)
1. `approved_enterprise` + `work` + hosting=`azure_approved` + sanitizer pass → ALLOW
1. User override targeting looser mode than environment → BLOCK, reason “override cannot upgrade”
1. Audit log write fails (disk full) → BLOCK

-----

## 13. Open questions

|#|Question                                                          |Default for v0.1                                                                     |
|-|------------------------------------------------------------------|-------------------------------------------------------------------------------------|
|1|Where is source classification declared?                          |Both: domain allowlist for known-public sources, user-tag for ambiguous cases        |
|2|Who maintains the public-source allowlist?                        |Versioned file `policy/public-allowlist.json` on `main`; PR-gated                    |
|3|How does `approved_enterprise` verify hosting?                    |Environment variable signed by deploy pipeline; v0.2 to add managed identity probe   |
|4|Should the gate emit telemetry beyond the local log?              |Yes for `approved_enterprise` — to Application Insights or Langfuse; deferred to v0.2|
|5|Should `medium` overrides require step-up auth in enterprise mode?|Out of scope for v0.1; flagged for v0.2                                              |

-----

## 14. Tradeoffs flagged

|Tradeoff                                  |Choice                                  |Cost                                                                                |
|------------------------------------------|----------------------------------------|------------------------------------------------------------------------------------|
|Default-deny vs. default-allow            |Default-deny                            |Friction on first-run; lots of `metadata_only` until users classify and configure   |
|Per-capture override vs. session override |Per-capture only                        |More clicks; but no “I forgot I left override on” failure mode                      |
|Local audit log vs. remote telemetry      |Local first, remote later               |Audit gaps if device lost; acceptable for v0.1                                      |
|Regex sanitizer vs. ML-based PII detection|Keep regex for now, gate is the enforcer|Sanitizer remains leaky on names/diacritics; gate’s classification check compensates|
|Gate as library vs. service               |Library (in-process)                    |No central audit aggregation in v0.1; simpler to reason about                       |

-----

## 15. Versioning

This spec is `RUNTIME_POLICY_GATE_VERSION = 0.1.0-spec`. The version string is included in every audit entry.

Bump rules:

- **0.x.y** = spec changes, behavior may change between versions
- **1.0.0** = stable contract; `evaluatePolicyGate()` signature and decision matrix frozen
- **2.0.0** = breaking change to decision semantics or contract
