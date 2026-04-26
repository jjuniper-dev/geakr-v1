# GEAkr — Quickstart for New Agents

Date: 2026-04-25
Status: v0.1
Read time: ~5 minutes
Repository: `jjuniper-dev/geakr-v1`

If you only read one file before touching this repo, read this one. Then read the caveats in §4 again. Everything else is optional until you have done a first task.

-----

## 1. What GEAkr is, in one paragraph

GEAkr is a lightweight, storage-agnostic context pattern for AI-assisted knowledge work. It organizes sources, notes, files, and instructions into bounded project context so AI-assisted outputs are traceable and reviewable. It is **not** a platform, **not** a security boundary, and **not** a substitute for HC/PHAC governance. It is a pattern that runs across local folders, GitHub, SharePoint, Claude/ChatGPT Projects, and approved enterprise environments.

## 2. Minimal mental model

```text
Capture → Sanitize → Structure → Store → Graph → Analyze → Review → Promote
```

```text
GEAkr is the context pattern.
Everything else is an optional mechanism layered around it.
```

## 3. Hard rules — never violate

1. **Preserve Level 0 simplicity.** Level 0 = folder + instructions, no code required. Anything that breaks this is a regression.
1. **Replit and external APIs are never mandatory.** They are runtime options, not requirements.
1. **Work use requires approved organizational hosting.** Not Replit, not personal accounts, not this public repo.
1. **Public, work, and personal contexts stay separate.** Promotion is the only legal path between them.
1. **Promote knowledge only through sanitization + generalization.** Never copy raw.
1. **Keep traceability metadata intact.** `origin_branch`, `source_layer`, `pipeline_version`, `sanitizer_version`, `trust_state`.
1. **Never claim compliance.** Say “supports governance/compliance workflows.”
1. **Confidence and conflict outputs are decision-support signals, not truth.**
1. **Version pipeline changes.** Bump `CAPTURE_PIPELINE_VERSION`, `SANITIZER_VERSION`, etc.
1. **Prefer additive changes over breaking structural changes.**

## 4. Known caveats — read before you trust any output

|# |Caveat                                                           |Implication                                                               |
|--|-----------------------------------------------------------------|--------------------------------------------------------------------------|
|1 |The sanitizer is regex-based and incomplete                      |Do not treat redaction as a security guarantee                            |
|2 |Sanitization is risk reduction, not a security boundary          |Combine with the runtime policy gate (planned)                            |
|3 |Git branches are not access-controlled                           |Anyone with repo read access sees all branches                            |
|4 |Confidence scores are heuristic                                  |Use to prioritize review, not to validate claims                          |
|5 |Conflict detection is heuristic                                  |Always requires human review                                              |
|6 |Graph fragments are generated but not yet auto-merged            |Manual merge step required                                                |
|7 |Search is lexical / semantic-lite                                |Not true vector search yet                                                |
|8 |Some files are prototype quality                                 |Confirm current `server.js` before editing                                |
|9 |The repo has multiple branches with different sharing assumptions|Read `BRANCHES.md` before committing                                      |
|10|SDK ≠ privacy boundary                                           |Endpoint, payload, runtime, hosting, and account terms define the boundary|

## 5. Your first 30 minutes

Sequential. Do not skip ahead.

### Step 1 — Orient (5 min)

- Read this file end to end (you’re doing it).
- Skim `GLOSSARY.md` for unfamiliar acronyms.

### Step 2 — Confirm branch (1 min)

```bash
git branch --show-current
```

Expected: `feature/geakr-v1-scaffold`. If anything else, stop and ask.

### Step 3 — Build the graph (5 min)

If `npm run graph:build` exists, use it. Otherwise run sequentially:

```bash
node scripts/graph/extract-graph.js
node scripts/graph/analyze-convergence.js
node scripts/graph/detect-conflicts.js
node scripts/graph/build-search-index.js
node scripts/graph/chad-view.js   # to be renamed ea-lens.js — see ADR-0002
```

### Step 4 — Open the viewer (2 min)

Open `graph/view.html`. Load `graph/graph.json`. Confirm nodes render and search works.

### Step 5 — Pick one node (10 min)

Find one node with `trust_state: provisional`. Read its source. Decide: does it warrant promotion, more evidence, or rejection? Write your reasoning to `graph/notes/<your-handle>-first-review.md`.

### Step 6 — Stop and check in (5 min)

Do **not** commit. Do **not** push. Do **not** edit `server.js` or any sanitizer logic. Surface your reasoning for review.

## 6. When to stop and ask

|Trigger                                     |Action                                                |
|--------------------------------------------|------------------------------------------------------|
|About to commit to `main`                   |Stop. Promotion only.                                 |
|Sanitizer flagged a high-risk finding       |Do not override without human review                  |
|Considering adding an external API call     |Check runtime policy first                            |
|A capture URL contains internal/work content|Treat as work-context. Do not process via external API|
|Unsure which branch context applies         |Default to most restrictive                           |

## 7. Where to go next

|If you want to…                                    |Read             |
|---------------------------------------------------|-----------------|
|Understand the architecture                        |`ARCHITECTURE.md`|
|Understand safety + data boundaries                |`SAFETY.md`      |
|Run captures, build the graph, write back to GitHub|`OPERATIONS.md`  |
|Look up an acronym                                 |`GLOSSARY.md`    |
|See planned work                                   |`BACKLOG.md`     |
|Understand a past decision                         |`docs/decisions/`|

## 8. Glossary stub (essentials only)

|Term                |Meaning                                                                       |
|--------------------|------------------------------------------------------------------------------|
|**GEAkr**           |The context pattern this repo implements                                      |
|**PCA**             |Personal Cognitive Architecture — personal reasoning and synthesis layer      |
|**EA**              |Enterprise Architecture                                                       |
|**TPO**             |Technology Portfolio Office                                                   |
|**OCDO**            |Office of the Chief Data Officer                                              |
|**HC / PHAC**       |Health Canada / Public Health Agency of Canada                                |
|**TBS**             |Treasury Board of Canada Secretariat                                          |
|**Level 0**         |Folder + instructions, no code; baseline GEAkr usage                          |
|**Promotion**       |Sanitization + generalization step that moves knowledge between context layers|
|**EA Decision View**|The architecture-decision lens over the graph (formerly “Chad mode”)          |

Full list in `GLOSSARY.md`.
