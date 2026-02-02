import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

const CATEGORY_COLORS: Record<string, string> = {
  'local-news': '#1d4ed8',
  'sports': '#dc2626',
  'business': '#059669',
  'politics': '#6366f1',
  'entertainment': '#7c3aed',
  'weather': '#0ea5e9',
  'lifestyle': '#db2777',
  'outdoors': '#16a34a',
  'community': '#f59e0b',
};

/**
 * POST /api/admin/create-categories
 *
 * Create categories subcollection from tenant doc array
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

    // Get tenant doc
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    const categories = tenant.categories || [];

    if (categories.length === 0) {
      return NextResponse.json({ error: 'No categories on tenant doc' }, { status: 400 });
    }

    // Create categories subcollection
    const batch = adminDb.batch();
    let created = 0;

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const catRef = adminDb.collection(`tenants/${tenantId}/categories`).doc(cat.id || cat.slug);

      batch.set(catRef, {
        name: cat.name,
        slug: cat.slug || cat.id,
        color: CATEGORY_COLORS[cat.slug] || CATEGORY_COLORS[cat.id] || '#1d4ed8',
        description: cat.directive || '',
        editorialDirective: cat.directive || '',
        isActive: cat.enabled !== false,
        sortOrder: i,
        articleCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      created++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      created,
      categories: categories.map((c: any) => c.name),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
