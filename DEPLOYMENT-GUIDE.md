# Newsroom AIOS Deployment Guide

## Recommended: Deploy to Vercel

### Why Vercel?
- **Zero Configuration**: Built specifically for Next.js
- **Auto-Deploy**: Push to GitHub → auto-builds → auto-deploys
- **Custom Domains**: Point newsroomaios.com in 2 minutes
- **Free HTTPS**: SSL certificates automatically generated
- **No Next.js Knowledge Required**: Everything "just works"

---

## Step-by-Step Deployment Process

### Step 1: Push Code to GitHub (5 minutes)

```bash
# Initialize git repository (if not already done)
cd c:\dev\newsroomaios
git init
git add .
git commit -m "Initial commit - newsroom AIOS platform"

# Create new GitHub repository at: https://github.com/new
# Name it: newsroomaios
# Then push:
git remote add origin https://github.com/[YOUR-USERNAME]/newsroomaios.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel (3 minutes)

1. **Go to**: https://vercel.com/signup
2. **Sign up** with your GitHub account (free)
3. **Click**: "Add New Project"
4. **Select**: Your `newsroomaios` repository
5. **Click**: "Deploy" (that's it - no configuration needed!)

Vercel will:
- Detect it's a Next.js app
- Install dependencies automatically
- Build the project
- Deploy it
- Give you a URL like: `newsroomaios.vercel.app`

### Step 3: Add Your Custom Domain (2 minutes)

1. **In Vercel Dashboard** → Select your project
2. **Go to**: Settings → Domains
3. **Add**: `newsroomaios.com`
4. **Copy** the DNS records Vercel shows you

### Step 4: Configure DNS (5 minutes)

**At your domain registrar** (GoDaddy, Namecheap, Cloudflare, etc.):

**Option A - Using A Record (Recommended)**:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**Option B - Using CNAME**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**For both**, add this CNAME:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: Auto
```

### Step 5: Wait for DNS (5-30 minutes)

- DNS propagation takes 5-30 minutes
- Vercel will automatically detect when ready
- HTTPS certificate auto-generates
- **Done!** Your site is live at newsroomaios.com

---

## Environment Variables Setup

For production, you'll need to add environment variables in Vercel:

1. **Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add these** (when ready):

```bash
# Firebase (copy from your .env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... etc

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Google AI (for banner generation)
GOOGLE_AI_API_KEY=...
```

3. **Redeploy** after adding variables (Vercel auto-redeploys)

---

## Automatic Deployments

Once set up, deployments are automatic:

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push

# Vercel automatically:
# 1. Detects the push
# 2. Builds the app
# 3. Deploys to production
# 4. Updates newsroomaios.com
#
# Takes 1-2 minutes total
```

---

## Alternative: Firebase Hosting (Not Recommended)

**Why it's harder:**
- Requires `firebase.json` configuration
- Need to set up Firebase Functions for SSR
- Manual build process: `npm run build` → `firebase deploy`
- More complex to troubleshoot
- Costs more for equivalent traffic

**Only use if:**
- You absolutely need Firebase Hosting features
- You want everything in one Firebase project
- You're already expert with Firebase Functions

**Setup** (if you really want this):
```bash
npm install -g firebase-tools
firebase init hosting
# Select: Use an existing project
# Build directory: .next
# Configure as SPA: No
# Set up automatic builds with GitHub: Yes
```

Then you need to configure Firebase Functions to serve Next.js... which is complex.

---

## Recommended Architecture

**For this SaaS platform, I recommend:**

```
newsroomaios.com (Vercel)
    ↓
Firebase Firestore (Database)
    ↓
Firebase Storage (Images/Files)
    ↓
Stripe (Payments)
    ↓
Google AI (Banner Generation)
```

**Why this works:**
- Vercel: Handles Next.js hosting (what it's built for)
- Firebase: Handles database/storage (what it's built for)
- Stripe: Handles payments (what it's built for)
- Each service does what it's best at

---

## Cost Estimate

**Vercel Free Tier Includes:**
- Unlimited sites
- 100GB bandwidth/month
- Automatic HTTPS
- Custom domains
- Perfect for this use case

**If you outgrow free tier:**
- Pro plan: $20/month per user
- Includes: 1TB bandwidth, better performance
- Only needed at scale (thousands of visitors/day)

**Firebase:**
- Firestore: Free tier generous (50K reads/day)
- Storage: Free tier = 5GB
- Functions: Pay-as-you-go (cheap for this use case)

**Stripe:**
- No monthly fee
- 2.9% + $0.30 per transaction
- Standard rate for all SaaS platforms

---

## Testing Before Domain Setup

Before pointing your domain, you can test on Vercel's free subdomain:

1. Deploy to Vercel (Steps 1-2 above)
2. Visit: `newsroomaios.vercel.app`
3. Test everything works
4. Then add custom domain when ready

---

## Rollback / Undo

Vercel keeps every deployment:

1. Go to Deployments tab
2. Click any previous deployment
3. Click "Promote to Production"
4. Instant rollback (takes 10 seconds)

No need for complex git branches or manual rollbacks.

---

## Summary

**What you get:**
✅ Professional domain: newsroomaios.com
✅ Automatic HTTPS (SSL certificate)
✅ Fast global CDN
✅ Auto-deploy on git push
✅ One-click rollbacks
✅ Zero Next.js knowledge required
✅ Free tier for development/launch

**What you do:**
1. Push code to GitHub (one time)
2. Connect to Vercel (one time, 3 clicks)
3. Add domain DNS records (one time, copy/paste)
4. Done - just push code to deploy updates

**Total setup time:** ~20 minutes (mostly waiting for DNS)

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: Very responsive on Twitter (@vercel)
- This is the standard deployment for 90% of Next.js apps
- Literally millions of sites use this exact setup
