# Platform Memory - Critical Learnings

## Menu System Architecture (FIXED 2025-02-05)

**Problem:** Menus were showing WNC Times data and stacking labels.

**Solution:**
- Platform API (`/api/menus`) generates menus from tenant categories
- Tenant template proxies to platform (not siteConfig!)
- Auto-regeneration detects corrupted menus (long labels, duplicates, <5 items)
- One-word category labels prevent stacking
- Main nav = categories only; Top nav = standard pages

**Key Files:**
- Platform: `app/api/menus/route.ts` - `buildDefaultMenus()` function
- Template: `src/app/api/menus/route.ts` - proxies to platform
- Template: `src/components/Header.tsx` - fetches from `/api/menus`

## Location/Branding Context (FIXED 2025-02-05)

**Problem:** 54 files had hardcoded "WNC Times", "Asheville", "Western North Carolina".

**Solution:**
- Created `locationContext.ts` helper with `getCity()`, `getRegion()`, etc.
- Bulk replacement script: `scripts/remove-wnc-references.js`
- API endpoints: `/api/settings/service-area`, `/api/settings/site-name`
- About page fully dynamic

**Replacements:**
- WNC Times → tenant siteName
- Asheville → tenant city (Cincinnati)
- Western North Carolina → tenant region (Greater Cincinnati)
- Buncombe County → tenant county (Hamilton County)

## CI/CD Pipeline (CREATED 2025-02-05)

**File:** `.github/workflows/deploy-tenants.yml`

Auto-deploys template updates to all tenants on push to master.

## CRITICAL: Article Display Issue (UNRESOLVED)

**Status:** Articles exist in Firestore but don't display on category pages.

**To Fix:**
1. Check category page fetch logic
2. Verify article category slugs match tenant categories
3. Test with actual seeded articles (not test data)

## Drift Prevention

**Issues that caused drift:**
- Old siteConfig data persisting when platform updated
- Menus cached with wrong structure
- Hardcoded values instead of dynamic tenant data

**Guardrails Added:**
- Auto-regeneration logic in platform API
- Duplicate detection
- Long label detection
- Global replacement scripts for consistency

## For Future Tenants

**Critical env vars to set during deployment:**
- `SERVICE_AREA_CITY`
- `SERVICE_AREA_COUNTY`
- `SERVICE_AREA_STATE`
- `SERVICE_AREA_REGION`
- `SITE_NAME`
- `PLATFORM_API_URL`
- `TENANT_ID`
- `TENANT_API_KEY`

## Testing Checklist

Before tenant goes live:
1. Run `scripts/comprehensive-the42-test.js`
2. Verify no WNC Times references
3. Verify location context correct
4. Verify articles display
5. Check menus (top bar + main nav separate)
6. Test article generation
7. Test AI journalists
