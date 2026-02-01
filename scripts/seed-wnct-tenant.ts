/**
 * Seed script to add WNC Times as the first tenant
 * Run with: npx ts-node scripts/seed-wnct-tenant.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
  storageBucket: "newsroomasios.firebasestorage.app",
  messagingSenderId: "23445908902",
  appId: "1:23445908902:web:ead0e3559af558852b7367",
};

async function seedWNCTenant() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const tenantId = 'wnct-times';
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  console.log('Creating WNC Times tenant...');

  // Create tenant document with specific ID
  await setDoc(doc(db, 'tenants', tenantId), {
    businessName: 'WNC Times',
    slug: 'wnct-times',
    domain: 'wnctimes.com',
    ownerEmail: 'admin@wnctimes.com',
    apiKey: 'wnct-api-key-2024',
    serviceArea: {
      city: 'Asheville',
      state: 'NC',
      region: 'Western North Carolina',
    },
    categories: [
      { id: 'local-news', name: 'Local News', slug: 'local-news', directive: 'Western NC local news', enabled: true },
      { id: 'sports', name: 'Sports', slug: 'sports', directive: 'Local sports coverage', enabled: true },
      { id: 'business', name: 'Business', slug: 'business', directive: 'Regional business news', enabled: true },
      { id: 'weather', name: 'Weather', slug: 'weather', directive: 'WNC weather updates', enabled: true },
      { id: 'community', name: 'Community', slug: 'community', directive: 'Community events', enabled: true },
      { id: 'politics', name: 'Politics', slug: 'politics', directive: 'Local government news', enabled: true },
    ],
    status: 'active',
    licensingStatus: 'active',
    createdAt: now,
    platformUrl: 'https://newsroomaios.com',
  });

  console.log('Creating credit allocation...');

  // Create credit allocation - Professional plan (2000 credits/month)
  await addDoc(collection(db, 'tenantCredits'), {
    tenantId: tenantId,
    planId: 'professional',
    cycleStartDate: now,
    cycleEndDate: endOfMonth,
    monthlyAllocation: 2000,
    creditsUsed: 0,
    creditsRemaining: 2000,
    overageCredits: 0,
    softLimit: 1600, // 80% warning
    hardLimit: 0, // No hard limit
    status: 'active',
    softLimitWarned: false,
  });

  console.log('✅ WNC Times tenant created successfully!');
  console.log('   Tenant ID: wnct-times');
  console.log('   Credits: 2000/month (Professional plan)');

  process.exit(0);
}

seedWNCTenant().catch((error) => {
  console.error('Error seeding tenant:', error);
  process.exit(1);
});
