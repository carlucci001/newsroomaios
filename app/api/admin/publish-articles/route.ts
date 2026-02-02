import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

/**
 * POST /api/admin/publish-articles
 *
 * Publish all draft articles for a tenant
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('X-Platform-Secret');
    if (secret !== PLATFORM_SECRET) {
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

    // Get all draft articles
    const articlesSnap = await adminDb
      .collection(`tenants/${tenantId}/articles`)
      .where('status', '==', 'draft')
      .get();

    if (articlesSnap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No draft articles found',
        updated: 0,
      });
    }

    // Update all to published
    const batch = adminDb.batch();
    const now = new Date();

    articlesSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'published',
        publishedAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      updated: articlesSnap.size,
      message: `Published ${articlesSnap.size} articles`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
