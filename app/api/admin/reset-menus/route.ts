import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

export const dynamic = 'force-dynamic';

/**
 * Reset menus for a tenant by deleting all existing menus
 * The next GET request will auto-recreate them with defaults
 */
export async function POST(request: NextRequest) {
  try {
    // Check platform secret
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Delete all menus for this tenant
    const menusRef = db.collection('tenants').doc(tenantId).collection('menus');
    const snapshot = await menusRef.get();

    console.log(`[Reset Menus] Deleting ${snapshot.size} menus for tenant ${tenantId}`);

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`[Reset Menus] Successfully deleted ${snapshot.size} menus`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${snapshot.size} menus. They will be recreated on next access.`,
      deletedCount: snapshot.size,
    });
  } catch (error) {
    console.error('[Reset Menus] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset menus',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
