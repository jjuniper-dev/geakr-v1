#!/bin/bash
# Phase 0: Capture baseline response structure
# Run this to save the current /extract response as the baseline contract

set -e

BASELINE_FILE=".baseline-response.json"
TEST_API_KEY="baseline-test-key"
TEST_URL="https://httpbin.org/html"
PORT=3002

echo "🚀 Phase 0: Capturing Baseline Response"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start server
export PORT=$PORT
export OPENAI_API_KEY="sk-baseline-test"
export OPENAI_MODEL="gpt-4o-mini"
export GEAKR_API_KEY="$TEST_API_KEY"
export NODE_ENV="test"

echo "Starting server on port $PORT..."
node apps/mobile-capture/server.js > /tmp/baseline-server.log 2>&1 &
SERVER_PID=$!

sleep 2

# Wait for server to be ready
for i in {1..30}; do
  if curl -s http://localhost:$PORT/ > /dev/null 2>&1; then
    echo "✓ Server ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
  sleep 0.5
done

echo ""
echo "Capturing baseline response from /extract..."
echo "  URL: $TEST_URL"
echo "  Classification: public"
echo "  Context: public"

RESPONSE=$(curl -s -X POST http://localhost:$PORT/extract \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $TEST_API_KEY" \
  -d "{
    \"url\": \"$TEST_URL\",
    \"sourceClassification\": \"public\",
    \"contextLayer\": \"public\"
  }")

echo ""
echo "Response received:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Extract key fields for display
OK=$(echo "$RESPONSE" | jq '.ok')
STATUS=$(echo "$RESPONSE" | jq -r '.status')
PIPELINE=$(echo "$RESPONSE" | jq -r '.capture_pipeline_version')
GATE_DECISION=$(echo "$RESPONSE" | jq -r '.gate.decision')

echo "✓ Ok: $OK"
echo "✓ Status: $STATUS"
echo "✓ Pipeline: $PIPELINE"
echo "✓ Gate Decision: $GATE_DECISION"

# Save normalized baseline (remove sensitive/dynamic data)
BASELINE=$(echo "$RESPONSE" | jq '{
  ok: .ok,
  status: .status,
  capture_pipeline_version: .capture_pipeline_version,
  gate: {
    decision: .gate.decision,
    effectiveMode: .gate.effectiveMode,
    reason: .gate.reason,
    allowedOperations: .gate.allowedOperations
  },
  audit: {
    decision: .audit.decision,
    decision_reason: .audit.decision_reason,
    gate_version: .audit.gate_version,
    sanitizer_version: .audit.sanitizer_version,
    source_classification: .audit.source_classification,
    context_layer: .audit.context_layer,
    runtime_mode: .audit.runtime_mode,
    allowed_operations: .audit.allowed_operations
  },
  sanitizer: {
    version: .sanitizer.version
  }
}')

echo "$BASELINE" > "$BASELINE_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Baseline captured to: $BASELINE_FILE"
echo ""
echo "📋 BASELINE CONTRACT LOCKED IN"
echo ""
echo "This file is the contract that must be preserved during refactoring."
echo "If /extract behavior changes, compare against this baseline to debug."
echo ""

# Cleanup
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo "✓ Server stopped"
