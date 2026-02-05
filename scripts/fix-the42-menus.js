/**
 * Fix corrupted menu data for the42.news tenant
 * Removes null items and ensures all items have required properties
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

async function fixThe42Menus() {
  const tenantId = 'tenant_1770138901335_awej6s3mo'; // the42.news

  console.log(`\n🔧 Fixing menus for tenant: ${tenantId}\n`);

  try {
    const menusRef = db.collection('tenants').doc(tenantId).collection('menus');
    const snapshot = await menusRef.get();

    console.log(`📋 Found ${snapshot.size} menus\n`);

    for (const doc of snapshot.docs) {
      const menu = doc.data();
      console.log(`\n📝 Processing menu: ${menu.name} (${doc.id})`);
      console.log(`   Original items count: ${menu.items?.length || 0}`);

      if (!menu.items || !Array.isArray(menu.items)) {
        console.log('   ⚠️  No items array, initializing empty array');
        await doc.ref.update({
          items: [],
          updatedAt: new Date().toISOString(),
        });
        continue;
      }

      // Filter out null items and items with null labels
      const cleanItems = menu.items
        .filter(item => item != null)
        .filter(item => item.label != null && item.path != null)
        .map((item, index) => ({
          id: item.id || `item-${Date.now()}-${index}`,
          label: item.label,
          path: item.path,
          type: item.type || 'internal',
          enabled: item.enabled !== false,
          order: item.order ?? index,
        }));

      console.log(`   ✓ Clean items count: ${cleanItems.length}`);

      if (cleanItems.length !== menu.items.length) {
        console.log(`   ⚠️  Removed ${menu.items.length - cleanItems.length} corrupted items`);
      }

      // Show what items remain
      if (cleanItems.length > 0) {
        console.log('   Items:');
        cleanItems.forEach(item => {
          console.log(`     - ${item.label} → ${item.path}`);
        });
      } else {
        console.log('   ⚠️  No valid items found!');
      }

      // Update the menu with clean data
      await doc.ref.update({
        items: cleanItems,
        updatedAt: new Date().toISOString(),
      });

      console.log('   ✅ Menu updated');
    }

    console.log('\n✅ All menus fixed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing menus:', error);
    process.exit(1);
  }
}

fixThe42Menus();
