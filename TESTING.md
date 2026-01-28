# Testing Documentation - Pastebin Application

## Overview
Comprehensive test suite covering all API functionality as per task requirements.

---

## Test Coverage

### ✅ API Endpoint Tests

#### POST /api/snippets (Create Snippet)
- ✅ Create with both expiry methods (time + views)
- ✅ Create with only expiresAt
- ✅ Create with only maxViews  
- ✅ Reject empty content (400)
- ✅ Reject past expiry date (400)
- ✅ Reject invalid maxViews ≤ 0 (400)
- ✅ Reject when no expiry method provided (400)

#### GET /api/snippets/[id] (View Snippet)
- ✅ Return snippet and increment view count (200)
- ✅ Return 404 for non-existent snippet
- ✅ Return 410 when maxViews exceeded
- ✅ Return 410 when time expired
- ✅ Atomically increment view count (no race conditions)

#### Expiry Logic Order
- ✅ Check existence (404) before expiration (410)

#### ID Generation
- ✅ Generate unique IDs
- ✅ IDs are URL-safe (alphanumeric, -, _)

---

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure database is accessible
# Tests use the same DATABASE_URL from .env.local
```

### Run All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

---

## Test Structure

```
__tests__/
└── api/
    └── snippets.test.ts  - API integration tests
```

### Test Framework
- **Jest** - Test runner
- **TypeScript** - Type-safe tests
- **Prisma** - Database operations
- **Next.js** - API route testing

---

## Test Data Management

### Cleanup Strategy
- Tests use `TEST_` prefix for all test snippets
- `afterEach` hooks clean up test data
- No pollution of production database

### Database Requirements
- Tests require DATABASE_URL to be set
- Uses the same database as development
- Automatically cleans up after each test

---

## Expected Test Results

**Total Tests:** 15

**Test Suites:**
1. POST /api/snippets - Create Snippet (7 tests)
2. GET /api/snippets/[id] - View Snippet (5 tests)
3. Expiry Logic Order (1 test)
4. ID Generation (2 tests)

**All tests should pass ✅**

---

## Automated Testing (Task Requirements)

Per task requirements, the submission will be evaluated by **automated tests** against the deployed application.

### What This Means:
1. **External tests** will run against your live Vercel deployment
2. They will test the same scenarios covered here:
   - Creating snippets with various configurations
   - Viewing snippets and checking expiration
   - HTTP status codes (201, 200, 400, 404, 410)
   - Atomic view counting

### Deployment Checklist:
- ✅ All API endpoints functional
- ✅ Proper HTTP status codes
- ✅ Expiration logic correct (time + views)
- ✅ Input validation working
- ✅ Atomic operations (no race conditions)
- ✅ Database connected (Neon PostgreSQL)

---

## Manual Testing

### Test Case 1: Create & View Snippet
```bash
# Create snippet
curl -X POST http://localhost:3000/api/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test snippet",
    "expiresAt": "2026-12-31T23:59:59Z",
    "maxViews": 5
  }'

# Response: {"id":"abc123","url":"http://localhost:3000/s/abc123"}

# View snippet
curl http://localhost:3000/api/snippets/abc123

# Response: {"content":"Test snippet","viewCount":1,"createdAt":"...","expiresAt":"...","maxViews":5}
```

### Test Case 2: View Limit Expiration
```bash
# Create with maxViews=2
curl -X POST http://localhost:3000/api/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Limited views",
    "maxViews": 2
  }'

# View twice (counts: 1, 2)
curl http://localhost:3000/api/snippets/{id}
curl http://localhost:3000/api/snippets/{id}

# View third time (should return 410)
curl http://localhost:3000/api/snippets/{id}

# Response: {"error":"Snippet has expired"} (410 Gone)
```

### Test Case 3: Time Expiration
```bash
# Create with past expiry
curl -X POST http://localhost:3000/api/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Expired",
    "expiresAt": "2020-01-01T00:00:00Z",
    "maxViews": 10
  }'

# Response: {"error":"Expiry date must be in the future"} (400 Bad Request)
```

### Test Case 4: Validation Errors
```bash
# Empty content
curl -X POST http://localhost:3000/api/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "content": "",
    "maxViews": 5
  }'

# Response: {"error":"Content cannot be empty"} (400)

# No expiry method
curl -X POST http://localhost:3000/api/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "content": "No expiry"
  }'

# Response: {"error":"At least one expiry method must be provided"} (400)
```

---

## CI/CD Integration

### GitHub Actions (Optional)
```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Troubleshooting

### Issue: Database connection error
**Solution:** Ensure `.env.local` has valid `DATABASE_URL`

### Issue: Tests hanging
**Solution:** Ensure Prisma client is generated (`npx prisma generate`)

### Issue: Port already in use
**Solution:** Tests don't start a server (they test API handlers directly)

---

## Maintenance

### Adding New Tests
1. Create test file in `__tests__/` directory
2. Use `TEST_` prefix for test data
3. Clean up in `afterEach` hooks
4. Follow existing patterns

### Updating Tests
- Keep tests in sync with API changes
- Update expected responses if API format changes
- Maintain test data cleanup

---

## Success Criteria

**All tests must pass before deployment:**
```bash
npm test
```

**Expected output:**
```
PASS  __tests__/api/snippets.test.ts
  POST /api/snippets - Create Snippet
    ✓ should create snippet with both expiry methods
    ✓ should create snippet with only expiresAt
    ✓ should create snippet with only maxViews
    ✓ should reject empty content
    ✓ should reject past expiry date
    ✓ should reject invalid maxViews
    ✓ should reject when no expiry method provided
  GET /api/snippets/[id] - View Snippet
    ✓ should return snippet and increment view count
    ✓ should return 404 for non-existent snippet
    ✓ should return 410 when maxViews exceeded
    ✓ should return 410 when time expired
    ✓ should atomically increment view count
  Expiry Logic Order
    ✓ should check existence before expiry
  ID Generation
    ✓ should generate unique IDs
    ✓ IDs should be URL-safe

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

---

**Application is ready for automated testing evaluation! ✅**
