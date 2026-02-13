# Firebase Security Rules Analysis
**Generated:** 2026-02-05
**Analysis Type:** Firestore & Cloud Storage Security
**Severity:** CRITICAL

---

## Executive Summary

**Status:** 🔴 CRITICAL - Security rules are WIDE OPEN

Both Firestore and Cloud Storage rules allow unauthenticated read/write access to sensitive data including:
- Tenant API keys and Stripe customer IDs
- Credit balances and transactions
- Personal user information
- Business settings and configurations

---

## 1. Firestore Security Rules Analysis

**File:** [firestore.rules](../firestore.rules)

### Critical Issues Found: 15+ collections with `allow read, write: if true`

### Issue 1.1: Tenant Data Completely Open
**Lines:** 29-38

```javascript
match /tenants/{tenantId} {
  allow read: if true;   // ❌ ANYONE CAN READ
  allow write: if true;  // ❌ ANYONE CAN WRITE

  // Tenant subcollections (meta, articles, etc.)
  match /{subcollection}/{docId} {
    allow read: if true;   // ❌ ALL TENANT DATA EXPOSED
    allow write: if true;
  }
}
```

**Exposed Data:**
- `apiKey` - Tenant API authentication keys
- `stripeCustomerId` - Stripe customer IDs
- `ownerEmail` - Personal email addresses
- `subscriptionCredits` - Credit balances
- `licensingStatus` - Account status
- Articles, categories, site config

**Attack Scenario:**
```javascript
// Any website can execute this in browser console:
const db = firebase.firestore();
const tenants = await db.collection('tenants').get();

tenants.forEach(doc => {
  const apiKey = doc.data().apiKey;
  const stripeId = doc.data().stripeCustomerId;
  const email = doc.data().ownerEmail;

  console.log(`Stolen: ${apiKey} from ${email}`);
});

// Result: Attacker has ALL tenant API keys and customer data
```

**Impact:**
- Complete data breach
- API key theft
- PII exposure (GDPR violation)
- Stripe customer ID exposure

---

### Issue 1.2: Credit System Open
**Lines:** 49-71

```javascript
// TENANT CREDITS
match /tenantCredits/{creditId} {
  allow read: if true;   // ❌ ANYONE CAN READ
  allow write: if true;  // ❌ ANYONE CAN WRITE
}

// CREDIT TRANSACTIONS
match /creditTransactions/{transactionId} {
  allow read: if true;
  allow write: if true;
}
```

**Attack Scenario:**
```javascript
// Attacker can modify credits
await db.collection('tenantCredits').doc('victim').update({
  subscriptionCredits: 999999,
  status: 'active',
  licensingStatus: 'active'
});

// Or view all transactions
const transactions = await db.collection('creditTransactions').get();
// Sees all business financial data
```

**Impact:**
- Unlimited free credits via direct database manipulation
- Revenue transaction data exposed
- Billing history visible to anyone

---

### Issue 1.3: Settings & Config Open
**Lines:** 76-113

```javascript
// PLATFORM SETTINGS
match /settings/{settingId} {
  allow read: if true;
  allow write: if true;  // ❌ "TODO: restrict in production"
}

// ADS / ADVERTISING
match /ads/{adId} {
  allow read: if true;
  allow write: if true;  // ❌ "TODO: restrict in production"
}

// SITE CONFIG / MODULES
match /siteConfig/{configId} {
  allow read: if true;
  allow write: if true;  // ❌ "TODO: restrict in production"
}

// CATEGORIES
match /categories/{categoryId} {
  allow read: if true;
  allow write: if true;  // ❌ "TODO: restrict in production"
}
```

**Attack Scenario:**
```javascript
// Attacker can modify platform settings
await db.collection('settings').doc('global').update({
  maintenanceMode: true,
  suspendAllTenants: true
});

// Or inject malicious ads
await db.collection('ads').add({
  type: 'malicious',
  scriptUrl: 'https://evil.com/malware.js'
});
```

**Impact:**
- Platform-wide configuration tampering
- Malicious ad injection
- Category manipulation

---

### Issue 1.4: Admin Check is a No-Op
**Lines:** 13-17

```javascript
// Simplified admin check - any authenticated user for now
// TODO: Add proper role-based access in production
function isAdmin() {
  return isAuthenticated();  // ❌ ANY AUTH USER = ADMIN
}
```

**Impact:** Any Firebase authenticated user has admin privileges

---

### Issue 1.5: Onboarding Progress Open
**Lines:** 22-24

```javascript
match /onboardingProgress/{progressId} {
  allow read, write: if true;  // ❌ TEMPORARY SESSION DATA EXPOSED
}
```

**Exposed Data:**
- Business names
- Service areas
- Owner emails
- Selected categories

---

## 2. Cloud Storage Security Rules

**File:** [storage.rules](../storage.rules)

### Issue 2.1: Authenticated Upload to Any Path
**Lines:** 7-31

```javascript
// Banner images
match /banners/{advertiserId}/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null;  // ❌ ANY AUTH USER
}

// Business images
match /businesses/{businessId}/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null;  // ❌ ANY AUTH USER
}

// User profile images
match /users/{userId}/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == userId;
  // ✅ GOOD - User can only write their own
}
```

**Attack Scenario:**
```javascript
// Authenticated user uploads malicious content
const ref = storage.ref('banners/competitor_advertiser/malware.html');
await ref.put(maliciousFile);

// Or uploads to any business folder
const bizRef = storage.ref('businesses/victim_business/fake-logo.svg');
await bizRef.put(brandTheftImage);
```

**Impact:**
- Malicious file hosting
- Brand theft via image replacement
- Storage quota exhaustion attacks

---

## 3. Recommended Firestore Rules (Secure Version)

### Tenant Rules (Example Fix)
```javascript
match /tenants/{tenantId} {
  // ✅ Public can read basic info only
  allow read: if true;

  // ✅ Only authenticated admins or tenant owner can write
  allow update: if isAdmin() || isTenantOwner(tenantId);
  allow delete: if isAdmin();

  // ✅ Protected fields should be server-only
  allow read: if resource.data.keys().hasAll(['apiKey', 'stripeCustomerId']) == false;

  // ✅ Articles can be public
  match /articles/{articleId} {
    allow read: if true;
    allow write: if isAdmin() || isTenantOwner(tenantId);
  }
}
```

### Credit Rules (Example Fix)
```javascript
match /tenantCredits/{creditId} {
  // ✅ Only tenant can read their own credits
  allow read: if isAuthenticated() &&
                 request.auth.uid == resource.data.ownerId;

  // ✅ Only server (via Admin SDK) can write
  allow write: if false;  // Server-side only
}

match /creditTransactions/{transactionId} {
  // ✅ Read-only for tenant owner
  allow read: if isAuthenticated() &&
                 request.auth.uid == resource.data.ownerId;

  // ✅ Server-side writes only
  allow create, update, delete: if false;
}
```

### Settings Rules (Example Fix)
```javascript
match /settings/{settingId} {
  // ✅ Anyone can read settings
  allow read: if true;

  // ✅ Only true admins can write
  allow write: if isRealAdmin();  // Check custom claims
}
```

---

## 4. Helper Functions Needed

```javascript
function isRealAdmin() {
  return request.auth != null &&
         request.auth.token.admin == true;  // Custom claim
}

function isTenantOwner(tenantId) {
  return request.auth != null &&
         get(/databases/$(database)/documents/tenants/$(tenantId))
           .data.ownerId == request.auth.uid;
}

function isResourceOwner(ownerId) {
  return request.auth != null &&
         request.auth.uid == ownerId;
}
```

---

## 5. Cloud Storage Rules (Secure Version)

```javascript
match /banners/{advertiserId}/{allPaths=**} {
  allow read: if true;
  // ✅ Only the advertiser or admin can upload
  allow write: if request.auth != null &&
                  (request.auth.uid == advertiserId || isAdmin());
}

match /businesses/{businessId}/{allPaths=**} {
  allow read: if true;
  // ✅ Only business owner or admin
  allow write: if request.auth != null &&
                  (isBusinessOwner(businessId) || isAdmin());
}

match /users/{userId}/{allPaths=**} {
  allow read: if true;
  // ✅ Already correct
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Summary of Violations

| Collection | Current | Severity | Exposed Data |
|------------|---------|----------|--------------|
| `tenants` | `allow all: if true` | 🔴 CRITICAL | API keys, Stripe IDs, emails |
| `tenantCredits` | `allow all: if true` | 🔴 CRITICAL | Credit balances |
| `creditTransactions` | `allow all: if true` | 🔴 CRITICAL | Revenue data |
| `settings` | `allow all: if true` | 🟠 HIGH | Platform config |
| `ads` | `allow all: if true` | 🟠 HIGH | Ad content |
| `siteConfig` | `allow all: if true` | 🟠 HIGH | Tenant config |
| `categories` | `allow all: if true` | 🟡 MEDIUM | Editorial data |
| `onboardingProgress` | `allow all: if true` | 🟡 MEDIUM | Business PII |
| `aiJournalists` | `allow all: if true` | 🟡 MEDIUM | AI config |
| Storage `/banners` | Auth write to any | 🟠 HIGH | File hosting abuse |
| Storage `/businesses` | Auth write to any | 🟠 HIGH | Brand theft |

---

## Immediate Action Plan

### P0 - URGENT (Today/Tomorrow)
1. ✅ Restrict `tenants` collection to protect API keys
2. ✅ Lock down `tenantCredits` and `creditTransactions` (server-only)
3. ✅ Test rules in Firestore emulator before deployment
4. ✅ Deploy new rules to production

### P1 - High Priority (This Week)
5. ✅ Implement proper admin role using custom claims
6. ✅ Restrict `settings`, `ads`, `siteConfig` to admin-only writes
7. ✅ Add owner checks to storage rules
8. ✅ Audit existing data for unauthorized modifications

### P2 - Medium Priority (This Sprint)
9. Implement field-level security for sensitive tenant fields
10. Add read restrictions to transaction history
11. Set up Firebase security rule testing in CI/CD
12. Create monitoring for rule violations

---

## Testing New Rules

```bash
# Install Firebase emulator
npm install -g firebase-tools

# Test rules locally
firebase emulators:start --only firestore

# Run rule tests
firebase emulators:exec --only firestore "npm test"
```

**Example Test:**
```javascript
describe('Tenant Security', () => {
  it('should NOT allow unauthenticated read of apiKey', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('tenants').doc('test').get());
  });

  it('should allow tenant owner to read own data', async () => {
    const db = testEnv.authenticatedContext('owner123').firestore();
    await assertSucceeds(db.collection('tenants').doc('tenant_owner123').get());
  });
});
```

---

## Compliance Impact

### GDPR Violations
Current rules expose PII without proper access controls:
- Owner emails
- Business names
- Service area data
- User profiles

**Risk:** Significant GDPR fines for data breach

### PCI DSS
Stripe customer IDs exposed without authentication

**Risk:** Loss of payment processing capabilities

---

**Next Report:** [04-performance-analysis.md](./04-performance-analysis.md)
