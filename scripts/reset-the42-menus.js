/**
 * Reset the42.news menus using Firebase Admin SDK
 * Deletes all menus so they'll be regenerated with proper categories on next access
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
    console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable not set');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function resetMenus() {
  const tenantId = 'tenant_1770138901335_awej6s3mo'; // the42.news

  console.log('\n🔄 Resetting menus for the42.news...\n');

  try {
    // Delete all menus for this tenant
    const menusRef = db.collection('tenants').doc(tenantId).collection('menus');
    const snapshot = await menusRef.get();

    console.log(`📋 Found ${snapshot.size} menus to delete`);

    if (snapshot.empty) {
      console.log('⚠️  No menus to delete');
      process.exit(0);
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      console.log(`   - Deleting menu: ${doc.id}`);
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`\n✅ Deleted ${snapshot.size} menus`);
    console.log('\n📝 Next time the42.news accesses menus, they will be regenerated with:');
    console.log('   - Selected categories (Agriculture, Local News, etc.)');
    console.log('   - All standard pages (Directory, Blog, Community, Advertise, etc.)');
    console.log('\n🔗 Test at: https://the42.news/admin (Navigation section)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to reset menus:', error);
    process.exit(1);
  }
}

resetMenus();
