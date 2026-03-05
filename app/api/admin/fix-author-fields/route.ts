import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

/**
 * POST /api/admin/fix-author-fields
 *
 * Finds articles where the `author` field is an object (e.g. { name: "...", @type: "Person" })
 * instead of a plain string, and flattens it to just the name string.
 *
 * Body: { tenantId: string } or { tenantId: "all" } to scan all tenants
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const tenantIds: string[] = [];

    if (tenantId === 'all') {
      const tenantsSnap = await adminDb.collection('tenants').get();
      tenantsSnap.docs.forEach(doc => tenantIds.push(doc.id));
    } else {
      tenantIds.push(tenantId);
    }

    const results: { tenantId: string; fixed: number; total: number; details: string[] }[] = [];

    for (const tid of tenantIds) {
      const articlesSnap = await adminDb.collection(`tenants/${tid}/articles`).get();
      if (articlesSnap.empty) {
        results.push({ tenantId: tid, fixed: 0, total: 0, details: [] });
        continue;
      }

      const batch = adminDb.batch();
      let fixed = 0;
      const details: string[] = [];

      articlesSnap.docs.forEach(doc => {
        const data = doc.data();
        const author = data.author;

        if (author && typeof author === 'object' && author !== null) {
          const fixedName = author.name || author.displayName || 'Staff Writer';
          batch.update(doc.ref, { author: fixedName });
          fixed++;
          details.push(`${doc.id}: ${JSON.stringify(author)} -> "${fixedName}"`);
        }
      });

      if (fixed > 0) {
        await batch.commit();
      }

      results.push({ tenantId: tid, fixed, total: articlesSnap.size, details });
    }

    const totalFixed = results.reduce((sum, r) => sum + r.fixed, 0);

    return NextResponse.json({
      success: true,
      totalFixed,
      results,
      message: totalFixed > 0
        ? `Fixed ${totalFixed} articles with object author fields`
        : 'No articles found with object author fields',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
