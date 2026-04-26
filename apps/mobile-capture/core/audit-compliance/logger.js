import fs from 'node:fs/promises';
import path from 'node:path';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function log(entry) {
  const dir = path.join(process.cwd(), 'audit', 'logs');
  await fs.mkdir(dir, { recursive: true });

  const file = path.join(dir, `${today()}.jsonl`);
  const enrichedEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };

  await fs.appendFile(file, `${JSON.stringify(enrichedEntry)}\n`, 'utf-8');
  return enrichedEntry;
}

export async function logGateDecision(auditEntry) {
  return await log({
    type: 'gate_decision',
    ...auditEntry
  });
}

export async function logLLMCall({ provider, model, operation, inputTokens, outputTokens, costEstimate, userId, duration }) {
  return await log({
    type: 'llm_call',
    provider,
    model,
    operation,
    inputTokens,
    outputTokens,
    costEstimate,
    userId,
    duration
  });
}

export async function logDataAccess({ operation, source, userId, reason }) {
  return await log({
    type: 'data_access',
    operation,
    source,
    userId,
    reason
  });
}

export async function logPluginExecution({ pluginName, input, output, duration, userId }) {
  return await log({
    type: 'plugin_execution',
    pluginName,
    input: input ? JSON.stringify(input).slice(0, 500) : null,
    output: output ? JSON.stringify(output).slice(0, 500) : null,
    duration,
    userId
  });
}
