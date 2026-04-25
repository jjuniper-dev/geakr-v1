# ADR-0002: Pause Generator Expansion

Date: 2026-04-25
Status: Accepted

## Context

The GEAkr / PCA work has expanded to include:

- mobile capture
- structured knowledge extraction
- sanitization
- graph fragment generation
- graph search/viewer concepts
- PPTX generator mode design
- Visio generator mode design
- initial diagram manifest
- initial working diagram generator direction

The current direction is useful, but further implementation should pause before additional complexity is added.

## Decision

Pause further generator expansion for now.

The current state is sufficient as a design baseline and prototype direction.

No additional implementation should be added until the existing work is reviewed, cleaned up, and tested.

## Rationale

The current system has reached a natural stopping point:

- enough architecture has been captured
- enough generator direction has been defined
- the risk of overbuilding is increasing
- the next valuable step is review and consolidation, not more feature expansion

## Next recommended actions

1. Review existing docs and scripts.
2. Validate that key files exist and are coherent.
3. Clean up any half-complete generator work.
4. Decide which path to pursue next:
   - graph merger
   - runtime policy gate
   - local-only mode
   - PPTX generator
   - Visio/draw.io generator
5. Create a focused implementation issue before continuing.

## Principle

Stop when the pattern is clear enough to preserve. Resume when the next implementation step is deliberate.
