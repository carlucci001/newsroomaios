import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * GET /api/support/status
 * Returns whether platform support is currently online.
 * Accessible by any authenticated tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const apiKey = request.headers.get('x-api-key');
    const platformSecret = request.headers.get('x-platform-secret');

    // Allow either tenant auth or platform auth
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500, headers: CORS_HEADERS });
    }

    let authenticated = false;

    if (platformSecret && verifyPlatformSecret(request)) {
      authenticated = true;
    } else if (tenantId && apiKey) {
      const tenantDoc = await db.collection('tenants').doc(tenantId).get();
      if (tenantDoc.exists && tenantDoc.data()?.apiKey === apiKey) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const statusDoc = await db.collection('platformConfig').doc('supportStatus').get();
    const data = statusDoc.exists ? statusDoc.data()! : {};

    return NextResponse.json({
      success: true,
      online: data.online || false,
      adminName: data.adminName || 'Platform Support',
      lastSeen: data.lastSeen || null,
    }, { headers: CORS_HEADERS });

  } catch (error: unknown) {
    console.error('[Support Status] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/support/status
 * Set support online/offline status. Platform admin only.
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { online, adminName } = body;

    await db.collection('platformConfig').doc('supportStatus').set({
      online: !!online,
      adminName: adminName || 'Platform Support',
      lastSeen: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true, online: !!online }, { headers: CORS_HEADERS });

  } catch (error: unknown) {
    console.error('[Support Status] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
