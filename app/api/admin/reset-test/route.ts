import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

/**
 * DELETE /api/admin/reset-test?confirm=yes
 *
 * Clear all test data using Admin SDK
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'yes') {
      return NextResponse.json({
        error: 'Add ?confirm=yes to confirm deletion',
      });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const results = {
      tenantsDeleted: 0,
      articlesDeleted: 0,
      journalistsDeleted: 0,
      categoriesDeleted: 0,
      progressDeleted: 0,
    };

    // Get all tenants
    const tenantsSnap = await adminDb.collection('tenants').get();

    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;

      // Delete articles subcollection
      const articlesSnap = await adminDb.collection(`tenants/${tenantId}/articles`).get();
      for (const doc of articlesSnap.docs) {
        await doc.ref.delete();
        results.articlesDeleted++;
      }

      // Delete categories subcollection
      const catsSnap = await adminDb.collection(`tenants/${tenantId}/categories`).get();
      for (const doc of catsSnap.docs) {
        await doc.ref.delete();
        results.categoriesDeleted++;
      }

      // Delete meta subcollection
      const metaSnap = await adminDb.collection(`tenants/${tenantId}/meta`).get();
      for (const doc of metaSnap.docs) {
        await doc.ref.delete();
      }

      // Delete tenant
      await tenantDoc.ref.delete();
      results.tenantsDeleted++;
    }

    // Delete AI journalists
    const journalistsSnap = await adminDb.collection('aiJournalists').get();
    for (const doc of journalistsSnap.docs) {
      await doc.ref.delete();
      results.journalistsDeleted++;
    }

    // Delete onboarding progress
    const progressSnap = await adminDb.collection('onboardingProgress').get();
    for (const doc of progressSnap.docs) {
      await doc.ref.delete();
      results.progressDeleted++;
    }

    // Delete tenant credits
    const creditsSnap = await adminDb.collection('tenantCredits').get();
    for (const doc of creditsSnap.docs) {
      await doc.ref.delete();
    }

    return NextResponse.json({
      success: true,
      message: 'Test data cleared',
      results,
    });
  } catch (error: any) {
    console.error('[Reset Test] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
