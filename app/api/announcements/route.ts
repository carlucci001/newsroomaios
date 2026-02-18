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
 * GET /api/announcements
 * Returns active announcements. Accessible by authenticated tenants.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const apiKey = request.headers.get('x-api-key');
    const platformSecret = request.headers.get('x-platform-secret');

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

    const snapshot = await db.collection('announcements')
      .where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const announcements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, announcements }, { headers: CORS_HEADERS });

  } catch (error: unknown) {
    console.error('[Announcements] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcements' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/announcements
 * Create or update an announcement. Platform admin only.
 * Body: { title, message, priority?, id? (for updates), active? }
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
    const { id, title, message, priority, active } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' }, { status: 400, headers: CORS_HEADERS });
    }

    if (id) {
      // Update existing announcement
      await db.collection('announcements').doc(id).update({
        title,
        message,
        priority: priority || 'normal',
        active: active !== undefined ? active : true,
        updatedAt: new Date(),
      });
      return NextResponse.json({ success: true, id }, { headers: CORS_HEADERS });
    }

    // Create new announcement
    const docRef = await db.collection('announcements').add({
      title,
      message,
      priority: priority || 'normal',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id }, { headers: CORS_HEADERS });

  } catch (error: unknown) {
    console.error('[Announcements] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save announcement' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
