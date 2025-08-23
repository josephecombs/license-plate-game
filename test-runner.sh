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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root directory"
    echo "   Expected to find 'package.json' file"
    exit 1
fi

echo "📁 Root directory: $(pwd)"
echo "📁 Cloudflare worker directory: $(pwd)/cloudflare-oauth-worker"
echo ""

# Check if cloudflare-oauth-worker has node_modules
if [ ! -d "cloudflare-oauth-worker/node_modules" ]; then
    echo "📦 Installing cloudflare-oauth-worker dependencies..."
    cd cloudflare-oauth-worker
    npm install
    cd ..
    echo ""
fi

# Run all tests using the root npm script
echo "🚀 Starting test suite from root directory..."
echo ""

# Run the comprehensive test runner using root npm script
npm run test:all

# Capture exit code
EXIT_CODE=$?

echo ""
echo "🎯 Test execution completed"

# Exit with the test result code
exit $EXIT_CODE
