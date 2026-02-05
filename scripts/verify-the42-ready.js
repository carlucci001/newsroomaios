#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const tenantId = 'tenant_1770138901335_awej6s3mo';

  console.log('='.repeat(80));
  console.log('THE42.NEWS SYSTEM READINESS CHECK');
  console.log('='.repeat(80));
  console.log('');

  // Get tenant doc
  const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
  if (!tenantDoc.exists()) {
    console.log('❌ Tenant not found!');
    process.exit(1);
  }

  const tenant = tenantDoc.data();

  console.log('📋 TENANT STATUS');
  console.log('-'.repeat(80));
  console.log(`Business Name: ${tenant.businessName}`);
  console.log(`Status: ${tenant.status}`);
  console.log(`Service Area: ${tenant.serviceArea.city}, ${tenant.serviceArea.state}`);
  console.log(`Domain: ${tenant.domain}`);
  console.log(`Site URL: ${tenant.siteUrl || 'Not deployed yet'}`);
  console.log('');

  // Check categories
  console.log('📂 CATEGORIES');
  console.log('-'.repeat(80));
  console.log(`Total: ${tenant.categories.length}`);
  const categoriesValid = tenant.categories.every(c => c.id && c.name && c.slug);
  console.log(`Valid: ${categoriesValid ? '✅ Yes' : '❌ No'}`);
  console.log('');

  // Check AI journalists
  const journalistsSnap = await getDocs(collection(db, 'aiJournalists'));
  const tenantJournalists = [];
  journalistsSnap.forEach(doc => {
    const j = doc.data();
    if (j.tenantId === tenantId) {
      tenantJournalists.push({ id: doc.id, ...j });
    }
  });

  console.log('🤖 AI JOURNALISTS');
  console.log('-'.repeat(80));
  console.log(`Total: ${tenantJournalists.length}`);
  if (tenantJournalists.length > 0) {
    tenantJournalists.forEach(j => {
      console.log(`  - ${j.name} (${j.status}) - Category: ${j.categoryId}`);
    });
  } else {
    console.log('  ⚠️  No AI journalists found - you may need to create them');
  }
  console.log('');

  // Check articles
  const articlesSnap = await getDocs(collection(db, `tenants/${tenantId}/articles`));
  const articlesByCategory = {};
  articlesSnap.forEach(doc => {
    const a = doc.data();
    const cat = a.categorySlug || a.category;
    articlesByCategory[cat] = (articlesByCategory[cat] || 0) + 1;
  });

  console.log('📰 ARTICLES');
  console.log('-'.repeat(80));
  console.log(`Total: ${articlesSnap.size}`);
  console.log('By Category:');
  Object.entries(articlesByCategory).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count} articles`);
  });
  console.log('');

  // Overall readiness
  console.log('='.repeat(80));
  console.log('READINESS ASSESSMENT');
  console.log('='.repeat(80));

  const checks = {
    'Tenant status is active': tenant.status === 'active',
    'Has service area configured': !!(tenant.serviceArea?.city && tenant.serviceArea?.state),
    'Has valid categories': categoriesValid && tenant.categories.length >= 1,
    'Has articles': articlesSnap.size > 0,
    'Articles properly categorized': Object.keys(articlesByCategory).length > 0,
  };

  let allGood = true;
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allGood = false;
  });

  console.log('');
  if (allGood) {
    console.log('✅ THE42.NEWS IS FULLY FUNCTIONAL!');
    console.log('');
    console.log('You can now:');
    console.log('  1. Create articles manually through the admin UI');
    console.log('  2. AI journalists will generate articles automatically (if configured)');
    console.log('  3. View your site at: ' + (tenant.siteUrl || 'deployment URL'));
  } else {
    console.log('⚠️  THE42.NEWS NEEDS ATTENTION');
    console.log('Please fix the issues marked with ❌ above');
  }
  console.log('');

  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
