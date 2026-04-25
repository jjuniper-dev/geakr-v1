# Privacy Boundary

GEAkr is a folder pattern. It does not change the privacy, security, or data-use terms of the chatbot, connector, or storage platform being used.

## Core principle

Before using GEAkr with a chatbot, users are responsible for understanding the privacy and data-use terms of the chatbot provider and storage provider they choose.

The privacy boundary is defined by:

- where the GEAkr folder is stored
- what information is placed in the folder
- which chatbot or assistant is used
- which connectors are enabled
- what permissions are granted
- whether conversation or file content may be used for model improvement or training
- organizational rules for sensitive, confidential, or regulated information

## Common scenarios

### Local-only manual use

The user keeps the folder locally and manually copies selected text into a chatbot.

Boundary: content enters the chatbot provider only when the user pastes or uploads it.

### Cloud folder with read connector

The folder is stored in SharePoint, Google Drive, Dropbox, or another cloud service. The chatbot is granted read access.

Boundary: file contents may be transmitted from the storage provider to the chatbot provider during retrieval or analysis.

### Cloud folder with write connector

The chatbot has permission to create or modify files in the folder.

Boundary: generated content may be written back to the storage provider. Users should define which files can be modified and whether confirmation is required.

### Self-hosted or open-source assistant

The user or organization operates the assistant and storage environment.

Boundary: data handling depends on the self-hosted deployment, logs, model runtime, indexing pipeline, and infrastructure controls.

## Data-use settings

Commercial chatbot providers may offer settings that control whether user content is used to improve or train models. Users should review and configure these settings before using project material.

For demonstrations, show users where to review privacy settings and how to disable model training or data-sharing options where the provider supports it.

## Recommended rule

Do not place sensitive, confidential, personal, protected, regulated, or restricted information into a GEAkr folder unless the chosen storage location, chatbot, connector, and permissions are approved for that information.

## Suggested warning text

GEAkr organizes project context. It does not make content private, approved, or safe for use with a chatbot. Privacy depends on the storage location, chatbot provider, connector permissions, user settings, and organizational rules.
