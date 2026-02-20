import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * PUT - Tenant syncs config fields back to platform tenant doc.
 * Currently supports: serviceArea (coverage area sync).
 * Auth: X-Tenant-ID + X-API-Key headers.
 */
export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503, headers: CORS_HEADERS });
    }

    const tenantId = request.headers.get('x-tenant-id');
    const apiKey = request.headers.get('x-api-key');

    if (!tenantId || !apiKey) {
      return NextResponse.json({ error: 'Missing X-Tenant-ID or X-API-Key' }, { status: 401, headers: CORS_HEADERS });
    }

    // Validate tenant
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: CORS_HEADERS });
    }
    const tenantData = tenantDoc.data()!;
    if (tenantData.apiKey !== apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { serviceArea } = body;

    if (!serviceArea) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400, headers: CORS_HEADERS });
    }

    // Build update — only allow specific fields
    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (serviceArea) {
      update.serviceArea = {
        city: serviceArea.city || '',
        state: serviceArea.state || '',
        region: serviceArea.region || '',
        county: serviceArea.county || '',
      };
    }

    await db.collection('tenants').doc(tenantId).update(update);
    console.log(`[update-config] Synced serviceArea for ${tenantId}:`, JSON.stringify(update.serviceArea));

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[update-config] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update config', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
