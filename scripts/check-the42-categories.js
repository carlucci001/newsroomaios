/**
 * Check the42.news tenant categories
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    console.error('FIREBASE_SERVICE_ACCOUNT environment variable not set');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkThe42Categories() {
  const tenantId = 'tenant_1770138901335_awej6s3mo'; // the42.news

  console.log('\n=== CHECKING THE42.NEWS CATEGORIES ===\n');

  try {
    // Get tenant data
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    const tenantData = tenantDoc.data();

    console.log('Business Name:', tenantData.businessName);
    console.log('Domain:', tenantData.domain);
    console.log('\nCategories in tenant record:');
    console.log(JSON.stringify(tenantData.categories, null, 2));

    // Get categories subcollection
    console.log('\n=== CATEGORIES SUBCOLLECTION ===\n');
    const categoriesSnapshot = await db.collection(`tenants/${tenantId}/categories`).get();

    if (categoriesSnapshot.empty) {
      console.log('⚠️  No categories in subcollection!');
    } else {
      categoriesSnapshot.docs.forEach(doc => {
        console.log(`${doc.id}:`, JSON.stringify(doc.data(), null, 2));
      });
    }

    // Get siteConfig/navigation
    console.log('\n=== SITECONFIG NAVIGATION ===\n');
    const navDoc = await db.collection(`tenants/${tenantId}/siteConfig`).doc('navigation').get();
    if (navDoc.exists) {
      const navData = navDoc.data();
      console.log('Main Nav:', JSON.stringify(navData.mainNav, null, 2));
      console.log('Footer Nav:', JSON.stringify(navData.footerNav, null, 2));
    } else {
      console.log('⚠️  No navigation config found!');
    }

    console.log('\n✅ Check complete\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error checking categories:', error);
    process.exit(1);
  }
}

checkThe42Categories();
