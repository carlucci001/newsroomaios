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

## Code Independence from WNC Times

**Critical Consideration**: This project shares code patterns and dependencies with WNC Times production site. Changes to shared components must not break either system.

### Independence Strategies

1. **Separate Repositories** (Current State)
   - `c:\dev\wnct-next` - Production newspaper site
   - `c:\dev\newsroomaios` - SaaS platform
   - No direct code dependencies between them

2. **Version Pinning**
   - Lock dependency versions in package.json
   - Test thoroughly before upgrading shared packages
   - Never use `^` or `~` for critical dependencies

3. **Shared Component Library** (Future)
   - Extract common UI components to separate npm package
   - Versioned releases prevent breaking changes
   - Each project controls which version to use

4. **Separate Firebase Projects**
   - WNC Times: `gwnct` database
   - Newsroom AIOS: `newsroomasios` project
   - No data sharing or cross-contamination

### Testing Before Updates

Before updating any shared dependency:
1. Test in newsroomaios dev environment
2. Create git branch for update
3. Verify WNC Times still works
4. Deploy only after both pass

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

**WNC Times** (`wnct-next`):
- Single newspaper website
- Focus: Content delivery to readers
- Revenue: Platform licensing fee ($199/mo per paper)

**Newsroom AIOS** (`newsroomaios`):
- Multi-tenant SaaS platform
- Focus: Tools for newspapers to run their business
- Revenue: Three streams (advertising, directory, subscriptions) per tenant

**No direct connection** - They should function independently even if one has issues.

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
