#!/usr/bin/env node

/**
 * Migrate the42's root-level Firestore data to tenant-scoped paths.
 *
 * Previously, the wnct-template had hardcoded paths like doc(db, 'settings', 'config')
 * which read/wrote to root-level collections. Now all paths are tenant-scoped:
 *   settings/config → tenants/the42/settings/config
 *   settings/site-config → tenants/the42/settings/site-config
 *   settings/modules → tenants/the42/settings/modules
 *   settings/advertising → tenants/the42/settings/advertising
 *
 * This script copies existing root data into the tenant-scoped paths
 * so the42 works immediately after deploying the updated template.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls',
  authDomain: 'newsroomasios.firebaseapp.com',
  projectId: 'newsroomasios',
});

const db = getFirestore(app);
const TENANT_ID = 'the42';

// Documents to migrate from root settings to tenant-scoped settings
const SETTINGS_DOCS = ['config', 'site-config', 'modules', 'advertising'];

// Documents to migrate from root siteConfig to tenant-scoped siteConfig
const SITE_CONFIG_DOCS = ['general', 'navigation', 'categories'];

async function migrate() {
  console.log(`\n🔄 Migrating root-level data to tenants/${TENANT_ID}/...\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  // Migrate settings/* → tenants/the42/settings/*
  for (const docId of SETTINGS_DOCS) {
    try {
      const rootRef = doc(db, 'settings', docId);
      const rootSnap = await getDoc(rootRef);

      if (!rootSnap.exists()) {
        console.log(`  ⏭️  settings/${docId} — not found in root, skipping`);
        skipped++;
        continue;
      }

      const data = rootSnap.data();
      const tenantRef = doc(db, `tenants/${TENANT_ID}/settings`, docId);
      const tenantSnap = await getDoc(tenantRef);

      if (tenantSnap.exists()) {
        // Merge: tenant-scoped data takes precedence, fill in missing fields from root
        const existingData = tenantSnap.data();
        const merged = { ...data, ...existingData };
        await setDoc(tenantRef, merged);
        console.log(`  ✅ settings/${docId} — merged (tenant data preserved, root data filled gaps)`);
      } else {
        await setDoc(tenantRef, data);
        console.log(`  ✅ settings/${docId} — copied from root`);
      }
      migrated++;
    } catch (err) {
      console.error(`  ❌ settings/${docId} — error:`, err.message);
      errors++;
    }
  }

  // Migrate siteConfig/* → tenants/the42/siteConfig/*
  for (const docId of SITE_CONFIG_DOCS) {
    try {
      const rootRef = doc(db, 'siteConfig', docId);
      const rootSnap = await getDoc(rootRef);

      if (!rootSnap.exists()) {
        console.log(`  ⏭️  siteConfig/${docId} — not found in root, skipping`);
        skipped++;
        continue;
      }

      const data = rootSnap.data();
      const tenantRef = doc(db, `tenants/${TENANT_ID}/siteConfig`, docId);
      const tenantSnap = await getDoc(tenantRef);

      if (tenantSnap.exists()) {
        const existingData = tenantSnap.data();
        const merged = { ...data, ...existingData };
        await setDoc(tenantRef, merged);
        console.log(`  ✅ siteConfig/${docId} — merged (tenant data preserved)`);
      } else {
        await setDoc(tenantRef, data);
        console.log(`  ✅ siteConfig/${docId} — copied from root`);
      }
      migrated++;
    } catch (err) {
      console.error(`  ❌ siteConfig/${docId} — error:`, err.message);
      errors++;
    }
  }

  console.log(`\n📊 Migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
  console.log('\nThe42 will now read from tenant-scoped collections after redeployment.');
  process.exit(errors > 0 ? 1 : 0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
