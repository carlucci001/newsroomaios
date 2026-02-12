import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

/**
 * POST /api/admin/seed-site-config
 * Seeds siteConfig and navigation for a tenant based on their selected categories
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

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // Get tenant data
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data();
    if (!tenant) {
      return NextResponse.json({ error: 'Invalid tenant data' }, { status: 500 });
    }

    const categories = tenant.categories || [];
    const businessName = tenant.businessName || 'Local News';
    const serviceArea = tenant.serviceArea || { city: 'Local', state: '' };

    // Build navigation items from tenant's selected categories
    const navigationItems = categories.map((cat: any, index: number) => ({
      id: cat.id || cat.slug,
      label: cat.name,
      href: `/category/${cat.slug || cat.id}`,
      order: index,
      isActive: cat.enabled !== false,
    }));

    // Seed siteConfig/general
    await db.collection(`tenants/${tenantId}/siteConfig`).doc('general').set({
      siteName: businessName,
      tagline: `Your source for ${serviceArea.city} news`,
      logo: null, // Will be set via admin panel
      favicon: null,
      serviceArea,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed siteConfig/navigation
    await db.collection(`tenants/${tenantId}/siteConfig`).doc('navigation').set({
      mainNav: navigationItems,
      footerNav: [
        { id: 'about', label: 'About Us', href: '/about', order: 0 },
        { id: 'advertise', label: 'Advertise', href: '/advertise', order: 1 },
        { id: 'contact', label: 'Contact', href: '/contact', order: 2 },
        { id: 'privacy', label: 'Privacy Policy', href: '/privacy', order: 3 },
      ],
      updatedAt: new Date(),
    });

    // Seed siteConfig/categories (detailed category config)
    await db.collection(`tenants/${tenantId}/siteConfig`).doc('categories').set({
      categories: categories.map((cat: any, index: number) => ({
        id: cat.id || cat.slug,
        name: cat.name,
        slug: cat.slug || cat.id,
        color: cat.color || '#1d4ed8',
        description: cat.directive || '',
        isActive: cat.enabled !== false,
        sortOrder: index,
      })),
      updatedAt: new Date(),
    });

    // Seed settings/site (root level for template compatibility)
    await db.collection(`tenants/${tenantId}/settings`).doc('site').set({
      name: businessName,
      tagline: `Your source for ${serviceArea.city} news`,
      serviceArea,
      categories: navigationItems,
      updatedAt: new Date(),
    });

    // Also seed root-level siteConfig for direct reads by the template
    // This is a workaround until the template is fully multi-tenant aware
    await db.collection('siteConfig').doc(`tenant_${tenantId}`).set({
      tenantId,
      siteName: businessName,
      navigation: navigationItems,
      categories: categories.map((cat: any) => ({
        id: cat.id || cat.slug,
        name: cat.name,
        slug: cat.slug || cat.id,
      })),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Site config seeded successfully',
      navigation: navigationItems,
      categoriesCount: categories.length,
    });

  } catch (error: any) {
    console.error('[Seed Site Config] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/seed-site-config?tenantId=xxx
 * Check current siteConfig for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // Get tenant's siteConfig
    const generalDoc = await db.collection(`tenants/${tenantId}/siteConfig`).doc('general').get();
    const navDoc = await db.collection(`tenants/${tenantId}/siteConfig`).doc('navigation').get();
    const catDoc = await db.collection(`tenants/${tenantId}/siteConfig`).doc('categories').get();

    return NextResponse.json({
      success: true,
      siteConfig: {
        general: generalDoc.exists ? generalDoc.data() : null,
        navigation: navDoc.exists ? navDoc.data() : null,
        categories: catDoc.exists ? catDoc.data() : null,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
