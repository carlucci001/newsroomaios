import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * GET /api/tenants/get-api-key?tenantId=xxx
 * Get tenant API key for configuration
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenant = tenantDoc.data();

    return NextResponse.json({
      tenantId: tenantDoc.id,
      businessName: tenant?.businessName,
      apiKey: tenant?.apiKey,
      slug: tenant?.slug,
    });

  } catch (error: unknown) {
    console.error('[Get API Key] Error:', error);
    return NextResponse.json(
      { error: `Failed to get API key: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
