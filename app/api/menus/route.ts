import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp, getAdminDb } from '@/lib/firebaseAdmin';
import { Tenant } from '@/types/tenant';

export const dynamic = 'force-dynamic';

// Platform secret for internal calls
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

/**
 * Get tenant from Firestore
 */
async function getTenant(tenantId: string): Promise<Tenant | null> {
  try {
    const db = getAdminDb();
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return null;
    }
    return { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
  } catch (error) {
    console.error('[Menus] Error fetching tenant:', error);
    return null;
  }
}

/**
 * Authenticate request (platform secret or tenant API key)
 */
async function authenticateRequest(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
  tenant?: Tenant;
}> {
  const platformSecret = request.headers.get('x-platform-secret');
  const tenantId = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenantId');
  const apiKey = request.headers.get('x-api-key');

  // Option 1: Platform secret (internal calls)
  if (platformSecret) {
    if (platformSecret !== PLATFORM_SECRET) {
      return { valid: false, error: 'Invalid platform secret' };
    }
    if (!tenantId) {
      return { valid: false, error: 'Tenant ID required' };
    }
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return { valid: false, error: 'Tenant not found' };
    }
    return { valid: true, tenant };
  }

  // Option 2: Tenant API key (external tenant calls)
  if (tenantId && apiKey) {
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return { valid: false, error: 'Tenant not found' };
    }
    if (tenant.apiKey !== apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }
    return { valid: true, tenant };
  }

  return { valid: false, error: 'Missing authentication credentials' };
}

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

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
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.valid || !authResult.tenant) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401, headers: CORS_HEADERS }
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

      return NextResponse.json(
        {
          success: true,
          menus: DEFAULT_MENUS,
          initialized: true,
        },
        { headers: CORS_HEADERS }
      );
    }

    const menus = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(
      {
        success: true,
        menus,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[Menus API] Error fetching menus:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch menus',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST - Create a new menu
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.valid || !authResult.tenant) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'name and slug are required' },
        { status: 400, headers: CORS_HEADERS }
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
        { status: 409, headers: CORS_HEADERS }
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

    return NextResponse.json(
      {
        success: true,
        menu: newMenu,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[Menus API] Error creating menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create menu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * PUT - Update a menu
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.valid || !authResult.tenant) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();
    const { menuId, updates } = body;

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'menuId is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const tenantId = authResult.tenant.id;
    const db = getFirestore(getAdminApp());
    const menuRef = db.collection('tenants').doc(tenantId).collection('menus').doc(menuId);
    const menuDoc = await menuRef.get();

    if (!menuDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await menuRef.update(updateData);

    const updatedDoc = await menuRef.get();
    const updatedMenu = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json(
      {
        success: true,
        menu: updatedMenu,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[Menus API] Error updating menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update menu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * DELETE - Delete a menu
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.valid || !authResult.tenant) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'menuId is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Prevent deletion of core menus
    const CORE_MENUS = ['top-nav', 'main-nav', 'footer-quick-links', 'footer-categories'];
    if (CORE_MENUS.includes(menuId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete core system menus' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const tenantId = authResult.tenant.id;
    const db = getFirestore(getAdminApp());
    await db.collection('tenants').doc(tenantId).collection('menus').doc(menuId).delete();

    return NextResponse.json(
      {
        success: true,
        deleted: menuId,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[Menus API] Error deleting menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete menu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
