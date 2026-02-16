import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

const BETA_TENANTS = [
  'wnct-times',
  'hendo',
  'oceanside-news',
  'hardhatsports',
  'atlanta-news-network',
  'the42',
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * Authenticate request — supports platform secret OR tenant API key
 */
async function authenticateRequest(request: NextRequest): Promise<{
  valid: boolean;
  isPlatformAdmin: boolean;
  tenantId?: string;
  tenantSlug?: string;
  error?: string;
}> {
  const db = getAdminDb();
  if (!db) return { valid: false, isPlatformAdmin: false, error: 'Database not configured' };

  const platformSecret = request.headers.get('x-platform-secret');
  const tenantId = request.headers.get('x-tenant-id');
  const apiKey = request.headers.get('x-api-key');

  // Platform admin auth
  if (platformSecret) {
    if (!verifyPlatformSecret(request)) {
      return { valid: false, isPlatformAdmin: false, error: 'Invalid platform secret' };
    }
    return { valid: true, isPlatformAdmin: true };
  }

  // Tenant API key auth
  if (tenantId && apiKey) {
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return { valid: false, isPlatformAdmin: false, error: 'Tenant not found' };
    }
    const tenantData = tenantDoc.data()!;
    if (tenantData.apiKey !== apiKey) {
      return { valid: false, isPlatformAdmin: false, error: 'Invalid API key' };
    }
    return {
      valid: true,
      isPlatformAdmin: false,
      tenantId,
      tenantSlug: tenantData.slug || tenantId,
    };
  }

  return { valid: false, isPlatformAdmin: false, error: 'Authentication required' };
}

/**
 * GET /api/tenants/releases
 * Returns published platform releases and roadmap items.
 * Query params: type (release|roadmap), limit (default 30)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const limitParam = parseInt(searchParams.get('limit') || '30', 10);

    // Query published releases ordered by publishedAt descending
    let q = db.collection('platformReleases')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(Math.min(limitParam, 50));

    const snapshot = await q.get();
    const isBetaTenant = auth.tenantSlug ? BETA_TENANTS.includes(auth.tenantSlug) : auth.isPlatformAdmin;

    const releases = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type as string,
          title: data.title as string,
          description: data.description as string,
          version: data.version as string | undefined,
          category: data.category as string,
          status: data.status as string,
          audience: data.audience as string,
          publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        };
      })
      .filter(r => {
        // Filter by type if specified
        if (typeFilter && r.type !== typeFilter) return false;
        // Beta-only items only visible to beta tenants or platform admin
        if (r.audience === 'beta' && !isBetaTenant) return false;
        return true;
      });

    return NextResponse.json(
      { success: true, releases },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[Releases API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch releases' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
