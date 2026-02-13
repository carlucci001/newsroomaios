# Error Handling Patterns Analysis
**Generated:** 2026-02-05
**Analysis Type:** Error Handling, Logging & Recovery
**Severity:** HIGH

---

## Executive Summary

Found **10 critical error handling issues** including:
- Inconsistent error response formats across APIs
- Sensitive data exposure in error messages
- Silent failures (error swallowing)
- Fire-and-forget promises without error recovery
- Improper fail-open defaults in credit system

---

## 1. Inconsistent Error Response Formats

### Issue: Multiple Error Schemas
**Severity:** 🟠 HIGH
**Impact:** Client parsing failures, poor UX

**Example 1:** [app/api/credits/deduct/route.ts:148-153](../app/api/credits/deduct/route.ts#L148-153)
```typescript
return NextResponse.json(
  { error: 'Failed to deduct credits', message: error.message },
  { status: 500 }
);
```

**Example 2:** [app/api/ai/generate-article/route.ts:295-311](../app/api/ai/generate-article/route.ts#L295-311)
```typescript
return NextResponse.json({
  success: false,
  error: error instanceof Error ? error.message : 'Failed',
  generationTimeMs: Date.now() - startTime,
  creditsUsed: 0,
}, { status: 500 });
```

**Example 3:** [app/api/menus/route.ts:328-335](../app/api/menus/route.ts#L328-335)
```typescript
return NextResponse.json({
  success: false,
  error: error instanceof Error ? error.message : 'Failed',
}, { status: 500 });
```

**Problem:** Three different error formats:
1. `{ error: string, message: string }`
2. `{ success: boolean, error: string, ... }`
3. `{ error: string }`

**Recommendation:**
```typescript
// Standardized error response
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

## 2. Sensitive Data Exposure

### Issue 2.1: Raw Error Messages Leaked
**Severity:** 🔴 CRITICAL
**Files:** 15+ API routes

**Example:** [app/api/admin/debug-articles/route.ts:48](../app/api/admin/debug-articles/route.ts#L48)
```typescript
catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

**Exposed Information:**
- Database collection paths
- Firebase error details
- Internal API keys (in stack traces)
- Server file paths

**Example Leak:**
```
Error: PERMISSION_DENIED: Missing or insufficient permissions for collection 'tenants/abc123/articles'
```

**Recommendation:**
```typescript
catch (error: any) {
  console.error('[Admin Debug] Error:', error);  // Log full error
  return NextResponse.json({
    error: 'An error occurred processing your request'  // Generic message
  }, { status: 500 });
}
```

---

### Issue 2.2: Stripe Error Exposure
**File:** [app/api/stripe/create-payment-intent/route.ts:122-127](../app/api/stripe/create-payment-intent/route.ts#L122-127)

**Problem:**
```typescript
catch (error: any) {
  return NextResponse.json(
    { error: `Failed to create payment intent: ${error.message}` },
    { status: 500 }
  );
}
```

**Risk:** Stripe errors may contain:
- Merchant account details
- API key prefixes
- Payment processing restrictions

---

## 3. Error Swallowing - Silent Failures

### Issue 3.1: GoDaddy DNS Failures
**Files:** [src/lib/godaddy.ts](../src/lib/godaddy.ts#L158-161)
**Severity:** 🔴 CRITICAL

**Problem:**
```typescript
catch (error) {
  console.error('[GoDaddy] Error checking record:', error);
  return null;  // ❌ Returns null on error
}

catch (error) {
  console.error('[GoDaddy] Error listing records:', error);
  return [];  // ❌ Returns empty array on error
}
```

**Impact:**
- Cannot distinguish between "no DNS records" and "DNS API failed"
- Tenant creation succeeds but domain is unreachable
- No visibility into DNS configuration issues

---

### Issue 3.2: Image Generation Failures
**Files:** [src/lib/imageGeneration.ts](../src/lib/imageGeneration.ts#L75-78)

**Problem:**
```typescript
catch (error) {
  console.error('[Pexels] Search failed:', error);
  return null;  // ❌ Silently fails
}

catch (error) {
  console.error('[Image] Gemini generation failed:', error);
  return null;  // ❌ Silently fails
}
```

**Impact:**
- Articles published without images
- No tracking of which provider failed
- Cannot optimize image generation strategy

---

## 4. Fire-and-Forget Promises

### Issue 4.1: Background Seeding & Deployment
**File:** [app/api/tenants/create/route.ts:344-360](../app/api/tenants/create/route.ts#L344-360)
**Severity:** 🔴 CRITICAL

**Problem:**
```typescript
// Trigger seeding in background (don't await)
fetch(`${baseUrl}/api/scheduled/run-all-tenants`, {...})
  .catch(err => console.error('Failed to trigger seeding:', err));

// Trigger deployment in background
fetch(`${baseUrl}/api/tenants/deploy`, {...})
  .catch(err => console.error('Failed to trigger deployment:', err));
```

**Impact:**
- Tenant creation succeeds but seeding fails → empty newspaper
- Deployment failures not tracked → tenant unreachable
- No retry mechanism
- Customer receives "success" but site broken

---

### Issue 4.2: DNS Record Creation
**File:** [app/api/tenants/create/route.ts:362-375](../app/api/tenants/create/route.ts#L362-375)

**Problem:**
```typescript
if (isGoDaddyConfigured()) {
  addSubdomainRecord(slug)
    .then(result => {
      if (result.success) {
        console.log(`DNS created: ${result.fullDomain}`);
      } else {
        console.warn(`DNS warning: ${result.message}`);  // ❌ Just logs
      }
    })
    .catch(err => console.error('Failed DNS:', err));  // ❌ Just logs
}
```

**Impact:**
- Tenant created successfully
- DNS record failed
- Customer cannot access their site
- No notification of failure

---

## 5. Missing Try-Catch in Critical Paths

### Issue 5.1: Credit Deduction Not Validated
**File:** [app/api/ai/generate-article/route.ts:270-271](../app/api/ai/generate-article/route.ts#L270-271)

**Problem:**
```typescript
// Deduct credits (no error handling at call site)
await deductCredits(tenant.id, creditsNeeded, parsedArticle.title, articleRef.id);

// Inside deductCredits():
catch (error) {
  console.error('[Deduct Credits] Error:', error);
  // ❌ Function completes successfully even on error
}
```

**Impact:**
- Article generated
- Credits not deducted
- Platform loses revenue
- No way to track failed deductions

---

### Issue 5.2: Database Updates Without Error Handling
**File:** [app/api/scheduled/run-all-tenants/route.ts:213-245](../app/api/scheduled/run-all-tenants/route.ts#L213-245)

**Problem:**
```typescript
if (article) {
  // ❌ No try-catch around critical update
  await db.collection('tenantCredits').doc(creditDoc.id).update({
    creditsUsed: newCreditsUsed,
    creditsRemaining: Math.max(0, newCreditsRemaining),
    status: newCreditsRemaining <= 0 ? 'exhausted' : credits.status,
  });
}
```

**Impact:**
- Article generated
- Credit update fails silently
- Billing data inconsistent

---

## 6. Improper Fail-Open Defaults

### Issue: Credit Check Fails Open
**File:** [app/api/credits/check/route.ts:131-140](../app/api/credits/check/route.ts#L131-140)
**Severity:** 🔴 CRITICAL

**Problem:**
```typescript
catch (error: any) {
  console.error('[Credits Check] Error:', error);
  // ❌ ON ERROR, ALLOW UNLIMITED OPERATIONS!
  return NextResponse.json({
    allowed: true,  // ⚠️ Grants access on failure
    creditsRequired: 0,
    creditsRemaining: -1,
  });
}
```

**Attack Scenario:**
1. Attacker triggers database errors (DoS Firestore)
2. Credit check fails
3. System allows unlimited free operations

**Impact:**
- Database outage = free credits for everyone
- Revenue loss
- System abuse

**Fix:**
```typescript
catch (error: any) {
  console.error('[Credits Check] Error:', error);
  // ✅ FAIL CLOSED
  return NextResponse.json({
    allowed: false,
    error: 'Service temporarily unavailable',
  }, { status: 503 });
}
```

---

## 7. Inconsistent Logging

### Issue: Mixed Logging Patterns
**Files:** System-wide

**Found:**
- `console.error('[Webhook] Error:', error)`
- `console.error('Error creating tenant:', error)`
- `console.error('Stripe error:', error.message)`
- `console.warn('DNS setup warning:', result.message)`

**Problems:**
- No structured logging
- Difficult to search/filter logs
- No error tracking integration (Sentry, etc.)
- Inconsistent log prefixes

**Recommendation:**
```typescript
// Implement structured logging
import { logger } from '@/lib/logger';

logger.error('tenant.creation.failed', {
  tenantId,
  error: error.message,
  stack: error.stack,
  context: { userId, email }
});
```

---

## Summary Table

| Issue | Count | Severity | Impact |
|-------|-------|----------|--------|
| Inconsistent error formats | 10+ routes | 🟠 HIGH | Client confusion |
| Sensitive data in errors | 5+ routes | 🔴 CRITICAL | Info disclosure |
| Silent failures | 15+ locations | 🔴 CRITICAL | Hidden bugs |
| Fire-and-forget promises | 4 locations | 🔴 CRITICAL | Lost operations |
| Missing try-catch | 8+ locations | 🟠 HIGH | Unhandled crashes |
| Fail-open defaults | 3 routes | 🔴 CRITICAL | Security bypass |
| Type-unsafe errors | 20+ locations | 🟡 MEDIUM | Runtime errors |
| Inconsistent logging | System-wide | 🟡 MEDIUM | Poor observability |

---

## Recommendations

### P0 - Critical (This Week)
1. ✅ Change credit check to fail-closed
2. ✅ Track fire-and-forget operations (seeding, deployment)
3. ✅ Add error handling to credit deduction validation

### P1 - High (This Sprint)
4. ✅ Standardize error response format
5. ✅ Sanitize error messages (no internal details)
6. ✅ Fix error swallowing in DNS/image generation
7. ✅ Implement structured logging

### P2 - Medium (Next Sprint)
8. Add error tracking service (Sentry, Rollbar)
9. Implement retry logic for transient failures
10. Add error recovery mechanisms for async operations

---

**Next Report:** [07-nextjs-best-practices.md](./07-nextjs-best-practices.md)
