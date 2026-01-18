# Newsroom AIOS - Multi-Tenant Newspaper SaaS Platform

**Domain**: newsroomaios.com (NO HYPHEN)

Launch your local newspaper in minutes with AI-powered content, advertising, and directory features.

## Project Status

✅ **Foundation Complete**
- Next.js 15 + TypeScript
- Firebase Client SDK + Admin SDK
- Stripe integration ready
- Google AI integration ready
- Tailwind CSS v4
- UI component library (Radix)
- Dark mode support

⏳ **Pending Setup**
- Create Firebase project (see [FIREBASE-SETUP.md](FIREBASE-SETUP.md))
- Configure environment variables
- Deploy Firestore security rules
- Build homepage and onboarding flows

## Quick Start

### 1. Create Firebase Project

Follow the instructions in [FIREBASE-SETUP.md](FIREBASE-SETUP.md) to:
- Create a new Firebase project
- Enable Firestore, Authentication, and Storage
- Get your Firebase configuration

### 2. Set Up Environment Variables

Copy `.env.local.template` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.local.template .env.local
```

Then edit `.env.local` with your Firebase config values.

### 3. Install Dependencies (Already Done)

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deploy Firebase Rules

Once your Firebase project is created:

```bash
firebase login
firebase init  # Select: Firestore, Storage
firebase deploy --only firestore,storage
```

## Project Structure

```
newsroomaios/
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Homepage
│   └── globals.css      # Global styles (Tailwind v4)
├── src/
│   ├── components/
│   │   └── ui/          # Reusable UI components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── firebase.ts  # Firebase configuration
│   │   └── utils.ts     # Utility functions (cn, etc.)
│   └── types/           # TypeScript types
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
└── .env.local          # Environment variables (not in git)
```

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library

### Backend
- **Firebase Firestore**: NoSQL database
- **Firebase Authentication**: User auth
- **Firebase Storage**: File storage
- **Firebase Admin SDK**: Server-side operations

### Payments & AI
- **Stripe**: Payment processing
- **Google AI (Gemini)**: AI banner generation
- **Google Imagen 3**: Professional image generation

### Deployment
- **Vercel**: Hosting (recommended)
- **Firebase Hosting**: Alternative option

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for deployment instructions.

## Environment Variables

Required variables (get from Firebase Console):

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Stripe (add later)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Google AI (add later)
GOOGLE_AI_API_KEY=
```

## Key Features (Planned)

### For Newspapers (Tenants)
- **Advertiser Onboarding**: AI-generated banners, flexible pricing
- **Business Directory**: Free and featured listings
- **Newsletter Subscriptions**: Free and premium tiers
- **Revenue Dashboard**: Track all income streams

### For Platform
- **Multi-Tenancy**: Manage unlimited newspaper clients
- **Credit-Based Billing**: Usage-based pricing
- **Admin Dashboard**: Approve advertisers, manage tenants
- **Analytics**: Revenue tracking per tenant

## Architecture

This platform uses a **credit-based billing** system where:
- Tenants subscribe to monthly plans (credits)
- AI features deduct credits on use
- Platform tracks revenue per tenant
- Future: Stripe Connect for direct payments

See the [implementation plan](https://claude.com/claude-code) for full details.

## Development Notes

- **No hyphens**: Project name is `newsroomaios` (not newsroom-aios)
- **Database**: Uses Firebase default database (not named like wnct-next)
- **Separation**: This is the PLATFORM, wnct-next is a CLIENT
- **Styling**: Matches wnct-next for consistency

## Next Steps

1. ✅ Create Firebase project
2. ✅ Add environment variables
3. Deploy Firestore rules
4. Build homepage
5. Create pricing page
6. Implement sign-up wizard
7. Set up Stripe integration
8. Deploy to Vercel

## Documentation

- [FIREBASE-SETUP.md](FIREBASE-SETUP.md) - Firebase configuration guide
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Deployment instructions
- [RECOVERY-PROCEDURE.md](../wnct-next/RECOVERY-PROCEDURE.md) - Backup/recovery (wnct-next)

## Support

- Firebase Console: https://console.firebase.google.com
- Vercel Dashboard: https://vercel.com
- Stripe Dashboard: https://dashboard.stripe.com

---

**Current Status**: Foundation ready, waiting for Firebase project creation.
