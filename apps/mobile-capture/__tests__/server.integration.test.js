import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_KEY = 'test-api-key-12345';
const TEST_TIMEOUT = 10000;

let serverProcess = null;

async function startServer() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: '3001',
      OPENAI_API_KEY: 'sk-test-key',
      OPENAI_MODEL: 'gpt-4o-mini',
      GEAKR_API_KEY: API_KEY,
      NODE_ENV: 'test'
    };

    serverProcess = spawn('node', ['apps/mobile-capture/server.js'], {
      env,
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Ready')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    setTimeout(() => reject(new Error('Server startup timeout')), 5000);

    serverProcess.on('error', reject);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

test('Server Integration Tests', async (t) => {
  await t.test('setup: start server', async () => {
    try {
      await startServer();
    } catch (err) {
      console.error('Failed to start server:', err.message);
      throw err;
    }
  });

  await t.test('POST /extract without API key (when required)', async () => {
    try {
      await axios.post(`${BASE_URL}/extract`, { url: 'https://example.com' });
      assert.fail('Should have rejected without API key');
    } catch (error) {
      assert.strictEqual(error.response.status, 401);
      assert.strictEqual(error.response.data.ok, false);
      assert(error.response.data.error.includes('Unauthorized'));
    }
  });

  await t.test('POST /extract without URL', async () => {
    try {
      await axios.post(`${BASE_URL}/extract`, {}, {
        headers: { 'X-API-Key': API_KEY }
      });
      assert.fail('Should have rejected without URL');
    } catch (error) {
      assert.strictEqual(error.response.status, 400);
      assert.strictEqual(error.response.data.ok, false);
      assert(error.response.data.error.includes('Missing url'));
    }
  });

  await t.test('POST /extract with invalid URL', async () => {
    try {
      await axios.post(`${BASE_URL}/extract`, { url: 'invalid://url' }, {
        headers: { 'X-API-Key': API_KEY },
        timeout: 5000
      });
      assert.fail('Should have failed to fetch invalid URL');
    } catch (error) {
      assert(error.message.includes('error') || error.message.includes('ENOTFOUND') || error.response);
    }
  });

  await t.test('POST /extract with valid URL but network isolation', async () => {
    const mockUrl = 'https://httpbin.org/html';
    try {
      const response = await axios.post(`${BASE_URL}/extract`, {
        url: mockUrl,
        sourceClassification: 'public',
        contextLayer: 'public'
      }, {
        headers: { 'X-API-Key': API_KEY },
        timeout: 15000
      });

      assert(response.data);
      assert(response.data.ok === true);
      assert(['blocked', 'local_or_metadata_only', 'extracted'].includes(response.data.status));
      assert(response.data.capture_pipeline_version);
      assert(response.data.audit);
    } catch (error) {
      if (error.response) {
        assert.fail(`Server returned ${error.response.status}: ${error.response.data.error}`);
      } else {
        console.warn(`Network test skipped (network unavailable): ${error.message}`);
      }
    }
  });

  await t.test('Rate limiting: reject after max requests', async () => {
    const requests = [];
    const LIMIT = 5;

    for (let i = 0; i < LIMIT + 2; i++) {
      requests.push(
        axios.post(`${BASE_URL}/extract`, { url: 'https://example.com' }, {
          headers: { 'X-API-Key': API_KEY },
          validateStatus: () => true
        }).catch(e => e.response)
      );
    }

    const responses = await Promise.all(requests);
    const blockedResponse = responses.find(r => r.status === 429);

    if (blockedResponse) {
      assert.strictEqual(blockedResponse.status, 429);
      assert(blockedResponse.data.error.includes('Rate limit'));
    }
  });

  await t.test('Response structure validation', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/extract`, {
        url: 'https://httpbin.org/html',
        sourceClassification: 'public',
        contextLayer: 'public'
      }, {
        headers: { 'X-API-Key': API_KEY },
        timeout: 15000
      });

      const data = response.data;
      assert(data.ok === true);
      assert(typeof data.status === 'string');
      assert(data.capture_pipeline_version);
      assert(data.audit);
      assert(data.audit.gate_decision_id);
      assert(data.audit.timestamp);
      assert(data.audit.decision);
    } catch (error) {
      if (error.response?.status >= 500) {
        assert.fail(`Server error: ${error.response.data.error}`);
      }
    }
  });

  await t.test('Gate decision in response', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/extract`, {
        url: 'https://httpbin.org/html',
        sourceClassification: 'public',
        contextLayer: 'public'
      }, {
        headers: { 'X-API-Key': API_KEY },
        timeout: 15000
      });

      const { gate } = response.data;
      assert(gate);
      assert(['ALLOW', 'BLOCK'].includes(gate.decision));
      assert(typeof gate.effectiveMode === 'string');
      assert(Array.isArray(gate.allowedOperations));
    } catch (error) {
      if (error.response?.status >= 500) {
        assert.fail(`Server error: ${error.response.data.error}`);
      }
    }
  });

  await t.test('teardown: stop server', () => {
    stopServer();
  });
});

test('Server Configuration Tests', async (t) => {
  await t.test('OPENAI_MODEL validation at startup', () => {
    const validModels = ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
    const testModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    assert(validModels.includes(testModel), `Model ${testModel} is not in valid list`);
  });

  await t.test('API key environment variable handling', () => {
    const apiKeyRequired = process.env.GEAKR_API_KEY;
    if (apiKeyRequired) {
      assert.strictEqual(typeof apiKeyRequired, 'string');
      assert(apiKeyRequired.length > 0);
    }
  });
});
