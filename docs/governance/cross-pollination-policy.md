# Cross-Pollination Policy — GEAkr Multi-Branch Model

Date: 2026-04-25
Status: Active

## Purpose

Define how knowledge moves between:
- work/geakr-enterprise (enterprise / HC-PHAC context)
- personal/pca (personal cognitive architecture)
- main/shared (public-safe baseline)

The goal is to enable reuse of valuable knowledge without violating privacy, classification, or governance constraints.

---

## Branch Roles

### 1. work/geakr-enterprise

Contains:
- EA/TPO analysis
- architecture decisions
- internal insights (UNCLASSIFIED ONLY)

Constraints:
- no personal data
- no protected B or above
- no sensitive operational details

---

### 2. personal/pca

Contains:
- personal insights
- cognitive synthesis
- experimentation
- cross-domain thinking

Constraints:
- not intended for enterprise exposure
- may contain speculative or unvalidated thinking

---

### 3. main (shared/public)

Contains:
- public-safe knowledge
- generalized patterns
- reusable intelligence

Constraints:
- must be safe for broad sharing
- must not contain internal or personal-sensitive context

---

## Cross-Pollination Rules

### Rule 1 — Promotion, not copying

Knowledge does not move directly between branches.
It must be promoted through a transformation step.

---

### Rule 2 — Public baseline first

All knowledge eligible for sharing must:
- be grounded in public sources
- remove internal or personal context
- be rewritten in neutral, generalizable terms

---

### Rule 3 — Directional flow

Allowed flows:

personal/pca → main
- extract generalized insight
- remove personal framing

work/geakr-enterprise → main
- extract public-safe patterns
- remove internal references

main → work/geakr-enterprise
- allowed freely (public knowledge enrichment)

main → personal/pca
- allowed freely (personal reasoning enrichment)

Disallowed flows:

personal/pca → work/geakr-enterprise (direct)
work/geakr-enterprise → personal/pca (direct)

---

### Rule 4 — Knowledge transformation template

When promoting knowledge:

1. Remove:
   - names
   - internal systems
   - sensitive context

2. Reframe:
   - from specific → general
   - from internal → pattern

3. Validate:
   - supported by public or safe sources

---

### Rule 5 — Metadata tagging

All promoted files must include:

source_layer: public | internal | personal
promotion_status: promoted
origin_branch: <branch>

---

## Example

Original (work branch):
"PHAC system X struggles with AI governance"

Promoted (main):
"Enterprise systems often struggle with AI governance due to fragmented context and lack of structured inputs"

---

## Outcome

This model enables:

- safe reuse of knowledge
- separation of concerns
- PCA-driven insight without leakage
- enterprise compliance alignment

---

## Future Enhancements

- automated promotion workflow (PR-based)
- CI checks for restricted content
- tagging enforcement
- knowledge lineage tracking
