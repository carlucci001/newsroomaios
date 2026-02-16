# NewsroomAIOS Platform API Documentation

> Last updated: February 16, 2026

## Overview

The NewsroomAIOS platform has two API surfaces:

1. **Platform API** (`newsroomaios.com/api/`) — Tenant management, billing, AI orchestration, admin operations
2. **Tenant API** (each newspaper site `/api/`) — Content generation, publishing, reader-facing features

---

## Authentication

Three authentication patterns are used across the platform:

### 1. Platform Secret (highest privilege)
```
Header: X-Platform-Secret: <secret>
```
Used for: Internal platform calls, cron jobs, admin operations, rollout deployments.
Required by: All `/api/admin/*`, `/api/tenants/rollout`, `/api/credits/deduct`, `/api/credits/check`, `/api/scheduled/*`

### 2. Tenant API Key (tenant-scoped)
```
Headers:
  X-Tenant-ID: <tenantId>
  X-API-Key: <apiKey>
```
Used for: Tenant sites calling the platform for AI, credits, menus, support.
Required by: All `/api/ai/*`, `/api/credits/balance`, `/api/menus`, `/api/support/*`

### 3. Firebase Auth (admin panel)
```
Header: Authorization: Bearer <firebaseIdToken>
```
Used for: Admin panel operations (file uploads, user management).
Required by: `/api/upload`

### CORS
All AI and tenant-facing endpoints return CORS headers for cross-origin access:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret
```

---

## Platform API Endpoints (newsroomaios.com)

### AI Endpoints

#### POST /api/ai/generate-content
Generate text content using Gemini AI.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | The generation prompt |
| systemInstruction | string | No | System-level instruction for the model |
| model | string | No | Gemini model ID (default: `gemini-2.0-flash`) |
| temperature | number | No | Creativity (0.0-1.0, default varies by use) |
| maxTokens | number | No | Max output tokens |
| responseFormat | string | No | `"text"` or `"json"` |

**Response:**
```json
{ "success": true, "content": "Generated text..." }
```

---

#### POST /api/ai/generate-article
Generate a complete article with image, SEO metadata, and optional fact-check.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categoryId | string | Yes | Target category for the article |
| sourceContent | string | No | Source material to base article on |
| useWebSearch | boolean | No | Use Perplexity for real-time research |
| journalistName | string | No | AI journalist persona name |
| skipEditingPass | boolean | No | Skip the editing refinement pass |
| generateImage | boolean | No | Generate an image (default: true) |
| skipCredits | boolean | No | Skip credit deduction (platform seeding only) |

**Response:**
```json
{
  "success": true,
  "article": {
    "title": "...",
    "content": "...",
    "category": "...",
    "tags": ["..."],
    "imageUrl": "...",
    "seo": { "metaDescription": "...", "keywords": [...], "hashtags": [...] }
  }
}
```

---

#### POST /api/ai/edit-article
Run an editing pass on a raw article draft to improve quality.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| rawDraft | string | Yes | The raw article text to edit |
| temperature | number | No | Editing creativity (default: 0.2) |
| skipIfDisabled | boolean | No | Skip if editing pass is disabled in tenant config |

**Response:**
```json
{ "success": true, "editedContent": "Improved article text..." }
```

---

#### POST /api/ai/search-news
Search for real-time news using Perplexity (3-pass retry for quality).

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| focusArea | string | No | Additional context for the search |
| city | string | No | Target city for local news |
| state | string | No | Target state for local news |

**Response:**
```json
{
  "success": true,
  "source": {
    "title": "...",
    "description": "...",
    "fullContent": "...",
    "sourceName": "Perplexity Web Search",
    "url": "...",
    "citations": ["..."]
  }
}
```

---

#### POST /api/ai/search-images
Search Pexels for stock photos.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Image search query |
| perPage | number | No | Results per page (default: 15) |
| orientation | string | No | `"landscape"`, `"portrait"`, or `"square"` |

**Response:**
```json
{
  "success": true,
  "photos": [
    { "id": 123, "url": "...", "thumbnailUrl": "...", "photographer": "...", "alt": "...", "width": 1920, "height": 1080 }
  ],
  "totalResults": 500
}
```

---

### Credit Endpoints

#### GET /api/credits/balance
Get credit balance and billing info for a tenant.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

**Response:**
```json
{
  "success": true,
  "tenantId": "...",
  "balance": 450,
  "plan": "growth",
  "monthlyAllocation": 575,
  "cycleStart": "2026-02-01T00:00:00Z",
  "cycleEnd": "2026-03-01T00:00:00Z",
  "status": "active"
}
```

---

#### POST /api/credits/check
Check if a tenant has enough credits for an action.

**Auth:** X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant ID |
| action | string | Yes | `"article"`, `"image"`, `"fact-check"`, `"seo"`, `"web-search"` |
| quantity | number | No | Number of actions (default: 1) |

**Response:**
```json
{ "success": true, "allowed": true, "balance": 450, "cost": 5, "remaining": 445 }
```

---

#### POST /api/credits/deduct
Deduct credits from a tenant's balance (atomic transaction).

**Auth:** X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant ID |
| action | string | Yes | Credit action type |
| quantity | number | No | Number of actions |
| description | string | Yes | Human-readable description |
| articleId | string | No | Associated article ID |
| metadata | object | No | Additional tracking data |
| deduct | boolean | No | Actually deduct (default: true) |

**Response:**
```json
{ "success": true, "creditsDeducted": 5, "newBalance": 445 }
```

**Credit Costs:**
| Action | Credits |
|--------|---------|
| article | 5 |
| image | 2 |
| fact-check | 2 |
| seo | 3 |
| web-search | 1 |

---

### Tenant Management Endpoints

#### POST /api/tenants/create
Create a new tenant and deploy to Vercel.

**Auth:** None (onboarding flow)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| businessName | string | Yes | Newspaper name |
| ownerEmail | string | Yes | Owner's email |
| subdomain | string | Yes | Subdomain slug (e.g., `atlanta-news`) |
| domain | string | No | Custom domain |
| serviceArea | object | Yes | `{ city, county, state, region }` |
| selectedCategories | array | Yes | Array of category objects (6 categories) |
| directoryCategories | array | No | Business directory categories |
| plan | string | Yes | `"starter"`, `"growth"`, `"professional"` |
| stripeCustomerId | string | No | Existing Stripe customer ID |

**Response:**
```json
{
  "success": true,
  "tenantId": "...",
  "slug": "atlanta-news",
  "siteUrl": "https://atlanta-news.newsroomaios.com",
  "vercelProjectId": "..."
}
```

---

#### POST /api/tenants/deploy
Deploy (or redeploy) a tenant to Vercel.

**Auth:** X-Platform-Secret or X-Internal-Call

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant to deploy |

**Response:**
```json
{
  "success": true,
  "deploymentId": "...",
  "url": "https://atlanta-news.newsroomaios.com",
  "status": "READY"
}
```

---

#### GET /api/tenants/deploy?tenantId=xxx
Check deployment status for a tenant.

**Response:**
```json
{ "success": true, "status": "READY", "url": "...", "deploymentId": "..." }
```

---

#### POST /api/tenants/rollout
Redeploy latest code to multiple tenants.

**Auth:** X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| scope | string | Yes | `"beta"` (5 papers) or `"all"` (all active) |
| tenantSlugs | array | No | Specific slugs for ad-hoc deploy |
| version | string | No | Version tag |
| commitHash | string | No | Git commit hash |
| dryRun | boolean | No | Preview without deploying |

**Response:**
```json
{
  "success": true,
  "scope": "beta",
  "deployed": 5,
  "failed": 0,
  "results": [
    { "slug": "wnct-times", "success": true, "deploymentUrl": "..." }
  ]
}
```

**Beta Group:** wnct-times, hendo, oceanside-news, hardhatsports, atlanta-news-network

---

#### GET /api/tenants/check-slug?slug=xxx
Check if a subdomain slug is available.

**Response:**
```json
{ "available": true }
```

---

#### GET /api/tenants/releases
Get platform release notes and roadmap items.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

| Query Parameter | Type | Description |
|-----------------|------|-------------|
| type | string | `"release"` or `"roadmap"` |
| limit | number | Max results (default: 20) |

---

#### POST /api/tenants/approve-domain
Approve or reject a custom domain request.

**Auth:** X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant ID |
| action | string | Yes | `"approve"` or `"reject"` |
| rejectionReason | string | No | Reason for rejection |

---

### Menu Endpoints

#### GET /api/menus
Get all menus for a tenant. Auto-regenerates if missing or corrupted.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

**Response:**
```json
{
  "success": true,
  "menus": [
    {
      "id": "...",
      "name": "Main Navigation",
      "slug": "main-nav",
      "items": [{ "label": "News", "path": "/category/news", "enabled": true }],
      "customized": false
    }
  ]
}
```

---

#### POST /api/menus
Create a new menu.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Menu display name |
| slug | string | Yes | Unique menu identifier |
| description | string | No | Menu description |

---

#### PUT /api/menus
Update a menu.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| menuId | string | Yes | Menu to update |
| updates | object | Yes | Fields to update |

---

### Support Endpoints

#### GET /api/support/status
Check if platform support is online.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

**Response:**
```json
{ "online": true, "adminName": "Carl" }
```

---

#### POST /api/support/tickets
Create a new support ticket.

**Auth:** X-Tenant-ID + X-API-Key OR X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subject | string | Yes | Ticket subject line |
| description | string | Yes | Detailed description |
| category | string | No | Ticket category |
| priority | string | No | `"low"`, `"medium"`, `"high"`, `"urgent"` |
| type | string | No | `"bug"`, `"feature"`, `"question"`, `"chat"` |
| reporterUid | string | No | Reporter's user ID |
| reporterName | string | No | Reporter's display name |
| reporterEmail | string | No | Reporter's email |
| diagnostics | object | No | Browser/platform diagnostic info |
| platformVersion | string | No | Current platform version |

---

#### GET /api/support/tickets
List support tickets.

**Auth:** X-Tenant-ID + X-API-Key (sees own tickets) OR X-Platform-Secret (sees all)

| Query Parameter | Type | Description |
|-----------------|------|-------------|
| status | string | Filter by status |
| priority | string | Filter by priority |
| search | string | Search in subject/description |
| limit | number | Max results |
| offset | number | Pagination offset |
| id | string | Get specific ticket |

---

#### PATCH /api/support/tickets
Update a ticket (reply, status change, assignment).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticketId | string | Yes | Ticket to update |
| action | string | Yes | `"reply"`, `"status"`, `"assign"`, `"escalate"` |
| content | string | No | Reply content |
| status | string | No | New status |
| assignedTo | string | No | Assignee UID |
| priority | string | No | New priority |

---

### Admin Endpoints

#### POST /api/admin/create-categories
Create category subcollection for a tenant from their selected categories.

**Auth:** X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant ID |

---

#### POST /api/admin/seed-site-config
Initialize site configuration and navigation menus for a tenant.

**Auth:** X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant ID |

---

#### POST /api/admin/update-tenant
Update tenant document fields.

**Auth:** X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant ID |
| updates | object | Yes | Fields to update |

---

#### GET /api/admin/update-tenant?tenantId=xxx
Get tenant details with article/user/business counts.

**Auth:** X-Platform-Secret

---

#### POST /api/admin/push-tts-settings
Push TTS configuration to all active tenants.

**Auth:** X-Platform-Secret

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ttsProvider | string | Yes | TTS provider name |
| elevenLabsVoiceId | string | Yes | Voice ID |
| elevenLabsModel | string | Yes | Model ID |
| elevenLabsStability | number | Yes | Voice stability (0-1) |
| elevenLabsSimilarity | number | Yes | Similarity boost (0-1) |
| elevenLabsStyle | number | Yes | Style exaggeration (0-1) |
| elevenLabsSpeakerBoost | boolean | Yes | Speaker boost toggle |

---

### Stripe / Billing Endpoints

#### POST /api/stripe/create-payment-intent
Create a Stripe PaymentIntent for subscription setup.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customerId | string | Yes | Stripe customer ID |
| plan | string | Yes | Plan name |
| amount | number | Yes | Amount in cents |

---

#### POST /api/stripe/create-subscription
Create a recurring subscription after initial payment.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customerId | string | Yes | Stripe customer ID |
| plan | string | Yes | Plan name |
| tenantId | string | Yes | Tenant ID |

---

#### POST /api/stripe/create-credit-intent
Create PaymentIntent for credit top-off purchase.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant ID |
| credits | number | Yes | Credits to purchase |

---

#### POST /api/stripe/customer-portal
Get link to Stripe customer billing portal.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | string | Yes | Tenant ID |

---

#### POST /api/stripe/webhooks
Handle Stripe webhook events.

**Auth:** Stripe webhook signature verification

**Events handled:**
- `payment_intent.succeeded` — Mark payment complete
- `invoice.payment_failed` — Flag billing issue
- `customer.subscription.updated` — Sync plan changes
- `customer.subscription.deleted` — Handle cancellation

---

### Scheduled / Cron Endpoints

#### GET /api/scheduled/run-all-tenants
Master cron: Triggers AI journalist runs across all active tenants.

**Auth:** Vercel cron header (`x-vercel-cron: 1`) or X-Platform-Secret
**Schedule:** Every 15 minutes

---

#### GET /api/scheduled/backup-tenants
Daily backup of all active tenant data to Google Cloud Storage.

**Auth:** Vercel cron header or X-Platform-Secret
**Schedule:** Daily at 3:00 AM EST

---

### Onboarding Endpoints

#### POST /api/onboarding/save
Save onboarding progress with resume token.

**Auth:** None (public)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| currentStep | number | Yes | Current wizard step |
| domainOption | string | No | Domain choice |
| domain | string | No | Custom domain |
| serviceArea | object | No | City/county/state |
| selectedCategories | array | No | Chosen categories |
| ownerEmail | string | No | Owner email |
| newspaperName | string | No | Paper name |
| resumeToken | string | No | Existing token to update |

**Response:**
```json
{ "success": true, "resumeToken": "abc123" }
```

---

#### GET /api/onboarding/save?token=xxx
Load onboarding progress by resume token.

---

## Tenant Site API Endpoints (each newspaper)

### Content Generation

#### POST /api/scheduled/run-agents
Main article generation engine. Runs AI journalist agents.

**Auth:** `Authorization: Bearer ${SCHEDULED_RUNNER_API_KEY}` (optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agentId | string | No | Run specific agent only |
| force | boolean | No | Ignore schedule, run now |
| preview | boolean | No | Generate without saving |

**Response:**
```json
{
  "success": true,
  "agentsProcessed": 3,
  "successCount": 2,
  "failedCount": 1,
  "totalTimeMs": 45000,
  "results": [
    {
      "agentId": "...",
      "agentName": "Alex Chen",
      "success": true,
      "articleId": "...",
      "title": "...",
      "category": "sports",
      "generationTimeMs": 15000
    }
  ]
}
```

---

#### POST /api/fact-check
Fact-check an article using Gemini + optional Perplexity verification.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mode | string | Yes | `"quick"` or `"detailed"` |
| title | string | Yes | Article title |
| content | string | Yes | Article content |
| articleId | string | No | Article ID (updates Firestore) |
| sourceTitle | string | No | Original source title |
| sourceSummary | string | No | Original source summary |
| sourceUrl | string | No | Original source URL |
| usePerplexity | boolean | No | Use live web verification |

**Response:**
```json
{
  "mode": "detailed",
  "status": "passed",
  "summary": "Article accurately represents source material...",
  "confidence": 92,
  "claims": [
    { "claim": "City Council approved $2M budget", "status": "verified", "explanation": "Confirmed in source" }
  ],
  "recommendations": ["Consider adding date of vote"],
  "checkedAt": "2026-02-16T..."
}
```

**Status Values:** `passed`, `review_recommended`, `caution`, `high_risk`

---

#### POST /api/fact-check/claim-action
Apply fact-check recommendations to article content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | `"suggest-fix"`, `"remove"`, `"investigate"` |
| claimText | string | Yes | The flagged claim text |
| articleTitle | string | Yes | Article title |
| articleContent | string | Yes | Full article content |

---

#### POST /api/articles/generate-metadata
Generate SEO metadata for an article.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Article title |
| content | string | Yes | Article content |
| category | string | No | Article category |
| imageUrl | string | No | Article image URL |
| authorName | string | No | Author name |
| generateTypes | array | No | `["metaDescription", "imageAltText", "hashtags", "all"]` |

**Response:**
```json
{
  "success": true,
  "metadata": {
    "metaDescription": "...",
    "keywords": ["..."],
    "hashtags": ["#..."],
    "localKeywords": ["Greater Atlanta"],
    "geoTags": ["Atlanta", "Georgia"],
    "entities": { "people": [], "organizations": [], "locations": [], "topics": [] },
    "imageAltText": "...",
    "schema": { "@context": "https://schema.org", "@type": "NewsArticle", "..." }
  }
}
```
**Credit Cost:** 3 credits

---

#### POST /api/articles/save
Save an article from preview mode.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| article | object | Yes | Full article data |
| sourceItemId | string | No | Source RSS item ID |
| agentId | string | No | AI journalist ID |
| status | string | No | `"published"` or `"draft"` |

---

#### POST /api/ai/generate-image
Generate an article image via Gemini or DALL-E.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Article title for context |
| customPrompt | string | No | Override the auto-generated prompt |
| category | string | No | Article category |
| provider | string | No | `"gemini"` or `"dalle"` |
| model | string | No | Specific model ID |
| params | object | No | Provider-specific params |

---

#### POST /api/content/fetch-sources
Fetch and parse RSS feeds for content sources.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sourceId | string | No | Specific source to fetch |
| categoryId | string | No | Filter by category |

---

### Reader-Facing Endpoints

#### POST /api/chat
AI chat assistant for readers.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message | string | Yes | Reader's message |
| history | array | No | Conversation history |
| personaId | string | No | Chat persona to use |

---

#### POST /api/tts
Convert article text to speech audio.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| text | string | Yes | Text to convert |
| voiceConfig | object | No | Voice settings override |

**voiceConfig:**
```json
{
  "voiceId": "...",
  "stability": 0.5,
  "similarityBoost": 0.75,
  "style": 0.0,
  "useSpeakerBoost": true
}
```

---

### Newsletter Endpoints

#### POST /api/newsletter/subscribe
Subscribe an email to the newsletter.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Subscriber email |
| source | string | No | Signup source |

---

#### POST /api/newsletter/unsubscribe
Unsubscribe from the newsletter.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Email to unsubscribe |

---

#### POST /api/newsletter/send
Send a newsletter to all active subscribers.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| newsletterId | string | Yes | Newsletter to send |

---

### Monetization Endpoints

#### POST /api/advertising/checkout
Create Stripe checkout for ad campaign purchase.

#### POST /api/directory/checkout
Create Stripe checkout for featured directory listing.

#### POST /api/subscriptions/checkout
Create reader subscription checkout via Stripe Connect.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| interval | string | Yes | `"month"` or `"year"` |
| email | string | No | Subscriber email |

---

### Settings & Configuration

#### GET /api/site-config
Public site configuration (name, branding, social, hours).

#### GET /api/settings
Branding settings (tagline, logo, colors).

#### GET /api/menus
Navigation menus (with platform fallback).

#### GET /api/settings/service-area
Service area from environment variables.

---

### Admin Utilities (Tenant-Side)

#### POST /api/admin/pause-all-agents
Disable scheduling for all AI journalists.

#### GET/PUT /api/admin/api-keys
View (masked) or update API keys stored in Firestore settings.

#### GET/PUT/POST /api/admin/site-config
Full site configuration management (deep merge updates).

#### POST /api/admin/domain-request
Submit or cancel a custom domain request to the platform.

#### POST /api/admin/change-password
Admin changes a user's password.

#### POST /api/admin/assign-author
Bulk reassign article authorship.

#### POST /api/admin/fix-article-status
Bulk update article statuses.

---

### Seeding Endpoints (Onboarding)

All POST, used during tenant provisioning:

| Endpoint | Description |
|----------|-------------|
| `/api/seed-journalists` | Create AI journalist personas |
| `/api/blog/seed` | Seed initial articles |
| `/api/ads/seed` | Seed sample ad campaigns |
| `/api/advertising/seed` | Seed advertising data |
| `/api/community/seed` | Seed community content |
| `/api/directory/seed` | Seed business directory |
| `/api/events/seed` | Seed local events |

---

### Utility Endpoints

#### POST /api/proxy-image
Server-side image proxy to bypass CORS.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | External image URL |

**Response:**
```json
{ "success": true, "dataUrl": "data:image/jpeg;base64,...", "contentType": "image/jpeg", "size": 45000 }
```

---

#### POST /api/upload
Upload file to Firebase Storage.

**Auth:** Firebase Auth token (Bearer header)

**Body:** multipart/form-data
| Field | Type | Description |
|-------|------|-------------|
| file | File | The file to upload |
| folder | string | Storage folder (default: `uploads`) |

---

#### POST /api/revalidate
Revalidate Next.js cached paths (ISR).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| paths | array | Yes | Paths to revalidate (e.g., `["/", "/category/news"]`) |

---

## Error Responses

All endpoints return errors in a consistent format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `400` — Bad request (missing/invalid parameters)
- `401` — Unauthorized (missing or invalid auth)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `429` — Rate limited
- `500` — Internal server error

---

## Rate Limits

- AI generation endpoints: No explicit rate limit (controlled by credit system)
- Stripe webhooks: Handled by Stripe's retry logic
- Cron endpoints: Protected by Vercel cron headers
- Public endpoints: Standard Vercel limits apply

---

## Environment Variables

### Platform (newsroomaios.com)
```
PLATFORM_SECRET          # Auth for internal calls
VERCEL_TOKEN             # Vercel API access
STRIPE_SECRET_KEY        # Stripe billing
STRIPE_WEBHOOK_SECRET    # Webhook verification
GEMINI_API_KEY           # AI generation
PERPLEXITY_API_KEY       # Web search
PEXELS_API_KEY           # Stock photos
ELEVENLABS_API_KEY       # Text-to-speech
GOOGLE_PLACES_API_KEY    # Location services
```

### Tenant Sites
```
TENANT_ID                          # Firestore tenant ID
TENANT_SLUG                        # URL-friendly slug
NEXT_PUBLIC_TENANT_ID              # Client-side tenant ID
NEXT_PUBLIC_SITE_NAME              # Newspaper name
SERVICE_AREA_CITY                  # City name
SERVICE_AREA_STATE                 # State abbreviation
PLATFORM_API_URL                   # Platform base URL
TENANT_API_KEY                     # Platform auth key
NEXT_PUBLIC_TENANT_API_KEY         # Client-side platform auth
PLATFORM_SECRET                    # Internal auth
GEMINI_API_KEY                     # AI (injected by platform)
PERPLEXITY_API_KEY                 # Search (injected by platform)
PEXELS_API_KEY                     # Photos (injected by platform)
ELEVENLABS_API_KEY                 # TTS (injected by platform)
GOOGLE_PLACES_API_KEY              # Places (injected by platform)
NEXT_PUBLIC_FIREBASE_API_KEY       # Firebase client
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN   # Firebase auth
NEXT_PUBLIC_FIREBASE_PROJECT_ID    # Firebase project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET # Firebase storage
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID # Firebase messaging
NEXT_PUBLIC_FIREBASE_APP_ID        # Firebase app
```
