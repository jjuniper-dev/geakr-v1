import { enforcePolicy } from './policy-enforcer.js';
import { route } from './orchestrator.js';

export async function execute({ operation, input, context }) {
  const gateDecision = await enforcePolicy(context);

  const result = {
    gateDecision,
    operationResult: null,
    trace: []
  };

  result.trace.push(`policy_gate:${gateDecision.decision}`);

  if (gateDecision.decision === 'BLOCK') {
    return result;
  }

  try {
    result.operationResult = await route({
      operation,
      input,
      context: { ...context, gateDecision }
    });
    result.trace.push(`${operation}:success`);
  } catch (error) {
    result.trace.push(`${operation}:error`);
    throw error;
  }

  return result;
}
