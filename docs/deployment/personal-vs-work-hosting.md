# Personal vs Work Hosting Boundary

Date: 2026-04-25
Status: Active guidance

## Hosting rule

Replit or the equivalent may be used for personal experimentation with public or non-sensitive sources. It should not be used for work material unless explicitly approved. For work use, host the capture backend in an approved organizational environment.

## Practical interpretation

### Personal / PCA use

Allowed when:
- sources are public or non-sensitive
- no personal, protected, confidential, or restricted information is submitted
- API keys and GitHub tokens are treated as personal prototype secrets
- outputs are understood as provisional

Suitable platforms:
- Replit
- Render
- Railway
- Fly.io
- local machine

### Work use

Do not use personal/prototype hosting for work material unless explicitly approved.

Work use requires an approved organizational environment with appropriate controls for:
- identity and access
- secrets management
- logging and monitoring
- approved model endpoint
- approved storage
- data classification and privacy
- retention and audit requirements

Suitable controlled environments may include:
- Azure App Service
- Azure Functions
- approved internal container hosting
- other organization-approved platforms

## Component distinction

The graph viewer is static and can be hosted or opened locally.

The capture backend is sensitive because it may process:
- URLs
- fetched page content
- extracted summaries
- API keys
- GitHub write tokens

Therefore the backend has a higher hosting bar than the static viewer.

## Recommended operating model

- Personal experimentation: Replit/equivalent is acceptable for public/non-sensitive material.
- Work experimentation: use approved organizational hosting only.
- Shared pattern: keep GEAkr storage-agnostic and hosting-agnostic.
