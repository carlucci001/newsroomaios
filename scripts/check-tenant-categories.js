const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const tenantId = 'tenant_1770080631285_tp82nake5';

async function checkTenant() {
  // Get tenant doc
  const tenantDoc = await db.collection('tenants').doc(tenantId).get();
  const tenant = tenantDoc.data();

  console.log('=== TENANT SETTINGS ===');
  console.log('Name:', tenant.newspaperName);
  console.log('Slug:', tenant.slug);
  console.log('\nSelected Categories:');
  if (tenant.selectedCategories) {
    tenant.selectedCategories.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat}`);
    });
  }

  // Check root-level settings collection
  const settingsSnap = await db.collection('tenants').doc(tenantId).collection('settings').get();
  console.log('\n=== TENANT SETTINGS SUBCOLLECTION ===');
  settingsSnap.docs.forEach(doc => {
    console.log('Doc ID:', doc.id);
    console.log('Data:', JSON.stringify(doc.data(), null, 2));
  });

  // Check root siteConfig
  const siteConfigSnap = await db.collection('tenants').doc(tenantId).collection('siteConfig').get();
  console.log('\n=== TENANT SITE CONFIG ===');
  siteConfigSnap.docs.forEach(doc => {
    console.log('Doc ID:', doc.id);
    const data = doc.data();
    if (doc.id === 'navigation' || doc.id === 'categories') {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  });

  // Check articles and their categories
  const articlesSnap = await db.collection('tenants').doc(tenantId).collection('articles').get();
  console.log('\n=== ARTICLES BY CATEGORY ===');
  const categoryCount = {};
  articlesSnap.docs.forEach(doc => {
    const data = doc.data();
    const cat = data.category || 'UNCATEGORIZED';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  console.log('Total articles:', articlesSnap.size);
  Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
}

checkTenant().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
