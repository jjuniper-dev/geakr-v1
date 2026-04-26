import {
  log,
  logGateDecision,
  logLLMCall,
  logDataAccess,
  logPluginExecution
} from './logger.js';

export const audit = {
  log,
  logGateDecision,
  logLLMCall,
  logDataAccess,
  logPluginExecution
};

export default audit;
