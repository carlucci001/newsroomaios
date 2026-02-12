import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

/**
 * GET /api/admin/debug-articles?tenantId=xxx
 *
 * Debug endpoint to check article structure
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // Get first 5 articles to inspect structure
    const articlesSnap = await adminDb
      .collection(`tenants/${tenantId}/articles`)
      .limit(5)
      .get();

    const articles = articlesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      count: articlesSnap.size,
      collectionPath: `tenants/${tenantId}/articles`,
      articles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
