# Testing Recommendations Report
**Generated:** 2026-02-05
**Analysis Type:** Test Coverage Strategy & Critical Paths
**Priority:** HIGH

---

## Executive Summary

**Current Test Status:** ❌ NO TESTS IMPLEMENTED

**Test Framework:** ⚠️ NOT CONFIGURED (Jest not installed)

**Critical Paths Identified:** 12 high-risk areas requiring immediate test coverage

**Estimated Tests Needed:** 150-200 tests

---

## 1. CURRENT TEST SETUP STATUS

**Directory Structure:**
```
tests/
├── setup.ts       ✓ Exists (empty template)
└── README.md      ✓ Exists (setup instructions)
```

**Missing:**
- Jest configuration
- Testing dependencies (not installed)
- Mock infrastructure for Firebase, Stripe, Gemini
- Test files (0 tests exist)
- Coverage configuration

---

## 2. CRITICAL PATHS REQUIRING TESTS (Priority Order)

### P0 - Payment & Credit System (HIGHEST RISK)

#### 2.1: Credit Deduction Logic
**File:** [app/api/credits/deduct/route.ts](../app/api/credits/deduct/route.ts)
**Risk:** 🔴 CRITICAL - Revenue loss if broken
**Tests Needed:** 15 tests

**Test Scenarios:**
```
✓ Deduct credits when balance sufficient
✓ Deduct credits exceeding soft limit (warn)
✓ Deduct credits exceeding hard limit (deny)
✓ Handle overage accumulation
✓ Concurrent deduction requests (race conditions)
✓ Deduct from tenant with no credit allocation
✓ Verify creditsUsed + creditsRemaining = monthlyAllocation
✓ Transaction logging on every deduction
✓ Status updates (active → warning → exhausted)
✓ Negative balance scenario
✓ Quantity > 1 (bulk deductions)
✓ Suspended tenant cannot deduct
✓ Invalid action type rejection
✓ Error handling (fail closed)
✓ Credit reset on billing cycle
```

---

#### 2.2: Credit Check Logic
**File:** [app/api/credits/check/route.ts](../app/api/credits/check/route.ts)
**Risk:** 🔴 CRITICAL - Bypass = free services
**Tests Needed:** 10 tests

**Test Scenarios:**
```
✓ Check with sufficient credits → allow
✓ Check exceeding hard limit → deny + mark exhausted
✓ Check hitting soft limit (first time) → warn
✓ Check hitting soft limit (already warned) → no duplicate
✓ Suspended tenant → always deny
✓ No allocation → allow + log warning
✓ Concurrent checks don't duplicate warnings
✓ Error scenarios → fail closed (deny access)
✓ creditsRemaining calculation accuracy
✓ Action cost lookup from CREDIT_COSTS
```

---

#### 2.3: Stripe Webhook Handler
**File:** [app/api/stripe/webhooks/route.ts](../app/api/stripe/webhooks/route.ts)
**Risk:** 🔴 CRITICAL - Payment fraud potential
**Tests Needed:** 12 tests

**Test Scenarios:**
```
✓ Payment succeeded → reset credits, update dates
✓ Payment succeeded → create invoice record
✓ Payment failed → mark tenant as past_due
✓ Subscription updated → update licensing status
✓ Subscription deleted → cancel + suspend
✓ Missing customer in database → log warning
✓ Invalid event type → graceful handling
✓ Idempotent handling (duplicate events)
✓ Database failures don't crash webhook
✓ Credit allocation matches plan tier
✓ Signature verification (when implemented)
✓ Webhook without signature → reject
```

---

### P1 - Article Generation Pipeline

#### 2.4: Article Generation Flow
**File:** [app/api/ai/generate-article/route.ts](../app/api/ai/generate-article/route.ts)
**Risk:** 🔴 CRITICAL - Core business function
**Tests Needed:** 25 tests

**Integration Test Scenarios:**
```
SUCCESSFUL GENERATION:
✓ Full flow with web search + image + SEO
✓ Generation without web search
✓ Generation with minimal source content
✓ Generation with image disabled
✓ Custom model and temperature settings

CREDIT CHECKING:
✓ Reject if insufficient credits
✓ Deduct correct amounts (base + features)
✓ Calculate: article + search + SEO + image costs

SOURCE VALIDATION:
✓ Weak source material → warning + proceed
✓ Invalid source material → reject
✓ No source + no search → error

SLUG HANDLING:
✓ Generate unique slug first time
✓ Detect collision → add entropy suffix
✓ Max attempts exceeded → error
✓ Verify uniqueness in database

ERROR HANDLING:
✓ Missing categoryId → 400
✓ Suspended tenant → 401
✓ Invalid category → 400
✓ Gemini API failure → 500 (no credit deduction)
✓ Database write failure → rollback

METADATA:
✓ Preserve promptsUsed
✓ Store generationMetadata correctly
✓ Track generation time
```

---

#### 2.5: Tenant Creation
**File:** [app/api/tenants/create/route.ts](../app/api/tenants/create/route.ts)
**Risk:** 🟠 HIGH - Onboarding critical
**Tests Needed:** 12 tests

**Test Scenarios:**
```
✓ Create tenant with all required fields
✓ Reject duplicate domain
✓ Verify unique API key generation
✓ Initial credits match selected plan
✓ creditTransactions record created
✓ Exactly 6 categories required
✓ Admin user creation in Firebase Auth
✓ User linked to tenant properly
✓ siteConfig and collections seeded
✓ Temporary password generated
✓ serviceArea boundary validation
✓ Timestamps accurate (createdAt, trialEndsAt)
```

---

### P2 - Authentication & Security

#### 2.6: Authentication Validation
**Files:** Multiple API routes
**Risk:** 🔴 CRITICAL - Security bypass
**Tests Needed:** 12 tests

**Test Scenarios:**
```
✓ Accept valid platform secret + tenantId
✓ Accept valid API key + tenantId
✓ Reject invalid platform secret
✓ Reject invalid API key
✓ Reject missing tenantId
✓ Reject missing auth headers
✓ Case-insensitive header handling
✓ Suspended tenants cannot proceed
✓ Log authentication failures
✓ Rate limiting (if implemented)
✓ API key enumeration prevention
✓ Platform secret fallback disabled
```

---

## 3. UNIT TESTS (Isolated Logic)

### 3.1: Article Parser
**File:** [src/lib/articleParser.ts](../src/lib/articleParser.ts)
**Tests Needed:** 8 tests

```
✓ Parse well-formed Gemini response
✓ Handle missing optional fields
✓ Sanitize HTML in content
✓ Extract metadata correctly
✓ Handle malformed JSON
✓ Preserve markdown formatting
✓ Handle empty response
✓ Parse with unusual characters
```

---

### 3.2: Gemini Integration
**File:** [src/lib/gemini.ts](../src/lib/gemini.ts)
**Tests Needed:** 8 tests

```
✓ Generate content with valid prompt
✓ Handle API rate limits
✓ Handle API errors
✓ Validate temperature range
✓ Validate maxTokens
✓ Handle timeout scenarios
✓ Parse response format
✓ Handle empty responses
```

---

## 4. MOCKING STRATEGY

### 4.1: Firebase Mocking
**File:** `tests/mocks/firebase.ts`

```typescript
import { jest } from '@jest/globals';

export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
    })),
    where: jest.fn(() => ({
      get: jest.fn(),
    })),
  })),
};
```

---

### 4.2: Stripe Mocking
**File:** `tests/mocks/stripe.ts`

```typescript
export const mockStripe = {
  customers: {
    create: jest.fn(),
    list: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};
```

---

### 4.3: Gemini Mocking
**File:** `tests/mocks/gemini.ts`

```typescript
export const mockGemini = {
  generateContent: jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        title: 'Test Article',
        content: 'Test content...',
      }),
    },
  }),
};
```

---

## 5. TEST SETUP COMMANDS

### Install Dependencies
```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @types/jest \
  ts-jest \
  jest-mock-extended \
  firebase-mock
```

### Create Jest Config
**File:** `jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'src/lib/**/*.ts',
    '!**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
    },
    './app/api/credits/': { lines: 95 },  // Critical
    './app/api/stripe/': { lines: 95 },   // Critical
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

---

## 6. EXAMPLE TEST FILE

**File:** `tests/unit/api/credits/deduct.test.ts`

```typescript
import { POST } from '@/app/api/credits/deduct/route';
import { mockFirestore } from '@/tests/mocks/firebase';

describe('Credit Deduction API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deduct credits when balance sufficient', async () => {
    // Arrange
    mockFirestore.collection.mockReturnValueOnce({
      where: jest.fn().mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          empty: false,
          docs: [{
            id: 'credit_123',
            data: () => ({
              subscriptionCredits: 100,
              creditsUsed: 50,
              status: 'active',
            }),
          }],
        }),
      }),
    });

    const request = new Request('http://localhost/api/credits/deduct', {
      method: 'POST',
      headers: {
        'X-Platform-Secret': 'test-secret',
      },
      body: JSON.stringify({
        tenantId: 'test-tenant',
        action: 'article_generation',
        quantity: 1,
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.creditsRemaining).toBe(45);  // 100 - 50 - 5
  });

  it('should deny when exceeding hard limit', async () => {
    // Test implementation
  });
});
```

---

## 7. IMPLEMENTATION TIMELINE

### Week 1: Setup
- Install Jest and dependencies
- Create mock infrastructure
- Configure jest.config.js
- Write first 5 tests (learning phase)

### Week 2-3: Critical Path Tests
- Credit deduction (15 tests)
- Credit check (10 tests)
- Stripe webhook (12 tests)
- Authentication (12 tests)

### Week 4-5: Integration Tests
- Article generation (25 tests)
- Tenant creation (12 tests)
- Payment intent (10 tests)

### Week 6: Component & Edge Cases
- Parser tests (8 tests)
- Gemini integration (8 tests)
- Edge case coverage

---

## 8. COVERAGE GOALS

| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| Credit system | 0% | 95% | P0 |
| Stripe webhooks | 0% | 95% | P0 |
| Article generation | 0% | 90% | P0 |
| Authentication | 0% | 95% | P0 |
| Tenant creation | 0% | 85% | P1 |
| Utils & parsers | 0% | 80% | P2 |
| **Overall** | **0%** | **85%** | |

---

## 9. CRITICAL EDGE CASES TO TEST

```
🔴 CRITICAL EDGE CASES:
1. Race conditions in credit deduction
2. Webhook idempotency (duplicate events)
3. Slug collision with simultaneous generation
4. Credit overflow on plan upgrades
5. Tenant suspension mid-article generation
6. Authentication bypass attempts
7. Database transaction failures
8. API timeout scenarios
9. Malformed Gemini responses
10. Firebase permission errors
```

---

## 10. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## Summary

**Total Tests Recommended:** 150-200 tests

**Timeline:** 4-6 weeks with 1 developer

**ROI:** Prevent revenue loss from credit system bugs, payment fraud, and broken article generation

---

**Next Report:** [00-executive-summary.md](./00-executive-summary.md) (Master Index)
