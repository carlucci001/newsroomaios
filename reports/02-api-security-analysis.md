# API Security Analysis Report
**Generated:** 2026-02-05
**Analysis Type:** Authentication, Authorization & API Security
**Severity:** CRITICAL

---

## Executive Summary

Analyzed 25 API endpoints across 6 major route categories. Found **2 critical** and **5 high severity** security vulnerabilities requiring immediate remediation.

### Critical Issues
1. **Unauthenticated API key exposure** - `/api/tenants/get-api-key`
2. **Unverified Stripe webhooks** - Payment fraud risk
3. **Hardcoded test credentials in production code**

---

## 1. CRITICAL: Unauthenticated Endpoints

### Issue 1.1: API Key Exposure
**File:** [app/api/tenants/get-api-key/route.ts](../app/api/tenants/get-api-key/route.ts)
**Severity:** 🔴 CRITICAL
**CVSS Score:** 9.1/10

**Vulnerable Code:**
```typescript
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId');
  // ❌ NO AUTHENTICATION CHECK
  const tenantDoc = await db.collection('tenants').doc(tenantId).get();
  return NextResponse.json({
    tenantId: tenantDoc.id,
    businessName: tenant?.businessName,
    apiKey: tenant?.apiKey,  // ⚠️ EXPOSED!
    slug: tenant?.slug,
  });
}
```

**Attack Scenario:**
```bash
# Attacker can enumerate tenant IDs
curl "https://newsroomaios.vercel.app/api/tenants/get-api-key?tenantId=tenant_001"
# Returns: { "apiKey": "secret-api-key-123" }

# Now attacker can use this key for:
# - Generating unlimited articles
# - Accessing credit balance
# - Calling AI generation endpoints
```

**Impact:**
- Complete unauthorized access to tenant AI operations
- Credit theft
- API key enumeration attack

**Fix Required:**
```typescript
export async function GET(request: NextRequest) {
  // Add authentication
  const platformSecret = request.headers.get('X-Platform-Secret');
  if (platformSecret !== process.env.PLATFORM_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = request.nextUrl.searchParams.get('tenantId');
  // ... rest of code
}
```

---

### Issue 1.2: Hardcoded Test Credentials
**File:** [app/api/admin/seed-wnct/route.ts](../app/api/admin/seed-wnct/route.ts)
**Severity:** 🔴 CRITICAL
**CVSS Score:** 8.2/10

**Vulnerable Code:**
```typescript
export async function GET() {
  // ❌ NO AUTHENTICATION
  // ❌ Hardcoded credentials exposed
  const testTenant = {
    apiKey: 'wnct-api-key-2024',
    ownerEmail: 'carlfarring@gmail.com',
    businessName: 'WNC Times',
  };
  // Stores in Firestore
}
```

**Attack Scenario:**
```bash
# Anyone can call this endpoint
curl "https://newsroomaios.vercel.app/api/admin/seed-wnct"

# Gets hardcoded API key: wnct-api-key-2024
# Gets owner email for phishing
```

**Impact:**
- Test API key usable in production
- Personal email exposed for social engineering
- Test data pollution in production database

**Fix Required:**
1. Delete this endpoint or gate behind environment check
2. Remove hardcoded credentials
3. Add authentication

---

### Issue 1.3: Unauthenticated PII Collection
**File:** [app/api/onboarding/save/route.ts](../app/api/onboarding/save/route.ts)
**Severity:** 🟠 HIGH
**CVSS Score:** 7.1/10

**Vulnerable Code:**
```typescript
export async function POST(request: NextRequest) {
  const data = await request.json();
  // ❌ NO AUTHENTICATION
  const progressData: OnboardingProgress = {
    ownerEmail: data.ownerEmail,  // User-controlled
    newspaperName: data.newspaperName,
    serviceArea: data.serviceArea,
  };
  // Stores with predictable resumeToken
}
```

**Attack Scenario:**
- Spam fake onboarding data
- Harvest competitor email addresses
- Resume token prediction attack

**Fix Required:** Add email verification or session authentication

---

## 2. CRITICAL: Stripe Webhook Security

### Issue 2.1: Missing Signature Verification
**File:** [app/api/stripe/webhooks/route.ts](../app/api/stripe/webhooks/route.ts#L40-42)
**Severity:** 🔴 CRITICAL
**CVSS Score:** 9.8/10

**Vulnerable Code:**
```typescript
// ❌ NO SIGNATURE VERIFICATION
// For now, we'll process the event without full signature verification
const event = JSON.parse(body);
```

**Current Implementation:**
```typescript
const sig = request.headers.get('stripe-signature');
if (!sig) {
  return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
}

// ⚠️ Signature is checked but NOT VERIFIED
// Anyone can send fake events with any signature string
```

**Attack Scenario:**
```bash
# Attacker forges Stripe webhook
curl -X POST https://newsroomaios.vercel.app/api/stripe/webhooks \
  -H "stripe-signature: fake_signature" \
  -d '{
    "type": "invoice.payment_succeeded",
    "data": {
      "object": {
        "customer": "cus_victim",
        "amount_paid": 0,
        "lines": {
          "data": [{ "plan": { "id": "price_professional" } }]
        }
      }
    }
  }'

# Result: Victim gets 1000 free credits, subscription marked active
```

**Impact:**
- Unlimited free credits via forged events
- Subscription fraud
- Payment manipulation
- Business revenue loss

**Fix Required:**
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  try {
    // ✅ PROPER VERIFICATION
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Now process verified event
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
```

---

## 3. HIGH: Credit System Vulnerabilities

### Issue 3.1: Fail-Open Credit Checks
**File:** [app/api/credits/check/route.ts](../app/api/credits/check/route.ts#L133-139)
**Severity:** 🟠 HIGH
**CVSS Score:** 7.8/10

**Vulnerable Code:**
```typescript
catch (error: any) {
  console.error('[Credits Check] Error:', error);
  // ❌ ON ERROR, GRANT UNLIMITED CREDITS!
  return NextResponse.json({
    allowed: true,  // ⚠️ ALLOWS OPERATION
    creditsRequired: 0,
    creditsRemaining: -1,
  });
}
```

**Attack Scenario:**
1. Attacker triggers database errors (DoS, permission issues)
2. Credit check fails
3. System grants unlimited free operations

**Impact:**
- Database outage = free credits for everyone
- Malicious triggers can bypass credit limits

**Fix Required:**
```typescript
catch (error: any) {
  console.error('[Credits Check] Error:', error);
  // ✅ FAIL CLOSED
  return NextResponse.json({
    allowed: false,
    error: 'Credit check failed',
  }, { status: 500 });
}
```

---

### Issue 3.2: Unrestricted Field Updates
**File:** [app/api/admin/update-tenant/route.ts](../app/api/admin/update-tenant/route.ts#L65)
**Severity:** 🟠 HIGH

**Vulnerable Code:**
```typescript
await tenantRef.update({
  ...updates,  // ❌ NO FIELD WHITELIST!
  lastUpdatedAt: new Date(),
});
```

**Attack Scenario:**
```bash
curl -X POST /api/admin/update-tenant \
  -H "X-Platform-Secret: paper-partner-2024" \
  -d '{
    "tenantId": "victim",
    "updates": {
      "subscriptionCredits": 999999,
      "licensingStatus": "active",
      "status": "active"
    }
  }'
```

**Impact:** Attacker can modify ANY tenant field including credits, status, API keys

**Fix Required:** Implement field whitelist

---

## 4. HIGH: CORS Misconfiguration

### Issue 4.1: Allow All Origins
**Files:** 9 API routes
**Severity:** 🟠 HIGH

**Vulnerable Code:**
```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',  // ❌ ALLOWS ALL ORIGINS
  'Access-Control-Allow-Methods': 'GET, OPTIONS, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
};
```

**Attack Scenario:**
```html
<!-- Attacker's malicious website -->
<script>
fetch('https://newsroomaios.vercel.app/api/ai/generate-article', {
  method: 'POST',
  headers: {
    'X-Tenant-ID': 'stolen_id',
    'X-API-Key': 'stolen_key',
  },
  body: JSON.stringify({...})
});
</script>
```

**Impact:**
- Any website can make authenticated requests
- Cross-site request forgery (CSRF) attacks
- API key theft via XSS on external sites

**Fix Required:**
```typescript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
  // ...
};
```

---

## 5. Authentication Patterns Found

### Pattern A: Platform Secret (Internal)
**Used by:** 15+ routes
**Header:** `X-Platform-Secret`

**Strength:** ✅ Validates shared secret
**Weakness:** ⚠️ Has hardcoded fallback value

### Pattern B: Tenant API Key (External)
**Used by:** 5 routes
**Headers:** `X-Tenant-ID` + `X-API-Key`

**Strength:** ✅ Per-tenant unique keys
**Weakness:** ⚠️ Exposed via unauthenticated endpoint

### Pattern C: No Authentication
**Used by:** 3 routes
**Weakness:** 🔴 CRITICAL - Anyone can access

---

## Summary Table

| Route | Severity | Issue | Impact |
|-------|----------|-------|--------|
| `/api/tenants/get-api-key` | 🔴 CRITICAL | No auth | API key exposure |
| `/api/admin/seed-wnct` | 🔴 CRITICAL | Hardcoded creds | Test data in prod |
| `/api/stripe/webhooks` | 🔴 CRITICAL | No sig verify | Payment fraud |
| `/api/onboarding/save` | 🟠 HIGH | No auth | PII harvesting |
| `/api/admin/update-tenant` | 🟠 HIGH | No whitelist | Field manipulation |
| `/api/credits/*` | 🟠 HIGH | Fail-open | Bypass limits |
| All CORS-enabled routes | 🟠 HIGH | Allow * | CSRF attacks |
| `/api/scheduled/*` | 🟡 MEDIUM | Weak auth | Article spam |

---

## Immediate Action Items

### P0 - This Week
1. ✅ Add authentication to `/api/tenants/get-api-key`
2. ✅ Implement Stripe webhook signature verification
3. ✅ Remove hardcoded test data from `/api/admin/seed-wnct`
4. ✅ Remove `PLATFORM_SECRET` fallback value
5. ✅ Change credit check to fail-closed

### P1 - This Sprint
6. ✅ Add field whitelist to admin update endpoint
7. ✅ Restrict CORS to known origins
8. ✅ Add authentication to onboarding save
9. ✅ Add authentication to scheduled endpoints
10. ✅ Implement rate limiting on credit operations

---

**Next Report:** [03-firebase-security-rules.md](./03-firebase-security-rules.md)
