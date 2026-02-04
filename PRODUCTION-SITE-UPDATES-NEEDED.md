# Production Site Updates - DO NOT TOUCH YET

⚠️ **IMPORTANT**: These updates should NOT be applied to wnctimes.com production site yet.

## Background

The multi-tenant fixes made to `wnct-template` (2024-02-03) need to be carefully applied to the WNCT-next production site when ready.

## What Was Fixed in wnct-template

### 1. Admin Dashboard Article Loading
**Files Modified:**
- `src/app/admin/page.tsx` - Now uses `ARTICLES_COLLECTION` from tenantConfig instead of hardcoded 'articles'

**Changes:**
- Import: Added `import { ARTICLES_COLLECTION } from '@/lib/tenantConfig';`
- Line 788: `getDocs(collection(getDb(), ARTICLES_COLLECTION))`
- Line 868: `deleteDoc(doc(getDb(), ARTICLES_COLLECTION, articleId))`
- Line 880: `updateDoc(doc(getDb(), ARTICLES_COLLECTION, article.id))`
- Line 1767: `doc(getDb(), ARTICLES_COLLECTION, articleToSave.id)`
- Line 1826: `doc(getDb(), ARTICLES_COLLECTION, updatedArticle.id)`
- Line 1964: `updateDoc(doc(getDb(), ARTICLES_COLLECTION, article.id))`
- Line 2016: `updateDoc(doc(getDb(), ARTICLES_COLLECTION, article.id))`
- Line 2037: `updateDoc(doc(getDb(), ARTICLES_COLLECTION, article.id))`

### 2. User Authentication (Already Fixed Earlier)
**Files Modified:**
- `src/hooks/useAuth.ts` - Added tenant collection check
- `src/contexts/AuthContext.tsx` - Added tenant collection check
- `src/app/admin/layout.tsx` - Added 'owner' role
- `src/app/admin/page.tsx` - Added 'owner' role to ADMIN_ROLES

### 3. Home Page Server-Side Rendering (Already Fixed Earlier)
**Files Modified:**
- `src/app/(main)/page.tsx` - Converted to async server component
- `src/app/(main)/HomeClient.tsx` - Accepts server-fetched props

## Why These Fixes Matter for Multi-Tenant

These changes make the template work for BOTH:
1. **Single-tenant mode** (like wnctimes.com) - reads from root 'articles' collection
2. **Multi-tenant mode** (like the42) - reads from 'tenants/{id}/articles' collection

The `ARTICLES_COLLECTION` constant automatically switches based on `NEXT_PUBLIC_TENANT_ID` environment variable.

## When to Apply to Production

Apply these updates to WNCT-next (wnctimes.com) when:
- ✅ All fixes have been verified working on the42 demo
- ✅ Admin dashboard tested thoroughly on demo tenant
- ✅ Article CRUD operations confirmed working
- ✅ No negative impact on performance or stability
- ✅ Backup of production database completed
- ✅ Rollback plan in place

## How to Apply to Production

When ready:

```bash
# 1. Checkout the production repo
cd c:/dev/WNCT-next

# 2. Create a branch for updates
git checkout -b multi-tenant-compatibility

# 3. Cherry-pick the commits from wnct-template
# (or manually apply the changes listed above)

# 4. Test locally first
npm run dev

# 5. Deploy to production when verified
git push origin multi-tenant-compatibility
# Then merge via pull request
```

## Repos

- **wnct-template**: `github.com/carlucci001/wnct-template` (✅ FIXED - Feb 3, 2024)
- **WNCT-next**: `github.com/carlucci001/wnct-next` (⚠️ NEEDS UPDATE LATER)
- **Deployed at**: wnctimes.com

## Notes

- Production site uses root collections (no TENANT_ID set)
- Template changes are backwards compatible (won't break single-tenant mode)
- These fixes improve code consistency and future maintainability
- No rush - production is stable as-is

---

**Last Updated**: 2024-02-03
**Status**: Fixes applied to wnct-template, ready for the42 testing
