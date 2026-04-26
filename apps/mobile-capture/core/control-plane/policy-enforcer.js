import { evaluatePolicyGate } from '../../policy/gate.js';

export async function enforcePolicy(context) {
  const {
    source = {},
    runtime = {},
    sanitizer = {},
    userOverride = null
  } = context;

  const decision = evaluatePolicyGate({
    source,
    runtime,
    sanitizer,
    userOverride
  });

  return decision;
}
