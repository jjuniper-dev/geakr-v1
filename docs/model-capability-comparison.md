# Model Capability Comparison for GEAkr

This table compares how well common chatbot platforms can support the GEAkr pattern. Capabilities change frequently, so users should verify current connector, file, privacy, and write-back behavior before using project material.

| Capability | ChatGPT | Claude | Gemini |
|---|---|---|---|
| Use GEAkr as an in-session structure | Strong | Strong | Strong |
| Read pasted `sources.txt` content | Yes | Yes | Yes |
| Work with uploaded files | Yes, depending on plan and file type | Yes, depending on plan and file type | Yes, depending on plan and workspace/account |
| Persistent project/workspace context | ChatGPT Projects can preserve files/instructions within a project | Claude Projects can preserve project knowledge/instructions | Gemini behavior depends on Google Workspace/Gemini app context |
| Connector-based file access | Available for some connected apps and plans; verify current connectors | Available in some enterprise/workspace contexts; verify current connectors | Strongest native alignment with Google Drive/Workspace; verify account and permissions |
| Write files back to external storage | Requires a connector/tool with write capability; not inherent to GEAkr | Requires a connector/tool with write capability; not inherent to GEAkr | Requires Google Workspace/Drive integration or another write-capable workflow; verify behavior |
| Use Google Drive as GEAkr storage | Possible only if Google Drive connector/access is available | Possible only if connector/access is available | Natural fit when Gemini has Drive access |
| Use SharePoint/OneDrive as GEAkr storage | Possible if Microsoft connector/access is available | Possible if connector/access is available | Possible only through available connectors or manual upload/export |
| Use local drive as GEAkr storage | Manual upload/paste unless local tooling exists | Manual upload/paste unless local tooling exists | Manual upload/paste unless local tooling exists |
| Follow `GEAKR_INSTRUCTIONS.md` | Strong | Strong | Strong |
| Generate new GEAkr files in chat | Yes, can generate file contents | Yes, can generate file contents | Yes, can generate file contents |
| Actually save generated files to folder | Only with write-capable connector/tool | Only with write-capable connector/tool | Only with write-capable connector/tool |
| Compare multiple models using same folder | Good | Good | Good |
| Privacy/data-use controls | Depends on plan, account type, settings, and provider terms | Depends on plan, account type, settings, and provider terms | Depends on account type, Workspace settings, and provider terms |
| Best-fit GEAkr mode | Project context mode; file and connector-backed workflows where available | Project knowledge mode; long-context review and synthesis | Google Drive / Workspace-based folder workflows |

## Practical interpretation

- All three can use the GEAkr structure as a reasoning and organization pattern.
- All three can work from pasted or uploaded project material.
- Real read/write automation depends on connectors, permissions, and product plan.
- GEAkr should not claim that a model can read or write files unless that capability has been tested in the user’s environment.

## Recommended test

Use a non-sensitive sample GEAkr folder and ask each assistant the same task:

> Use this GEAkr folder as project context. Read the sources, summarize the project, identify missing references, and draft an updated `briefing.md`.

Then compare:

- source use
- reasoning quality
- instruction following
- output usefulness
- ability to cite or trace references
- ability to write back to the target folder, if supported
