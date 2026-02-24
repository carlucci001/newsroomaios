#!/usr/bin/env node
/**
 * Backfill tenantId on legacy Firestore documents
 *
 * Root-level collections (aiJournalists, personas, media, agentPrompts,
 * scheduledTasks, contentSources, contentItems) may have documents
 * created before tenant isolation was added. This script adds the
 * missing tenantId field by cross-referencing with tenant data.
 *
 * Usage:
 *   node scripts/backfill-tenant-ids.js          # Dry run (shows what would change)
 *   node scripts/backfill-tenant-ids.js --apply   # Actually write changes
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, '..', 'serviceAccountKey.json');

try {
  const sa = require(saPath);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
} catch {
  // Try Application Default Credentials
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

const db = admin.firestore();
const DRY_RUN = !process.argv.includes('--apply');

const ROOT_COLLECTIONS = [
  'aiJournalists',
  'personas',
  'media',
  'agentPrompts',
  'scheduledTasks',
  'contentSources',
  'contentItems',
];

async function getTenantMap() {
  const snap = await db.collection('tenants').get();
  const map = new Map();
  snap.docs.forEach(d => {
    const data = d.data();
    map.set(d.id, {
      id: d.id,
      slug: data.slug || d.id,
      name: data.businessName || data.slug || d.id,
    });
  });
  console.log(`Found ${map.size} tenants`);
  return map;
}

async function backfillCollection(collectionName, tenantMap) {
  const snap = await db.collection(collectionName).get();
  let total = 0;
  let missing = 0;
  let updated = 0;
  let ambiguous = 0;

  const batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snap.docs) {
    total++;
    const data = docSnap.data();

    // Skip if already has tenantId
    if (data.tenantId) continue;
    missing++;

    // Try to determine tenant ownership
    let assignedTenantId = null;

    // Strategy 1: If there's only one tenant, assign to it
    if (tenantMap.size === 1) {
      assignedTenantId = tenantMap.keys().next().value;
    }

    // Strategy 2: Check if doc has an agentId that references a known journalist with tenantId
    if (!assignedTenantId && data.agentId) {
      try {
        const agentDoc = await db.collection('aiJournalists').doc(data.agentId).get();
        if (agentDoc.exists && agentDoc.data().tenantId) {
          assignedTenantId = agentDoc.data().tenantId;
        }
      } catch { /* skip */ }
    }

    // Strategy 3: Check if doc was created by a user that belongs to a tenant
    if (!assignedTenantId && data.createdBy) {
      for (const [tenantId] of tenantMap) {
        try {
          const userDoc = await db.collection(`tenants/${tenantId}/users`).doc(data.createdBy).get();
          if (userDoc.exists) {
            assignedTenantId = tenantId;
            break;
          }
        } catch { /* skip */ }
      }
    }

    // Strategy 4: Check uploadedBy field (media collection)
    if (!assignedTenantId && data.uploadedBy) {
      for (const [tenantId] of tenantMap) {
        try {
          const userDoc = await db.collection(`tenants/${tenantId}/users`).doc(data.uploadedBy).get();
          if (userDoc.exists) {
            assignedTenantId = tenantId;
            break;
          }
        } catch { /* skip */ }
      }
    }

    // Strategy 5: For agentPrompts, the doc ID may contain a tenant slug or the agentType
    // These are less reliable, skip for safety

    if (assignedTenantId) {
      const tenantInfo = tenantMap.get(assignedTenantId);
      if (DRY_RUN) {
        console.log(`  [DRY RUN] ${collectionName}/${docSnap.id} → tenantId: ${assignedTenantId} (${tenantInfo?.name})`);
      } else {
        batch.update(docSnap.ref, { tenantId: assignedTenantId });
        batchCount++;
        // Firestore batch limit is 500
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }
      updated++;
    } else {
      ambiguous++;
      console.log(`  [AMBIGUOUS] ${collectionName}/${docSnap.id} — could not determine tenant (name: ${data.name || data.filename || data.agentType || 'unknown'})`);
    }
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
  }

  return { total, missing, updated, ambiguous };
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  TENANT ID BACKFILL — ${DRY_RUN ? 'DRY RUN' : 'APPLYING CHANGES'}`);
  console.log(`${'='.repeat(60)}\n`);

  if (DRY_RUN) {
    console.log('  This is a dry run. No changes will be written.');
    console.log('  Run with --apply to actually update documents.\n');
  }

  const tenantMap = await getTenantMap();
  console.log('');

  const results = {};
  for (const col of ROOT_COLLECTIONS) {
    console.log(`Scanning ${col}...`);
    results[col] = await backfillCollection(col, tenantMap);
    const r = results[col];
    console.log(`  ${col}: ${r.total} total, ${r.missing} missing tenantId, ${r.updated} ${DRY_RUN ? 'would update' : 'updated'}, ${r.ambiguous} ambiguous\n`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('  SUMMARY');
  console.log(`${'='.repeat(60)}`);

  let grandTotal = 0, grandMissing = 0, grandUpdated = 0, grandAmbiguous = 0;
  for (const [col, r] of Object.entries(results)) {
    grandTotal += r.total;
    grandMissing += r.missing;
    grandUpdated += r.updated;
    grandAmbiguous += r.ambiguous;
  }

  console.log(`  Total documents scanned: ${grandTotal}`);
  console.log(`  Missing tenantId: ${grandMissing}`);
  console.log(`  ${DRY_RUN ? 'Would update' : 'Updated'}: ${grandUpdated}`);
  console.log(`  Ambiguous (needs manual review): ${grandAmbiguous}`);

  if (DRY_RUN && grandUpdated > 0) {
    console.log(`\n  Run with --apply to write these changes.`);
  }

  console.log('');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
