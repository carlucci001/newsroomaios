import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * Admin endpoint to cleanup test tenants
 * DELETE /api/admin/cleanup-test?domain=example.com
 *
 * Requires X-Platform-Secret header for authorization
 */
export async function DELETE(request: NextRequest) {
  // Verify admin access
  const platformSecret = request.headers.get('X-Platform-Secret');
  if (platformSecret !== process.env.PLATFORM_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const domain = request.nextUrl.searchParams.get('domain');
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    // Find tenant by domain
    const tenantsSnapshot = await db.collection('tenants')
      .where('domain', '==', domain)
      .get();

    if (tenantsSnapshot.empty) {
      return NextResponse.json({ error: 'No tenant found with that domain' }, { status: 404 });
    }

    const deletedTenants: string[] = [];

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();

      // Delete subcollections
      const subcollections = ['articles', 'categories', 'users', 'meta'];
      for (const subcol of subcollections) {
        const subcolSnapshot = await db.collection(`tenants/${tenantId}/${subcol}`).get();
        const batch = db.batch();
        subcolSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        if (!subcolSnapshot.empty) {
          await batch.commit();
        }
      }

      // Delete AI journalists for this tenant
      const journalistsSnapshot = await db.collection('aiJournalists')
        .where('tenantId', '==', tenantId)
        .get();
      if (!journalistsSnapshot.empty) {
        const jBatch = db.batch();
        journalistsSnapshot.docs.forEach(doc => jBatch.delete(doc.ref));
        await jBatch.commit();
      }

      // Delete user mapping if exists
      if (tenantData.ownerEmail) {
        const usersSnapshot = await db.collection('users')
          .where('tenantId', '==', tenantId)
          .get();
        if (!usersSnapshot.empty) {
          const uBatch = db.batch();
          usersSnapshot.docs.forEach(doc => uBatch.delete(doc.ref));
          await uBatch.commit();
        }
      }

      // Delete the tenant document
      await db.collection('tenants').doc(tenantId).delete();
      deletedTenants.push(tenantId);
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedTenants.length} tenant(s)`,
      deletedTenants,
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
