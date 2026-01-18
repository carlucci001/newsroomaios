# Firebase Setup for Newsroom AIOS

## Step 1: Create New Firebase Project

1. **Go to**: https://console.firebase.google.com
2. **Click**: "Add project"
3. **Project name**: `newsroomaios` (or `newsroom-aios-platform`)
4. **Google Analytics**: Enable (recommended for tracking)
5. **Click**: "Create project"

---

## Step 2: Create Firestore Database

1. **In Firebase Console** → Build → Firestore Database
2. **Click**: "Create database"
3. **Mode**: Start in **production mode** (we'll deploy rules later)
4. **Location**: Choose closest to your users (e.g., `us-east1`)
5. **Click**: "Enable"

---

## Step 3: Get Firebase Configuration

1. **In Firebase Console** → Project Settings (gear icon) → General
2. **Scroll down** to "Your apps"
3. **Click**: Web icon `</>`
4. **App nickname**: `newsroomaios-web`
5. **Firebase Hosting**: Skip for now (using Vercel)
6. **Copy** the firebaseConfig object

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "newsroomaios.firebaseapp.com",
  projectId: "newsroomaios",
  storageBucket: "newsroomaios.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

---

## Step 4: Enable Authentication

1. **In Firebase Console** → Build → Authentication
2. **Click**: "Get started"
3. **Sign-in method** tab
4. **Enable**: Email/Password
5. **Enable**: Google (optional but recommended)
6. **Save**

---

## Step 5: Enable Storage

1. **In Firebase Console** → Build → Storage
2. **Click**: "Get started"
3. **Mode**: Start in **production mode**
4. **Location**: Same as Firestore
5. **Click**: "Done"

---

## Step 6: Create .env.local File

In `c:\dev\newsroomaios\`, create `.env.local` with your config:

```bash
# Firebase Configuration (from Step 3 above)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=newsroomaios.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=newsroomaios
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=newsroomaios.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Stripe (you'll add these later)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google AI (for banner generation - add later)
GOOGLE_AI_API_KEY=...
```

---

## Step 7: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
firebase login
```

---

## Step 8: Initialize Firebase in Project

```bash
cd c:\dev\newsroomaios
firebase init

# Select:
# - Firestore
# - Storage
#
# Choose existing project: newsroomaios
# Accept default file names (firestore.rules, storage.rules)
```

---

## What's Different from wnct-next?

**wnct-next (YOUR newspaper)**:
- Project ID: `gen-lang-client-0242565142`
- Database: `gwnct`
- Purpose: Production newspaper site

**newsroomaios (SaaS PLATFORM)**:
- Project ID: `newsroomaios` (or whatever you named it)
- Database: `(default)` Firestore database
- Purpose: Platform that manages multiple newspapers (tenants)

---

## Next Steps

After completing these steps, tell Claude:
- Your Firebase project ID
- Confirm .env.local is created

Then I'll:
1. Install all dependencies to match wnct-next
2. Copy UI components
3. Set up Firebase lib files
4. Deploy security rules
5. Create the homepage

---

## Important Notes

- **.env.local** is in .gitignore - never commit it
- Keep your API keys secure
- The platform database will store:
  - `tenants` collection (newspaper clients)
  - `advertisers` collection (advertiser signups)
  - `businesses` collection (directory listings)
  - `newsletter_subscriptions` collection
  - User accounts, payments, etc.
