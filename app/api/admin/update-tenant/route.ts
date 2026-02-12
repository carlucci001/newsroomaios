import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

/**
 * POST /api/admin/update-tenant
 *
 * Update tenant fields (admin only)
 * Requires X-Platform-Secret header
 *
 * Body: {
 *   tenantId: string,
 *   updates: { status?: string, ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify platform secret
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, updates } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'updates object is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // Get current tenant
    const tenantRef = adminDb.collection('tenants').doc(tenantId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const currentData = tenantDoc.data();

    // Update tenant
    await tenantRef.update({
      ...updates,
      lastUpdatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      tenantId,
      previousValues: {
        status: currentData?.status,
      },
      newValues: updates,
    });
  } catch (error: any) {
    console.error('[Admin Update Tenant] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/update-tenant?tenantId=xxx
 *
 * Get tenant details (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify platform secret
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId query param is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const tenantRef = adminDb.collection('tenants').doc(tenantId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get articles count
    const articlesSnap = await adminDb.collection(`tenants/${tenantId}/articles`).count().get();

    // Get AI journalists count
    const journalistsSnap = await adminDb.collection('aiJournalists').where('tenantId', '==', tenantId).count().get();

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenantDoc.id,
        ...tenantDoc.data(),
      },
      articleCount: articlesSnap.data().count,
      journalistCount: journalistsSnap.data().count,
    });
  } catch (error: any) {
    console.error('[Admin Get Tenant] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
