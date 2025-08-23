# Test Suite Documentation

This directory contains comprehensive tests for the License Plate Game Cloudflare Worker, covering all components with both happy path and edge case testing.

## 🧪 Test Structure

```
test/
├── constants/           # Tests for constants and configuration
│   └── states.test.js  # US states mapping validation
├── lib/                # Tests for shared utility libraries
│   ├── auth.test.js    # Authentication and session management
│   ├── cors.test.js    # CORS handling
│   ├── email.test.js   # Email functionality (AWS SES)
│   └── utils.test.js   # General utilities
├── routes/             # Tests for API route handlers
│   ├── auth.test.js    # OAuth and session routes
│   ├── game.test.js    # Game CRUD operations
│   ├── users.test.js   # User management (ban/unban)
│   ├── reports.test.js # Admin reports
│   └── debug.test.js   # Debug endpoints
├── durable-objects/    # Tests for Durable Object classes
│   ├── Game.test.js    # Game state management
│   └── User.test.js    # User data management
├── index.test.js       # Main router tests
├── run-tests.js        # Test runner script
└── README.md           # This file
```

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests
npm run test:all

# Run tests in watch mode (development)
npm run test:watch

# Run all tests once
npm run test:run
```

### Individual Test Categories
```bash
# Test specific components
npm run test:constants      # Constants and configuration
npm run test:lib           # Shared libraries
npm run test:routes        # API route handlers
npm run test:durable-objects # Durable Objects
npm run test:router        # Main router
```

### Advanced Testing
```bash
# Generate coverage report
npm run test:coverage

# Run with UI (if @vitest/ui is installed)
npm run test:ui

# Run specific test file
npx vitest run test/lib/auth.test.js
```

## 📋 Test Coverage

### Constants (`constants/`)
- **states.test.js**: Validates US states mapping
  - ✅ All 51 states (50 + DC) present
  - ✅ Correct format (2-letter codes to full names)
  - ✅ No duplicates or empty values
  - ✅ Edge cases: invalid codes, malformed data

### Libraries (`lib/`)
- **auth.test.js**: Authentication utilities
  - ✅ Session validation (valid, expired, missing)
  - ✅ Admin privilege checks
  - ✅ User data retrieval
  - ✅ Edge cases: malformed sessions, missing data

- **cors.test.js**: CORS handling
  - ✅ All HTTP methods supported
  - ✅ Preflight OPTIONS requests
  - ✅ Custom headers handling
  - ✅ Edge cases: special characters, different origins

- **email.test.js**: Email functionality
  - ✅ AWS SES integration
  - ✅ HTML and plain text support
  - ✅ Custom from addresses
  - ✅ Edge cases: invalid emails, missing credentials, errors

- **utils.test.js**: General utilities
  - ✅ Email anonymization
  - ✅ License plate state detection
  - ✅ Edge cases: empty input, malformed data, special characters

### Routes (`routes/`)
- **auth.test.js**: OAuth and session management
  - ✅ OAuth callback handling
  - ✅ Session validation
  - ✅ Edge cases: missing parameters, network errors, malformed responses

- **game.test.js**: Game operations
  - ✅ CRUD operations (Create, Read, Update, Delete)
  - ✅ Authentication requirements
  - ✅ Admin-only operations
  - ✅ Edge cases: invalid data, missing fields, storage errors

- **users.test.js**: User management
  - ✅ User banning/unbanning
  - ✅ Admin privilege requirements
  - ✅ Edge cases: non-existent users, already banned, missing data

- **reports.test.js**: Admin reports
  - ✅ Game data retrieval
  - ✅ Pagination support
  - ✅ Admin-only access
  - ✅ Edge cases: invalid parameters, missing data

- **debug.test.js**: Debug endpoints
  - ✅ Environment variable exposure
  - ✅ System information
  - ✅ Admin-only access
  - ✅ Edge cases: missing env vars, different request methods

### Durable Objects (`durable-objects/`)
- **Game.test.js**: Game state management
  - ✅ Data persistence and retrieval
  - ✅ Validation (states, plates, user IDs)
  - ✅ Edge cases: invalid data, storage errors, malformed input

- **User.test.js**: User data management
  - ✅ User creation and updates
  - ✅ Ban/unban functionality
  - ✅ Data validation
  - ✅ Edge cases: invalid emails, missing fields, storage errors

### Router (`index.test.js`)
- **Main router**: Request routing
  - ✅ All routes properly mapped
  - ✅ HTTP method handling
  - ✅ Edge cases: unknown routes, malformed URLs, missing data

## 🎯 Testing Philosophy

Our testing approach follows these principles:

### Happy Path Testing
- ✅ Valid input produces expected output
- ✅ Normal operations complete successfully
- ✅ Standard use cases work as intended

### Edge Case Testing
- ❌ Invalid input is handled gracefully
- ❌ Missing data doesn't crash the system
- ❌ Error conditions are properly managed
- ❌ Boundary conditions are tested

### Security Testing
- 🔒 Authentication is required where needed
- 🔒 Admin privileges are properly enforced
- 🔒 Sensitive data is not exposed
- 🔒 Input validation prevents attacks

## 🛠️ Test Configuration

Tests use **Vitest** with Cloudflare Workers support:

```javascript
// vitest.config.js
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
  },
});
```

## 📊 Test Metrics

- **Total Test Files**: 12
- **Test Categories**: 5
- **Coverage Areas**: Constants, Libraries, Routes, Durable Objects, Router
- **Test Types**: Unit tests, integration tests, edge case tests

## 🚨 Troubleshooting

### Common Issues

1. **Mock Import Errors**
   ```bash
   # Ensure mocks are properly set up
   vi.mock('../src/lib/auth.js', () => ({
     validateSession: vi.fn(),
     isAdmin: vi.fn()
   }));
   ```

2. **Environment Variable Issues**
   ```bash
   # Set required environment variables for tests
   export AWS_ACCESS_KEY_ID=test-key
   export AWS_SECRET_ACCESS_KEY=test-secret
   ```

3. **Cloudflare Workers Context**
   ```bash
   # Mock Cloudflare Workers context
   const mockContext = {
     waitUntil: vi.fn()
   };
   ```

### Running Tests in Isolation
```bash
# Run single test file
npx vitest run test/lib/auth.test.js

# Run tests matching pattern
npx vitest run --reporter=verbose --grep="auth"

# Debug failing tests
npx vitest run --reporter=verbose --grep="should handle"
```

## 🔄 Continuous Integration

Tests are designed to run in CI/CD environments:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    cd cloudflare-oauth-worker
    npm run test:run
    npm run test:coverage
```

## 📝 Adding New Tests

When adding new functionality:

1. **Create test file** in appropriate directory
2. **Follow naming convention**: `component.test.js`
3. **Include both happy path and edge cases**
4. **Mock external dependencies**
5. **Test error conditions**
6. **Update this README**

Example test structure:
```javascript
describe('Component Name', () => {
  describe('happy path', () => {
    it('should work with valid input', async () => {
      // Test implementation
    });
  });

  describe('edge cases', () => {
    it('should handle invalid input gracefully', async () => {
      // Test implementation
    });
  });
});
```

## 🎉 Success Criteria

Tests pass when:
- ✅ All happy path scenarios work
- ✅ All edge cases are handled gracefully
- ✅ No security vulnerabilities are introduced
- ✅ Performance remains acceptable
- ✅ Code coverage is maintained

---

**Happy Testing! 🧪✨**
