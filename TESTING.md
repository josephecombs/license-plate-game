# Testing Guide

This project has two main testing areas:

## 🧪 React App Tests (Frontend)
```bash
# Run React app tests
npm test

# Run React app tests in watch mode
npm test -- --watch
```

## 🚀 Cloudflare Worker Tests (Backend)
```bash
# Run all worker tests
npm run test:all

# Run worker tests in watch mode
npm run test:worker:watch

# Run specific test categories
npm run test:worker:constants      # Constants
npm run test:worker:lib           # Libraries  
npm run test:worker:routes        # API routes
npm run test:worker:durable-objects # Durable Objects
npm run test:worker:router        # Main router

# Generate coverage report
npm run test:worker:coverage
```

## 🎯 Quick Start
```bash
# Run all backend tests from root
./test-runner.sh

# Or use npm
npm run test:all
```

## 📁 Test Structure
- **Frontend tests**: React components and utilities
- **Backend tests**: Cloudflare Worker API, routes, and Durable Objects
- **Test runner**: `./test-runner.sh` for easy execution from root

## 🚨 Troubleshooting
If you get "Missing script" errors, make sure you're running commands from the root directory where the main `package.json` is located.
