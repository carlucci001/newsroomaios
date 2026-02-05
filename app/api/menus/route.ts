import { NextRequest, NextResponse } from 'next/server';
import { authenticateTenant } from '@/lib/tenantAuth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// Default menus that every tenant gets
const DEFAULT_MENUS = [
  {
    id: 'main-nav',
    name: 'Main Navigation',
    slug: 'main-nav',
    description: 'Primary navigation menu in the header',
    enabled: true,
    items: [
      { label: 'Home', url: '/', type: 'internal' as const, enabled: true },
      { label: 'About', url: '/about', type: 'internal' as const, enabled: true },
      { label: 'Contact', url: '/contact', type: 'internal' as const, enabled: true },
    ],
  },
  {
    id: 'top-nav',
    name: 'Top Bar',
    slug: 'top-nav',
    description: 'Quick links in the top bar',
    enabled: true,
    items: [
      { label: 'Advertise', url: '/advertise', type: 'internal' as const, enabled: true },
    ],
  },
  {
    id: 'footer-quick-links',
    name: 'Footer - Quick Links',
    slug: 'footer-quick-links',
    description: 'Quick links in footer',
    enabled: true,
    items: [
      { label: 'About Us', url: '/about', type: 'internal' as const, enabled: true },
      { label: 'Contact', url: '/contact', type: 'internal' as const, enabled: true },
      { label: 'Advertise', url: '/advertise', type: 'internal' as const, enabled: true },
    ],
  },
  {
    id: 'footer-categories',
    name: 'Footer - Categories',
    slug: 'footer-categories',
    description: 'Category links in footer',
    enabled: true,
    items: [],
  },
];

/**
 * GET - Fetch all menus for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate tenant
    const authResult = await authenticateTenant(request);
    if (!authResult.authenticated || !authResult.tenant) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const tenantId = authResult.tenant.id;
    const db = getFirestore(getAdminApp());
    const menusRef = db.collection('tenants').doc(tenantId).collection('menus');
    const snapshot = await menusRef.orderBy('slug').get();

    // If no menus exist, initialize with defaults
    if (snapshot.empty) {
      console.log(`[Menus API] Initializing default menus for tenant ${tenantId}`);
      const batch = db.batch();
      for (const menu of DEFAULT_MENUS) {
        const menuRef = menusRef.doc(menu.id);
        batch.set(menuRef, {
          ...menu,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();

      return NextResponse.json({
        success: true,
        menus: DEFAULT_MENUS,
        initialized: true,
      });
    }

    const menus = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      menus,
    });
  } catch (error) {
    console.error('[Menus API] Error fetching menus:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch menus',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new menu
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateTenant(request);
    if (!authResult.authenticated || !authResult.tenant) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'name and slug are required' },
        { status: 400 }
      );
    }

    const tenantId = authResult.tenant.id;
    const db = getFirestore(getAdminApp());
    const menusRef = db.collection('tenants').doc(tenantId).collection('menus');

    // Check if slug already exists
    const existing = await menusRef.where('slug', '==', slug).get();
    if (!existing.empty) {
      return NextResponse.json(
        { success: false, error: 'A menu with this slug already exists' },
        { status: 409 }
      );
    }

    const newMenu = {
      id: slug,
      name,
      slug,
      description: description || '',
      items: [],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await menusRef.doc(slug).set(newMenu);

    return NextResponse.json({
      success: true,
      menu: newMenu,
    });
  } catch (error) {
    console.error('[Menus API] Error creating menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create menu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a menu
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateTenant(request);
    if (!authResult.authenticated || !authResult.tenant) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { menuId, updates } = body;

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'menuId is required' },
        { status: 400 }
      );
    }

    const tenantId = authResult.tenant.id;
    const db = getFirestore(getAdminApp());
    const menuRef = db.collection('tenants').doc(tenantId).collection('menus').doc(menuId);
    const menuDoc = await menuRef.get();

    if (!menuDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await menuRef.update(updateData);

    const updatedDoc = await menuRef.get();
    const updatedMenu = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({
      success: true,
      menu: updatedMenu,
    });
  } catch (error) {
    console.error('[Menus API] Error updating menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update menu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a menu
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateTenant(request);
    if (!authResult.authenticated || !authResult.tenant) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'menuId is required' },
        { status: 400 }
      );
    }

    // Prevent deletion of core menus
    const CORE_MENUS = ['top-nav', 'main-nav', 'footer-quick-links', 'footer-categories'];
    if (CORE_MENUS.includes(menuId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete core system menus' },
        { status: 403 }
      );
    }

    const tenantId = authResult.tenant.id;
    const db = getFirestore(getAdminApp());
    await db.collection('tenants').doc(tenantId).collection('menus').doc(menuId).delete();

    return NextResponse.json({
      success: true,
      deleted: menuId,
    });
  } catch (error) {
    console.error('[Menus API] Error deleting menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete menu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
