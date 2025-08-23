#!/bin/bash

# Test Runner Script for License Plate Game
# Run this from the root directory to execute all tests

echo "🧪 License Plate Game - Test Suite Runner"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "cloudflare-oauth-worker" ]; then
    echo "❌ Error: Please run this script from the root directory"
    echo "   Expected to find 'cloudflare-oauth-worker' directory"
    exit 1
fi

# Change to the cloudflare-oauth-worker directory
cd cloudflare-oauth-worker

echo "📁 Running tests from: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Run all tests
echo "🚀 Starting test suite..."
echo ""

# Run the comprehensive test runner
npm run test:all

# Capture exit code
EXIT_CODE=$?

echo ""
echo "🎯 Test execution completed"

# Exit with the test result code
exit $EXIT_CODE
