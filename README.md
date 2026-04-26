# GEAkr v1.0

GEAkr provides a lightweight, project-scoped retrieval pattern for chatbot-assisted architecture and knowledge work.

At its simplest, GEAkr is a logical folder structure plus instructions. The structure helps define what information is in scope for a project, how source references are registered, and how a chatbot should treat the folder when generating summaries, comparisons, diagrams, briefings, or other project artifacts.

## Core idea

GEAkr is intentionally storage-agnostic. A user or team can place the structure wherever it is most useful, including SharePoint, Google Drive, Dropbox, Git, OneDrive, a local folder, or a ChatGPT project context.

Teams can start with a simple folder. If they need governance, traceability, or automation, the same pattern can move into GitHub.

The value is not tied to one platform. The value is the consistent structure:

- a place for source references
- a place for supporting files
- a place for briefing notes
- a place for generated or extracted content
- an instructions file that tells the chatbot how to use the project context

## Concept map

GEAkr separates the pattern from the mechanisms that may support it:

- GEAkr = context pattern
- Projects = persistence mechanism
- Connectors = access mechanism
- GitHub = version/control mechanism
- CI/CD = validation/automation mechanism

A chatbot project feature is not required. GEAkr can be used at runtime by pasting, uploading, or referencing the relevant instruction and context files. Project features are useful when persistent context is available, but they are optional.

## Usage modes

GEAkr can be used in several ways depending on available tools, connectors, and permissions.

### 1. Manual reference folder

A user copies the folder structure into their preferred storage location and manually adds links, files, and notes. The chatbot can then be pointed at those materials or given copies during a chat session.

### 2. Connector-backed workspace

If a chatbot has access to a storage connector, such as SharePoint, Google Drive, Dropbox, or Git, it may be able to read from the GEAkr folder. If the connector also has write permission, the chatbot may be able to create or update files in the structure.

### 3. Session context mode

The structure does not always need to be physically written back to storage. A chatbot can use the GEAkr structure and instructions as an in-session working model, keeping track of sources, notes, and outputs during the active session. In this mode, the structure guides the work, but changes are only preserved if the user saves them or a connector writes them back.

### 4. Project context mode

In tools that support persistent project files or project instructions, GEAkr can be used as a reusable project context. The folder pattern helps organize the project’s reference material and gives the chatbot a stable orientation for future work.

## Important boundaries

GEAkr does not provide RAG, file access, or write-back capability by itself. It provides the structure and instructions that a chatbot, connector, or retrieval workflow can use.

Actual read/write behavior depends on:

- the chatbot being used
- available connectors
- user permissions
- storage location
- organizational rules for sensitive information

## Practical explanation

GEAkr helps users create a bounded project context. The user can fill that context manually, use a chatbot to help organize it, or connect it to tools that read and write files. The same structure can be used lightly in a chat session or more formally in a shared project folder.