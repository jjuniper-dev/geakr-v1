# GEAkr Implementation Guides

These guides describe simple ways to use the GEAkr folder pattern in different storage locations.

GEAkr is intentionally storage-agnostic. Users can place the structure wherever it works best for their workflow, then point their chatbot or assistant at that location when the tool has appropriate access.

## Guides

1. [Local Drive](./local-drive.md)
2. [SharePoint](./sharepoint.md)
3. [Google Drive](./google-drive.md)

Each guide is designed to support a short, one-minute demonstration video.

## Common setup concept

Every implementation follows the same basic flow:

1. Copy or create the GEAkr folder structure.
2. Add source links to `sources.txt`.
3. Add supporting files where useful.
4. Add or review `GEAKR_INSTRUCTIONS.md`.
5. Point the chatbot at the folder or provide the folder contents as context.
6. Ask the chatbot to follow the GEAkr instructions.

## Capability boundary

GEAkr does not provide file access, indexing, or RAG by itself. Those capabilities depend on the chatbot, connector, storage location, and permissions available to the user.
