# Newsroom AIOS — Product Roadmap

> Last updated: February 2026
> Status: Living document — updated as priorities shift

---

## Phase 1: Security & Stability

_Priority: CRITICAL — Must complete before scaling to more tenants_

- [ ] **Stripe webhook signature verification** — Currently accepts unverified payloads; implement `stripe.webhooks.constructEvent()` in `/api/stripe/webhooks`
- [ ] **Lock down Firebase security rules** — All collections currently use `allow read/write: if true`; scope rules per collection with proper role checks
- [ ] **Authenticate unprotected API routes** — `/api/admin/seed-wnct` (no auth), `/api/tenants/get-api-key` (no auth), `/api/admin/reset-menus` (inconsistent Bearer auth)
- [ ] **Add security headers** — X-Frame-Options, X-Content-Type-Options, CSP, HSTS via Next.js middleware or `next.config.ts` headers
- [ ] **Remove hardcoded platform secret fallback** — `generate-content` route falls back to `'paper-partner-2024'` if env var missing
- [ ] **Add rate limiting** — Per-tenant rate caps on `/api/ai/generate-article` and all public-facing endpoints
- [ ] **Fix credit system bugs** — Soft limit logic is inverted; exhausted accounts still allowed through; no refund if generation fails mid-process
- [ ] **Input validation** — Add schema validation (Zod) on API route inputs to prevent injection

---

## Phase 2: Core Product Completion

_Priority: HIGH — Features that are referenced in code but not yet working_

- [ ] **Article detail pages** — Links to `/{slug}/article/{articleSlug}` exist but no route handler; readers can't view full articles
- [ ] **Credit purchase checkout** — Stripe checkout flow is scaffolded but not implemented (`/account/credits/purchase`)
- [ ] **Newsletter sending** — Resend API integration is stubbed in tenant template; currently simulates sends without delivering
- [ ] **Platform credit APIs** — Transaction history and usage stats return empty arrays; wire up real Firestore queries
- [ ] **Finish `/api/ai/generate-content`** — No credit deduction; usage goes untracked
- [ ] **Onboarding session cleanup** — Anonymous onboarding progress docs accumulate forever; add TTL or scheduled cleanup
- [ ] **Maintenance mode admin toggle** — No admin endpoint to set maintenance mode; currently requires direct Firestore edit
- [ ] **Temporary password enforcement** — Generated passwords never expire; add forced password change on first login

---

## Phase 3: SEO & Distribution

_Priority: HIGH — Required for organic reader growth_

- [ ] **Open Graph & Twitter Card meta tags** — Rich previews when articles are shared on social media
- [ ] **XML sitemap generation** — Auto-generated sitemap for search engine crawling
- [ ] **RSS feeds** — Per-category and site-wide article feeds
- [ ] **Structured data / JSON-LD** — Article schema markup for Google News and rich search results
- [ ] **Canonical URL management** — Prevent duplicate content penalties
- [ ] **Social sharing buttons** — Facebook, Twitter/X, LinkedIn, email, copy-link on every article
- [ ] **robots.txt management** — Per-tenant configuration

---

## Phase 4: Reader Engagement

_Priority: HIGH — Builds audience retention and return visits_

- [ ] **Site-wide search** — Full-text article search with filters (category, date range, tags)
- [ ] **Reader accounts** — Optional sign-up for readers (email or social login)
- [ ] **Comment system** — Threaded comments on articles with moderation tools and spam filtering
- [ ] **Newsletter signup** — Embedded forms on articles and homepage; subscriber list management
- [ ] **Email digests** — Scheduled daily/weekly newsletter sends with top articles per category
- [ ] **Reading time estimates** — Calculate and display estimated read time on article cards and detail pages
- [ ] **Related articles** — "More like this" recommendations at the bottom of article pages
- [ ] **Print article** — Clean print stylesheet for individual articles

---

## Phase 5: Platform Operations & Observability

_Priority: HIGH — Required to operate reliably at scale_

- [ ] **Testing framework** — Install Vitest + React Testing Library; add tests for critical API routes (credits, Stripe, tenant creation)
- [ ] **Error tracking** — Integrate Sentry for both platform and tenant sites
- [ ] **Structured logging** — Replace console.log with a logging library (Pino); add request correlation IDs, log levels, and timestamps
- [ ] **Health checks & uptime monitoring** — `/api/health` endpoint; external uptime service (e.g., BetterStack)
- [ ] **CI quality gates** — Add linting, type checking (`tsc --noEmit`), and test runs to CI pipeline before merge
- [ ] **Deployment status UI** — Show real deployment progress in admin (currently references GitHub API but uses mock data)
- [ ] **Rollback mechanism** — Admin UI to revert a tenant to a previous deployment
- [ ] **Backup validation** — GCS backup currently optional and logs to console if unconfigured; make it mandatory with alerts on failure
- [ ] **Pre-commit hooks** — Husky + lint-staged for consistent code quality

---

## Phase 6: Admin & Business Intelligence

_Priority: MEDIUM — Operational efficiency and revenue visibility_

- [ ] **Real analytics dashboard** — Replace mock data with actual Firestore queries for MRR, ARR, churn, tenant growth
- [ ] **Billing dashboard** — Invoice history, payment method status, failed payments, revenue per tenant
- [ ] **Audit logging** — Record all admin actions (tenant create/delete, credit adjustments, config changes) with timestamps and actor
- [ ] **Role-based access control (RBAC)** — Admin/editor/viewer permission levels for platform admins
- [ ] **Tenant health monitoring** — Dashboard showing deployment status, seeding progress, error rates, and credit burn per tenant
- [ ] **Messaging system** — Finish PaperPartnerChat integration; broadcast messages to tenants
- [ ] **Subscription lifecycle management** — Admin UI for pause, cancel, upgrade/downgrade, dunning retry
- [ ] **Support ticketing** — Track tenant issues and resolutions within the admin

---

## Phase 7: Content Management & Editorial

_Priority: MEDIUM — Empowers newspaper owners to manage their publication_

- [ ] **Article CRUD API** — Dedicated endpoints for create, read, update, delete articles (currently only AI-generated)
- [ ] **Manual article editor** — Rich text editor for newspaper owners to write/edit articles themselves
- [ ] **Editorial workflow** — Draft → Review → Scheduled → Published status progression
- [ ] **Content scheduling** — Schedule articles for future publication dates
- [ ] **Version history** — Track edits to articles with rollback capability
- [ ] **AI Journalist management UI** — Tenant-facing CRUD for journalist personas, schedules, and category assignments
- [ ] **Category management API** — Endpoints for adding/removing/reordering categories post-onboarding
- [ ] **Editorial calendar** — Visual calendar view of scheduled and published content

---

## Phase 8: Multimedia & Rich Content

_Priority: MEDIUM — Modern news requires more than text_

- [ ] **Photo galleries** — Multi-image stories with swipeable gallery view
- [ ] **Video embedding** — YouTube, Vimeo, and direct video support in articles
- [ ] **Audio / text-to-speech** — ElevenLabs integration for article audio (API key already provisioned)
- [ ] **Embedded social media** — Twitter/X, Instagram, Facebook post embeds within articles
- [ ] **Image optimization** — Lazy loading, srcset responsive images, WebP conversion
- [ ] **Interactive graphics** — Charts and data visualizations embedded in articles

---

## Phase 9: Advanced Features

_Priority: LOWER — Differentiators for premium tiers_

- [ ] **Events calendar** — Community event listings with calendar view, RSVP, and reminders
- [ ] **Business directory** — Local business listings powered by Google Places API (key already provisioned)
- [ ] **Classified ads** — Job board, real estate, for-sale listings (currently these are just article categories)
- [ ] **Weather widget** — Live weather data for the tenant's service area
- [ ] **Polls & surveys** — Reader engagement tools embedded in articles or sidebar
- [ ] **Reader submissions** — Letters to the editor, community photos, event submissions with moderation queue
- [ ] **Advertising system** — Display ad placements with impression tracking; self-serve ad purchasing for local businesses

---

## Phase 10: Scale & Enterprise

_Priority: FUTURE — When tenant count demands it_

- [ ] **Multi-user per tenant** — Multiple staff accounts per newspaper with role-based permissions
- [ ] **Custom domain support** — Tenants use their own domain (e.g., atlantanews.com) instead of subdomain
- [ ] **White-label options** — Remove Newsroom AIOS branding for enterprise tenants
- [ ] **Advanced analytics** — Cohort analysis, reader LTV, churn prediction, acquisition funnels
- [ ] **Paywall / metered access** — Reader subscriptions for premium content
- [ ] **Membership & donations** — Reader-funded journalism model
- [ ] **PWA / mobile app shell** — Installable app experience with push notifications
- [ ] **Multi-language support** — Localized content for non-English-speaking communities
- [ ] **Secret rotation** — Automated API key rotation with zero-downtime rollover

---

## Known Bugs & Tech Debt

_Items discovered during codebase survey — fix as encountered_

- [ ] Stripe webhook signature not cryptographically verified (Phase 1)
- [ ] Credit soft limit logic is inverted — warns when used >= soft instead of remaining <= soft
- [ ] Exhausted credit status still returns `allowed: true` from `/api/credits/check`
- [ ] No transaction atomicity between credit check and deduction (race condition)
- [ ] Placeholder articles are marked `isAIGenerated: true` (misleading)
- [ ] Menu auto-regeneration is overly aggressive on minor label changes
- [ ] Admin analytics page uses hardcoded sample data, not real queries
- [ ] GCS backup silently falls back to console.log when not configured
- [ ] Cascading tenant deletes don't use Firestore batch operations (slow on large tenants)
- [ ] No domain availability check during onboarding (step 1 asks user to check manually)
