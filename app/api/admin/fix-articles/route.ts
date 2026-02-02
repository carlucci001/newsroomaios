import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

/**
 * POST /api/admin/fix-articles
 *
 * Fix article field names (categoryName -> category, etc.)
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

    // Get all articles
    const articlesSnap = await adminDb.collection(`tenants/${tenantId}/articles`).get();

    if (articlesSnap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No articles found',
        updated: 0,
      });
    }

    // Fix field names
    const batch = adminDb.batch();
    let updated = 0;

    articlesSnap.docs.forEach(doc => {
      const data = doc.data();
      const updates: Record<string, any> = {};

      // Map categoryName to category if category is missing
      if (!data.category && data.categoryName) {
        updates.category = data.categoryName;
      }

      // Map categorySlug to categorySlug if missing
      if (!data.categorySlug && data.categoryId) {
        updates.categorySlug = data.categoryId;
      }

      // Ensure status is 'published'
      if (data.status !== 'published') {
        updates.status = 'published';
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updated++;
      }
    });

    if (updated > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      updated,
      total: articlesSnap.size,
      message: `Fixed ${updated} articles`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
