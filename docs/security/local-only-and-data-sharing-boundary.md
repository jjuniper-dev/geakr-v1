# Local-Only and Data Sharing Boundary

Date: 2026-04-25
Status: v0.1 guidance

## Core answer

Yes, GEAkr can be designed so source content is not shared with OpenAI or other external model providers.

The SDK is not the privacy boundary. The boundary is determined by:

- where the model runs
- what endpoint receives the payload
- what data is sent
- where outputs are stored
- what account, tenant, or hosting controls apply

## Key principle

Do not send content to a model provider unless the data-sharing boundary is acceptable for that content.

## Runtime modes

### 1. local_only

Content is processed locally using local parsing and/or local models.

Use for:
- maximum personal privacy
- experimentation with sensitive personal material
- offline capture
- situations where no external API call is acceptable

Constraints:
- lower model quality may apply
- device/server must have enough capacity
- setup is more complex than hosted APIs

### 2. metadata_only

Only URL, title, and user-written notes are stored. No page content is sent to an LLM.

Use for:
- bookmarking high-interest sources
- later manual review
- avoiding all model processing at capture time

### 3. local_extract_then_optional_sanitize

A local process fetches/extracts text, creates a local summary, and only a sanitized excerpt is sent externally if explicitly allowed.

Use for:
- reducing payload exposure
- public/private mixed workflows
- review-before-send patterns

### 4. approved_enterprise

Content is processed only in an approved organizational environment using approved hosting, identity, model endpoint, storage, logging, and governance controls.

Use for:
- work material
- internal unclassified material
- any content subject to organizational policy

### 5. external_api_public_only

Content is sent to an external API such as OpenAI API only when it is public and non-sensitive.

Use for:
- personal experimentation
- public sources
- non-sensitive URL capture

## Practical no-sharing options

### Option A — No model at capture time

Capture only:
- URL
- title
- timestamp
- user note
- tags

No page text is sent anywhere.

### Option B — Local rule-based extraction

Use local code to fetch page text and generate a basic Markdown file without an LLM.

### Option C — Local LLM

Use a local model through tools such as Ollama, LM Studio, llama.cpp, or another local runtime.

### Option D — Approved enterprise model endpoint

For work use, deploy the backend in an approved organizational environment and call only approved endpoints.

## Backend guardrail recommendation

The capture backend should support a runtime policy:

```json
{
  "runtime_mode": "local_only | metadata_only | local_llm | external_api_public_only | approved_enterprise",
  "source_layer": "public | internal | personal",
  "sensitivity": "non_sensitive | internal_unclassified | personal_sensitive | protected",
  "allow_external_model_call": false
}
```

If `allow_external_model_call` is false, the backend must not send page text to OpenAI, Azure OpenAI, or any other external provider.

## Recommended default

For personal PCA privacy-sensitive use:

- default to metadata_only or local_only
- require explicit opt-in for external API processing

For work use:

- require approved_enterprise
- block external_api_public_only unless explicitly approved

## Architectural statement

GEAkr can operate without external model sharing by separating capture, extraction, storage, and reasoning. External model calls are optional execution mechanisms, not inherent to the GEAkr pattern.
