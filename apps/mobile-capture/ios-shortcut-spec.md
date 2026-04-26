# iPhone Shortcut (Share → Extract to GEAkr)

Apple Shortcuts import files are not reliably hand-authorable as plain JSON. Use this exact spec to build a Shortcut in ~2 minutes.

## Name
Extract to GEAkr

## Show in Share Sheet
ON (accepts URLs)

## Actions

1) Get URLs from Input
- Action: Get URLs from Input

2) Set Variable (url)
- Action: Set Variable → Name: url → Value: Provided Input

3) Get Contents of URL (POST)
- Action: Get Contents of URL
- URL: https://<your-replit-or-hosted-app>/extract
- Method: POST
- Request Body: JSON

Body:
{
  "url": "Shortcut Input",
  "writeToGitHub": true
}

4) Get Dictionary from Input
- Action: Get Dictionary from Input

5) Get Dictionary Value (markdown)
- Key: markdown

6) Quick Look (or Copy to Clipboard)
- Action: Quick Look (to preview) or Copy to Clipboard

## Usage
- Open any page → Share → Extract to GEAkr
- The Shortcut calls your web app and returns the Markdown knowledge file.

## Notes
- If writeToGitHub=true and GitHub env vars are set, the file is committed automatically.
- Otherwise, copy the Markdown and paste it into your repo.
