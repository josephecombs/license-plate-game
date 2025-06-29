#!/bin/bash

# Load nvm
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    echo "✅ nvm loaded"
else
    echo "❌ nvm not found. Please install nvm first."
    exit 1
fi

# Use the Node version from .nvmrc
if [ -f ".nvmrc" ]; then
    echo "📦 Using Node version: $(cat .nvmrc)"
    nvm use
else
    echo "📦 Using Node 18.20.8"
    nvm use 18.20.8
fi

echo "✅ Node version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Store the original directory
ORIGINAL_DIR=$(pwd)

# Start the development environment
echo "🚀 Starting development environment..."

# Start the Cloudflare worker in the background
echo "🔧 Starting Cloudflare worker..."
cd cloudflare-oauth-worker && npx wrangler dev &
WORKER_PID=$!

# Wait a moment for worker to start
sleep 3

# Start the React app from the original directory
echo "⚛️  Starting React app..."
cd "$ORIGINAL_DIR" && npm start

# Cleanup when React app exits
kill $WORKER_PID 2>/dev/null
echo "🛑 Development environment stopped" 