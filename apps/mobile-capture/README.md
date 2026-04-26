# GEAkr Mobile Capture App

A minimal tap-first web app for capturing a high-interest URL, extracting structured knowledge, and creating a Markdown knowledge file in a GitHub-backed GEAkr repository.

## What it does

1. User pastes a URL into a simple mobile-friendly form.
2. App fetches readable page text.
3. App sends the URL and extracted text to an OpenAI-compatible API.
4. App returns a GEAkr knowledge-file Markdown draft.
5. Optional: app writes the Markdown file into the configured GitHub repo under `knowledge/`.

## Safety boundary

Use only public or approved non-sensitive content. This app does not decide whether a source is safe to process. Do not submit personal, sensitive, protected, confidential, or restricted information unless the endpoint, storage, and permissions are approved for that information.

## Replit setup

1. Create a new Replit Node.js project.
2. Copy these files into the Replit project:
   - `package.json`
   - `server.js`
   - `public/index.html`
3. Add environment variables in Replit Secrets:
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL` (optional; defaults to OpenAI API)
   - `OPENAI_MODEL` (optional; defaults to `gpt-4.1-mini`)
   - `GITHUB_TOKEN` (optional; required only for write-back)
   - `GITHUB_OWNER` (optional; e.g. `jjuniper-dev`)
   - `GITHUB_REPO` (optional; e.g. `geakr-v1`)
   - `GITHUB_BRANCH` (optional; defaults to `main`)
   - `KNOWLEDGE_PATH` (optional; defaults to `knowledge`)
4. Run the app.
5. Open the Replit public URL on your phone.
6. Add it to your iPhone Home Screen for tap access.

## iPhone Shortcut option

See `ios-shortcut-spec.md` for a no-code Shortcut that sends a shared URL to this web app.

## Endpoint

POST `/extract`

Request:

```json
{
  "url": "https://example.com/page",
  "writeToGitHub": false
}
```

Response:

```json
{
  "ok": true,
  "title": "Example Title",
  "filename": "example-title.md",
  "markdown": "# Example Title...",
  "github": null
}
```
