export async function route({ operation, input, context }) {
  switch (operation) {
    case 'fetch':
      return await handleFetch(input);
    case 'sanitize':
      return await handleSanitize(input);
    case 'extract':
      return await handleExtract(input, context);
    case 'render':
      return await handleRender(input);
    case 'writeGitHub':
      return await handleGitHubWrite(input, context);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function handleFetch(input) {
  if (!input || !input.fetchReadable || !input.url) {
    throw new Error('Fetch requires { url, fetchReadable: function }');
  }
  return await input.fetchReadable(input.url);
}

async function handleSanitize(input) {
  if (!input || !input.sanitizeText || !input.text) {
    throw new Error('Sanitize requires { text, sanitizeText: function }');
  }
  return input.sanitizeText(input.text);
}

async function handleExtract(input, context) {
  if (!input || !input.invokeExtraction || !input.params) {
    throw new Error('Extract requires { params, invokeExtraction: function }');
  }

  if (context.gateDecision && context.gateDecision.decision === 'BLOCK') {
    throw new Error('Cannot extract: blocked by policy gate');
  }

  return await input.invokeExtraction(input.params);
}

async function handleRender(input) {
  if (!input || !input.renderMarkdown || !input.data) {
    throw new Error('Render requires { data, renderMarkdown: function }');
  }
  return input.renderMarkdown(input.data, input.metadata || {});
}

async function handleGitHubWrite(input, context) {
  if (!input || !input.writeToGitHub || !input.content) {
    throw new Error('GitHub write requires { content, filename, writeToGitHub: function }');
  }
  return await input.writeToGitHub({
    content: input.content,
    filename: input.filename,
    basePathOverride: input.basePathOverride
  });
}
