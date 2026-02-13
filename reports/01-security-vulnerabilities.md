# Security Vulnerabilities Report
**Generated:** 2026-02-05
**Analysis Type:** Dependency & Secret Scanning
**Severity:** CRITICAL

---

## 1. NPM Package Vulnerabilities

### Summary
- **Total Vulnerabilities:** 3 HIGH severity issues
- **Status:** All have fixes available
- **Action Required:** Run `npm audit fix`

### Detailed Findings

#### Vulnerability 1: Next.js DoS Vulnerabilities
**Package:** `next`
**Current Version:** 15.5.9
**Severity:** HIGH
**CVE:**
- GHSA-9g9p-9gw9-jx7f (Image Optimizer DoS)
- GHSA-h25m-26qc-wcjf (HTTP request deserialization DoS)

**Description:**
1. Image Optimizer can be exploited for DoS via remotePatterns configuration
2. HTTP request deserialization can lead to DoS when using insecure React Server Components

**CVSS Score:** 7.5/10
**Fix:** Upgrade to Next.js >= 15.5.10

**Command:**
```bash
npm install next@latest
```

---

#### Vulnerability 2: fast-xml-parser RangeError DoS
**Package:** `fast-xml-parser`
**Current Version:** 4.3.6 - 5.3.3 (indirect dependency)
**Severity:** HIGH
**CVE:** GHSA-37qj-frw5-hhjh

**Description:** Numeric Entities Bug causing RangeError DoS
**CVSS Score:** 7.5/10
**Affected By:** Used by `@google-cloud/storage`

**Fix:** Update `@google-cloud/storage` to version > 7.18.0

---

#### Vulnerability 3: @google-cloud/storage
**Package:** `@google-cloud/storage`
**Current Version:** 7.12.1 - 7.18.0
**Severity:** HIGH
**Via:** fast-xml-parser vulnerability

**Fix:** Update Firebase Admin SDK which will update this dependency

---

## 2. Exposed Secrets & API Keys

### CRITICAL: Production Secrets in Repository

**Files with exposed credentials:**
- `.env.local` (13 API keys exposed)
- `.env.vercel.local` (multiple secrets)
- `.env.prod.local` (production keys)
- `.env.production` (untracked but present)

### Exposed Credentials List

| Secret Type | File | Status |
|-------------|------|--------|
| **Stripe Live Secret Key** | `.env.local:5` | ⚠️ CRITICAL |
| **Gemini API Key** | `.env.local:9` | ⚠️ HIGH |
| **Perplexity API Key** | `.env.local:12` | ⚠️ HIGH |
| **Pexels API Key** | `.env.local:15` | ⚠️ MEDIUM |
| **ElevenLabs API Key** | `.env.local:24` | ⚠️ MEDIUM |
| **Vercel API Token** | `.env.local:28` | ⚠️ CRITICAL |
| **GoDaddy API Key** | `.env.local:36` | ⚠️ HIGH |
| **GoDaddy API Secret** | `.env.local:37` | ⚠️ HIGH |
| **Firebase API Key** | `.env.local:40` | ⚠️ MEDIUM |
| **Resend API Key** | `.env.local:48` | ⚠️ MEDIUM |
| **Firebase Service Account** | `.env.local:2` | ⚠️ CRITICAL |

### Sample Exposure
```
STRIPE_SECRET_KEY=<redacted - live key was exposed>
GEMINI_API_KEY=<redacted - API key was exposed>
VERCEL_API_TOKEN=<redacted - token was exposed>
```

**Risk:** If `.env.*` files are committed to Git, all these secrets are exposed in repository history.

---

## 3. Hardcoded Secrets in Source Code

### Issue 1: Default Platform Secret
**File:** Multiple API routes
**Locations:**
- [app/api/credits/check/route.ts:7](../app/api/credits/check/route.ts#L7)
- [app/api/credits/deduct/route.ts:7](../app/api/credits/deduct/route.ts#L7)
- [app/api/admin/update-tenant/route.ts:4](../app/api/admin/update-tenant/route.ts#L4)

```typescript
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';
```

**Risk:** If `PLATFORM_SECRET` is not set, the hardcoded default becomes the platform password.

---

### Issue 2: Test Credentials in Code
**File:** [app/api/admin/seed-wnct/route.ts:64](../app/api/admin/seed-wnct/route.ts#L64)

```typescript
export async function GET() {
  // NO AUTHENTICATION
  const testData = {
    apiKey: 'wnct-api-key-2024',
    ownerEmail: 'carlfarring@gmail.com',
  };
}
```

**Risk:**
- Hardcoded test API key accessible via unauthenticated endpoint
- Personal email exposed for phishing attacks

---

## 4. Git Repository Security

### Check if secrets are committed to Git:
```bash
git log --all --full-history -- .env.local
git log --all --full-history -- .env.production
```

### If secrets are in history:
```bash
# IMMEDIATE ACTION REQUIRED
1. Rotate ALL exposed API keys
2. Use git-filter-repo to remove secrets from history
3. Force push cleaned history (requires team coordination)
```

---

## Remediation Priority

### IMMEDIATE (Today)
1. ✅ Add `.env.*` to `.gitignore` if not already
2. ✅ Verify `.env.*` files are NOT in Git history
3. ✅ Rotate Stripe live secret key (if exposed in Git)
4. ✅ Rotate Vercel API token (if exposed in Git)
5. ✅ Set `PLATFORM_SECRET` environment variable (remove fallback)

### HIGH PRIORITY (This Week)
6. ✅ Run `npm audit fix` to update vulnerable packages
7. ✅ Remove hardcoded test credentials from [seed-wnct/route.ts](../app/api/admin/seed-wnct/route.ts)
8. ✅ Remove `|| 'default-value'` fallbacks from all secret variables
9. ✅ Implement secret scanning in CI/CD pipeline
10. ✅ Rotate GoDaddy API credentials

### MEDIUM PRIORITY (This Sprint)
11. Use environment variable management service (Vercel Secrets, Doppler, etc.)
12. Rotate all other API keys as precaution
13. Implement secret rotation policy (quarterly)
14. Add pre-commit hooks to prevent secret commits

---

## Security Best Practices

### .gitignore Configuration
Ensure these patterns exist:
```gitignore
.env
.env.local
.env.*.local
.env.production
.env.development
*.key
*.pem
serviceAccount.json
```

### Environment Variable Management
```typescript
// GOOD - Fail if not set
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// BAD - Hardcoded fallback
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'default-secret';
```

### Secret Rotation Checklist
- [ ] Stripe API keys
- [ ] Firebase service account
- [ ] Vercel API token
- [ ] GoDaddy API credentials
- [ ] Gemini API key
- [ ] Perplexity API key
- [ ] Resend API key
- [ ] Platform secret

---

## Monitoring Recommendations

1. **Set up secret scanning:**
   - GitHub Secret Scanning
   - GitGuardian
   - TruffleHog

2. **Implement secret rotation:**
   - Automated rotation every 90 days
   - Audit trail for all secret access

3. **Environment isolation:**
   - Separate secrets for dev/staging/production
   - Never reuse production secrets in development

---

**Next Steps:** Review [02-api-security-analysis.md](./02-api-security-analysis.md) for API-level security issues.
