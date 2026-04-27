import {
  log,
  logGateDecision,
  logLLMCall,
  logDataAccess,
  logPluginExecution
} from './logger.js';

import {
  logRAGIngestion,
  logRAGRetrieval
} from './rag-logger.js';

export const audit = {
  log,
  logGateDecision,
  logLLMCall,
  logDataAccess,
  logPluginExecution,
  logRAGIngestion,
  logRAGRetrieval
};

export default audit;
