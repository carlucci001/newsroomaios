import { NextResponse } from 'next/server';
import { getAdminApp, getAdminDb } from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * POST /api/admin/migrate-wnct
 *
 * One-time migration: copies WNC Times data from the 'gwnct' named Firestore database
 * to the default database under tenants/wnct-times/ (standard multi-tenant paths).
 *
 * This brings WNC Times into the same architecture as all other tenants.
 *
 * Requires X-Platform-Secret header.
 * Optional query params:
 *   ?dryRun=true  — report what would be copied without actually writing
 *   ?collections=articles,categories  — only migrate specific collections
 */
export async function POST(request: Request) {
  // Auth check
  const secret = request.headers.get('x-platform-secret');
  if (secret !== process.env.PLATFORM_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';
  const collectionsParam = url.searchParams.get('collections');

  const TENANT_ID = 'wnct-times';

  // Collections to migrate from gwnct root to default db under tenants/{id}/
  const allCollections = [
    'articles',
    'categories',
    'siteConfig',
    'aiJournalists',
    'settings',
    'menus',
  ];

  const collectionsToMigrate = collectionsParam
    ? collectionsParam.split(',').filter(c => allCollections.includes(c))
    : allCollections;

  try {
    const adminApp = getAdminApp();
    if (!adminApp) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // Source: gwnct named database (where WNC Times data lives)
    const sourceDb = getFirestore(adminApp, 'gwnct');
    // Destination: default database (where all tenants live)
    const destDb = getAdminDb();

    if (!destDb) {
      return NextResponse.json({ error: 'Could not get default Firestore database' }, { status: 500 });
    }

    const results: Record<string, { found: number; copied: number; skipped: number; errors: string[] }> = {};

    for (const collName of collectionsToMigrate) {
      const stats = { found: 0, copied: 0, skipped: 0, errors: [] as string[] };

      try {
        // Read all documents from gwnct root-level collection
        const sourceSnap = await sourceDb.collection(collName).get();
        stats.found = sourceSnap.size;

        if (sourceSnap.empty) {
          console.log(`[migrate-wnct] ${collName}: no documents in gwnct`);
          results[collName] = stats;
          continue;
        }

        console.log(`[migrate-wnct] ${collName}: found ${sourceSnap.size} documents in gwnct`);

        // Copy each document to tenants/{TENANT_ID}/{collName}/
        const destPath = `tenants/${TENANT_ID}/${collName}`;

        for (const doc of sourceSnap.docs) {
          try {
            // Check if document already exists in destination
            const destDoc = await destDb.doc(`${destPath}/${doc.id}`).get();
            if (destDoc.exists) {
              stats.skipped++;
              continue;
            }

            if (!dryRun) {
              await destDb.doc(`${destPath}/${doc.id}`).set(doc.data());
            }
            stats.copied++;
          } catch (e: any) {
            stats.errors.push(`${doc.id}: ${e.message}`);
          }
        }

        console.log(`[migrate-wnct] ${collName}: copied=${stats.copied}, skipped=${stats.skipped}, errors=${stats.errors.length}`);
      } catch (e: any) {
        stats.errors.push(`Collection error: ${e.message}`);
        console.error(`[migrate-wnct] ${collName} error:`, e.message);
      }

      results[collName] = stats;
    }

    // Also check for subcollections of articles (like comments, etc.)
    // For now, top-level documents only

    const totalCopied = Object.values(results).reduce((sum, r) => sum + r.copied, 0);
    const totalFound = Object.values(results).reduce((sum, r) => sum + r.found, 0);
    const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0);

    return NextResponse.json({
      success: true,
      dryRun,
      tenantId: TENANT_ID,
      summary: {
        totalFound,
        totalCopied: dryRun ? `${totalCopied} (would copy)` : totalCopied,
        totalSkipped,
      },
      collections: results,
    });
  } catch (e: any) {
    console.error('[migrate-wnct] Fatal error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/migrate-wnct
 * Check the current state — what's in gwnct vs what's in default db for wnct-times
 */
export async function GET(request: Request) {
  const secret = request.headers.get('x-platform-secret');
  if (secret !== process.env.PLATFORM_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const TENANT_ID = 'wnct-times';

  try {
    const adminApp = getAdminApp();
    if (!adminApp) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const sourceDb = getFirestore(adminApp, 'gwnct');
    const destDb = getAdminDb();

    if (!destDb) {
      return NextResponse.json({ error: 'Could not get default Firestore database' }, { status: 500 });
    }

    const collections = ['articles', 'categories', 'siteConfig', 'aiJournalists', 'settings', 'menus'];
    const status: Record<string, { gwnct: number; defaultDb: number }> = {};

    for (const col of collections) {
      let gwnctCount = 0;
      let defaultCount = 0;

      try {
        const gwnctSnap = await sourceDb.collection(col).count().get();
        gwnctCount = gwnctSnap.data().count;
      } catch {
        gwnctCount = -1; // Error
      }

      try {
        const defaultSnap = await destDb.collection(`tenants/${TENANT_ID}/${col}`).count().get();
        defaultCount = defaultSnap.data().count;
      } catch {
        defaultCount = -1; // Error
      }

      status[col] = { gwnct: gwnctCount, defaultDb: defaultCount };
    }

    // Also check if tenant record exists
    const tenantDoc = await destDb.doc(`tenants/${TENANT_ID}`).get();

    return NextResponse.json({
      tenantId: TENANT_ID,
      tenantRecordExists: tenantDoc.exists,
      collections: status,
      message: 'Use POST to run the migration. Add ?dryRun=true for a test run.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
