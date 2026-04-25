# Conflict Resolution Workflow

Date: 2026-04-25
Status: v0.1 prototype

## Purpose

Define how detected GEAkr graph conflicts move from signal to resolution without collapsing public, work, and personal/PCA boundaries.

Conflict detection identifies evidence gaps and tensions. Conflict resolution decides what to do about them.

---

## Conflict states

- open — detected and not yet reviewed
- triaged — reviewed and categorized
- evidence_needed — requires source or supporting artifact
- sanitize_for_promotion — useful but must be rewritten before moving to shared/public
- accepted_risk — known limitation, no immediate action
- resolved — action completed
- rejected — signal was not useful or was based on poor evidence

---

## Resolution actions

### 1. Add public evidence

Use when:
- concept exists in work or PCA but lacks public support
- claim needs external defensibility

Action:
- add public source to `sources.txt`
- capture/source-extract it into `knowledge/`
- rerun graph extraction and convergence

---

### 2. Promote sanitized insight

Use when:
- work and PCA converge on a useful idea
- the idea can be generalized safely

Action:
- rewrite specific insight into public-safe pattern
- remove names, internal systems, operational details, and personal context
- add metadata:
  - promotion_status: promoted
  - origin_branch: <source branch>
  - source_layer: public

---

### 3. Keep provisional

Use when:
- signal is interesting but weak
- only one artifact supports it
- trust state is provisional

Action:
- mark `trust_state: provisional`
- add `resolution_status: evidence_needed`
- revisit later

---

### 4. Reject signal

Use when:
- artifact is misleading
- source is poor quality
- idea does not survive review

Action:
- mark `trust_state: rejected`
- add reason in notes

---

### 5. Accept as local-only

Use when:
- insight is valuable personally or internally
- not appropriate for public/shared promotion

Action:
- retain in source branch only
- mark `promotion_status: local_only`

---

## Minimal review checklist

For each conflict:

1. What is the concept?
2. Which branches support it?
3. Is there public evidence?
4. Is any support provisional or rejected?
5. Can it be safely promoted?
6. What action should be taken?

---

## Metadata to add after review

```yaml
conflict_status: open | triaged | evidence_needed | sanitize_for_promotion | accepted_risk | resolved | rejected
resolution_action: add_public_evidence | promote_sanitized | keep_provisional | reject_signal | local_only
resolution_owner: <name or role>
resolution_date: <YYYY-MM-DD>
resolution_notes: <short note>
```

---

## Workflow

```text
Detect conflict
      ↓
Triage
      ↓
Choose resolution action
      ↓
Update metadata or create new artifact
      ↓
Rerun graph extraction
      ↓
Rerun convergence + conflict detection
      ↓
Close or keep open
```

---

## Guardrail

Do not resolve a conflict by copying personal or internal material into main. Resolution requires either public evidence, sanitization, or explicit local-only handling.
