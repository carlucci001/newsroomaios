# Newsroom AIOS Architecture

## ⚠️ Firebase Project Naming Discrepancy

**IMPORTANT**: There is an intentional spelling mismatch between the Firebase project ID and the public domain:

- **Firebase Project ID**: `newsroomasios` (with extra 's' - ASIOS)
- **Public Domain**: `newsroomaios.com` (correct - AIOS)
- **Local Folder**: `c:\dev\newsroomaios` (correct - AIOS)
- **Package Name**: `newsroomaios` (correct - AIOS)

### Why This Exists

Firebase project IDs are **permanent and cannot be changed**. The project was initially created with a typo, but the custom domain is correctly spelled.

### Impact on Development

**Safe (No Issues)**:
- ✅ All application code uses the correct spelling
- ✅ Custom domain (newsroomaios.com) is correct
- ✅ Users never see the Firebase project ID
- ✅ Environment variables use API keys, not project ID

**Requires Attention**:
- ⚠️ Firebase CLI commands must use `newsroomasios` (wrong spelling)
  ```bash
  firebase deploy --project newsroomasios
  ```
- ⚠️ `.firebaserc` contains the misspelled ID
- ⚠️ Internal URLs (`.web.app`, `.firebaseapp.com`) have wrong spelling (only for testing)
- ⚠️ CI/CD scripts must reference `newsroomasios`

### Best Practices

1. **NEVER hardcode Firebase URLs** - Always use custom domain:
   ```typescript
   // ❌ BAD - uses misspelled domain
   const apiUrl = 'https://newsroomasios.web.app/api'

   // ✅ GOOD - uses correct custom domain
   const apiUrl = 'https://newsroomaios.com/api'
   ```

2. **Use environment variables** for all API endpoints

3. **Document for new developers** - They may be confused seeing different spellings in Firebase Console vs codebase

4. **Accept the discrepancy** - Changing it requires recreating the entire Firebase project

---

## WNC Times — Special Architecture (CRITICAL)

> **READ THIS BEFORE ANY ROLLOUT, DEPLOYMENT, OR DATABASE WORK.**
>
> WNC Times is the ONLY tenant that uses a different Firebase project and database.
> Every other tenant shares the platform's Firebase project (`newsroomasios`) and
> its default Firestore database. WNC Times does NOT. Getting this wrong will take
> the site down or make 800+ articles disappear.

### Why WNC Times Is Different

WNC Times existed as a standalone newspaper app BEFORE the multi-tenant platform
was built. It has its own Firebase project with years of production data. Rather
than risk migrating 800+ articles, 100+ businesses, 12 users, and 689 media items
mid-production, the platform was designed to support WNC Times via environment
variables that route it to its own database.

### The Architecture

| Component | Regular Tenants | WNC Times |
|---|---|---|
| Firebase project | `newsroomasios` | `gen-lang-client-0242565142` |
| Firestore database | `(default)` | `gwnct` (named database) |
| Code repository | `carlucci001/wnct-template` | `carlucci001/wnct-template` (SAME) |
| Data path | `tenants/{tenantId}/articles/` | `tenants/wnct-times/articles/` |
| `FIREBASE_DATABASE_ID` | Not set (uses default) | `gwnct` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_ID` | Not set | `gwnct` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `newsroomasios` | `gen-lang-client-0242565142` |
| All 6 `NEXT_PUBLIC_FIREBASE_*` vars | Point to `newsroomasios` | Point to `gen-lang-client-0242565142` |

### How It Works During Rollouts

All tenants — including WNC Times — run the SAME codebase (`wnct-template`).
The code is env-var-driven, not hardcoded:

1. `firebase.ts` reads `NEXT_PUBLIC_FIREBASE_DATABASE_ID` to select the database.
   If set to `gwnct`, it calls `getFirestore(app, 'gwnct')`.
   If not set, it calls `getFirestore(app)` (default database).

2. `firebaseAdmin.ts` reads `FIREBASE_DATABASE_ID` for server-side routes.
   Same logic: `gwnct` → named database, unset → default.

3. `tenantConfig.ts` reads `NEXT_PUBLIC_TENANT_ID` to build collection paths.
   `tenants/wnct-times/articles/` on gwnct vs `tenants/the-atlanta-42/articles/` on default.

During a rollout, the platform redeploys all active tenants from `wnct-template`.
Each tenant's Vercel project has its own env vars baked in at build time.
WNC Times gets the same code, but its env vars route it to the `gwnct` database
on the `gen-lang-client-0242565142` project. No special code paths needed.

### Critical Env Vars on WNC Times (DO NOT REMOVE)

These env vars on the `newspaper-wnct-times` Vercel project are what make
WNC Times work. Removing any of them will break the site:

```
FIREBASE_DATABASE_ID=gwnct                         # Server-side database routing
NEXT_PUBLIC_FIREBASE_DATABASE_ID=gwnct              # Client-side database routing
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gen-lang-client-0242565142
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCeqkh-...        # WNC Times Firebase project key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gen-lang-client-0242565142.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gen-lang-client-0242565142.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=976122475870
NEXT_PUBLIC_FIREBASE_APP_ID=1:976122475870:web:...
FIREBASE_SERVICE_ACCOUNT=<WNC Times service account JSON>
```

### Rollout Safety: What Can Go Wrong

1. **Env var backfill overwrites Firebase config**: The `redeployTenant()` function
   in `vercel.ts` backfills missing env vars using the PLATFORM's Firebase config.
   It does NOT overwrite existing vars. But if someone deletes WNC Times' Firebase
   env vars and then runs a rollout, the backfill would inject the WRONG Firebase
   config (platform's `newsroomasios` instead of `gen-lang-client-0242565142`).
   **Result: WNC Times connects to wrong database, articles disappear.**

2. **Missing `FIREBASE_DATABASE_ID`**: If `FIREBASE_DATABASE_ID=gwnct` is removed,
   server-side routes (article generation, API calls) would connect to the default
   database, which has no WNC Times data. Client-side would also fail if
   `NEXT_PUBLIC_FIREBASE_DATABASE_ID` is missing.
   **Result: Site loads but shows 0 articles, 0 businesses.**

3. **Firestore rules on gwnct**: The `gwnct` database has its own security rules,
   separate from the platform's rules. Client-side writes (e.g., directory seeding
   via the seed API endpoint) may be blocked by these rules. Use Firebase Admin SDK
   scripts for direct database operations on gwnct.

### If WNC Times Breaks After a Rollout

1. Check `FIREBASE_DATABASE_ID=gwnct` is still set on Vercel project `newspaper-wnct-times`
2. Check `NEXT_PUBLIC_FIREBASE_DATABASE_ID=gwnct` is still set
3. Check all 6 `NEXT_PUBLIC_FIREBASE_*` vars point to `gen-lang-client-0242565142` (NOT `newsroomasios`)
4. Verify data exists: run `scripts/check-gwnct-database.js` or `scripts/snapshot-wnct-data.js`
5. If env vars were overwritten, restore them from the table above and trigger a fresh build

### Data Counts (as of Feb 12, 2026)

- Articles: 805 (at `gwnct:tenants/wnct-times/articles/`)
- Businesses: 105 (at `gwnct:tenants/wnct-times/businesses/`)
- Users: 12
- Media: 689
- AI Journalists: 6
- Menus: 4
- Root-level backup: 798 articles at `gwnct:articles/` (pre-migration)

### Future: Migrating Off gwnct

If WNC Times is ever migrated to the platform's `newsroomasios` default database:
1. Export all data from `gwnct:tenants/wnct-times/` collections
2. Import into `newsroomasios:tenants/wnct-times/` collections
3. Update WNC Times' Vercel env vars to point to `newsroomasios` Firebase config
4. Remove `FIREBASE_DATABASE_ID` and `NEXT_PUBLIC_FIREBASE_DATABASE_ID`
5. Trigger fresh build
6. Verify all data accessible
7. Keep gwnct as read-only backup for 30 days before decommissioning

This migration is optional. The current env-var-driven architecture works correctly
and WNC Times deploys identically to all other tenants during rollouts

---

## Partner Network Vision

### Business Opportunity
Enable independent newspapers to share advertising inventory, creating a network effect that benefits all participants.

### Use Cases

1. **Cross-Region Advertising**
   - Restaurant chain wants ads in 10 small-town papers
   - Single advertiser account, multiple newspaper placements
   - Revenue split between platform and participating papers

2. **Geographic Targeting**
   - Advertiser: "I want customers within 50 miles of Asheville"
   - Platform: Automatically places ads in relevant papers
   - Papers get revenue from advertisers outside their direct reach

3. **Shared Advertiser Pool**
   - Mountain View Times advertiser also relevant for Valley Gazette
   - Opt-in sharing between papers
   - Papers keep their direct advertisers exclusive if desired

### Technical Architecture (Future Phase)

**Database Schema Additions:**

```typescript
interface AdvertisingNetwork {
  id: string;
  name: string;                        // "Western NC Papers Network"
  tenantIds: string[];                 // Participating newspapers
  revenueSplit: {
    platform: number;                  // 10%
    originTenant: number;              // 60% (paper that signed the advertiser)
    displayTenant: number;             // 30% (paper showing the ad)
  };
  settings: {
    allowSharing: boolean;
    geographicRadius?: number;         // Miles
    categories?: string[];             // Allowed business categories
  };
}

interface NetworkAdvertiser extends Advertiser {
  networkId?: string;
  targetTenants?: string[];            // Specific papers OR
  targetGeography?: {
    center: { lat: number; lng: number };
    radiusMiles: number;
  };
  originTenantId: string;              // Paper that signed them
}
```

**UI/UX Flow:**

1. Advertiser signs up on Mountain View Times
2. During onboarding: "Want to reach readers beyond Mountain View?"
3. Shows map of network papers within target radius
4. Selects additional papers (pay more for broader reach)
5. Single banner, multiple placements
6. Dashboard shows performance by paper

**Revenue Tracking:**

```typescript
interface NetworkRevenueTransaction extends RevenueTransaction {
  networkId?: string;
  originTenantId: string;              // Paper that signed advertiser
  displayTenantId: string;             // Paper showing the ad
  split: {
    platformAmount: number;
    originTenantAmount: number;
    displayTenantAmount: number;
  };
}
```

### Implementation Priority

**Phase 1 (Current)**: Single-tenant advertising
- Each paper manages their own advertisers
- No sharing between papers
- Foundation architecture in place

**Phase 2 (Q2 2026)**: Opt-in advertiser sharing
- Papers can manually share advertiser with specific partners
- Manual revenue splits
- Basic network features

**Phase 3 (Q3 2026)**: Full Partner Network
- Automated geographic targeting
- Network dashboard
- Shared advertiser pool
- Automatic revenue splits

**Phase 4 (2027)**: Advanced Network Features
- Network-wide analytics
- Cross-paper campaign optimization
- National advertiser partnerships
- Programmatic ad placement

### Business Benefits

**For Platform:**
- Network effect increases value proposition
- Higher revenue per advertiser (multi-paper campaigns)
- Competitive moat (solo papers can't offer this)

**For Newspapers:**
- Access to advertisers they couldn't reach alone
- Passive revenue from network ads
- Stronger together than competing

**For Advertisers:**
- One-stop shop for regional coverage
- Simplified billing (one invoice, not 10)
- Better ROI through broader reach

---

## Development Guidelines

### When Working on Newsroom AIOS:

1. **Check WNC Times Impact**
   - If changing shared components (Button, Card, etc.), test both projects
   - Keep dev server running in background to catch build errors quickly

2. **Keep Architecture Flexible**
   - Build for single-tenant first (YAGNI principle)
   - But design schemas with multi-tenant/network in mind
   - Add network fields as optional (`networkId?: string`)

3. **Document Breaking Changes**
   - Any change to Firebase schema
   - Updates to Stripe integration
   - Changes to authentication flow

### Separation of Concerns

**WNC Times** (tenant `wnct-times` on `wnct-template`):
- First newspaper on the platform, originally standalone (`wnct-next` repo, now retired)
- Re-linked to `wnct-template` on Feb 12, 2026 — same codebase as all other tenants
- Uses separate Firebase project + named database `gwnct` (see section above)

**Newsroom AIOS** (`newsroomaios`):
- Multi-tenant SaaS platform (newsroomaios.com)
- Admin area for tenant provisioning, API key management, credit tracking
- Rollout endpoint deploys latest `wnct-template` code to ALL tenants including WNC Times

**All tenant sites** (`wnct-template`):
- Shared codebase for all newspaper frontends
- Each tenant is an independent Vercel deployment with its own env vars
- Data isolation via Firestore tenant-scoped collection paths

---

## Risk Mitigation

### Scenario: Stripe Integration Update Breaks Something

**Current Risk:**
- Both projects use same Stripe patterns
- Update in newsroomaios could reveal bug pattern
- Might need to fix both projects

**Mitigation:**
1. Separate Stripe accounts (already done)
2. Different webhook endpoints
3. Test in isolation before production
4. Keep WNC Times on stable, proven patterns
5. Newsroom AIOS can be more experimental

### Scenario: Firebase Admin SDK Update

**Current Risk:**
- Both use Firebase Admin SDK
- Breaking change could affect both

**Mitigation:**
1. Pin versions in package.json (no `^` prefixes)
2. Test updates in newsroomaios first
3. Only update WNC Times after proven stable
4. Maintain separate Firebase projects (already done)

---

## Future Considerations

1. **Microservices Architecture** (If scale demands)
   - Shared services (authentication, payments) as separate APIs
   - Each paper's site is independent Next.js app
   - Partner network as separate service

2. **Monorepo vs Multi-repo**
   - Current: Multi-repo (independent)
   - Future: Consider monorepo with isolated packages
   - Allows shared component library with versioning

3. **Database Sharding** (At massive scale)
   - Each region's papers in separate Firestore database
   - Network layer connects them for cross-region ads
   - Prevents single point of failure

---

## Contact & Decisions

For architectural decisions that affect both projects, document here before implementing.

**Key Principle**: WNC Times stability > Newsroom AIOS features

The production newspaper site must never break due to platform development.
