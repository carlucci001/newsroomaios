import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { vercelService } from '@/lib/vercel';
import { verifyPlatformSecret } from '@/lib/platformAuth';

export async function POST(request: NextRequest) {
  if (!verifyPlatformSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { tenantId, action, rejectionReason } = await request.json();

    if (!tenantId || !action) {
      return NextResponse.json({ error: 'tenantId and action are required' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }

    const tenantRef = db.collection('tenants').doc(tenantId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    const domainRequest = tenant.domainRequest;

    if (!domainRequest || domainRequest.status !== 'pending') {
      return NextResponse.json({ error: 'No pending domain request' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const domain = domainRequest.domain;

      // Register domain with Vercel if project exists
      if (tenant.vercelProjectId && vercelService.isConfigured()) {
        const result = await vercelService.addDomain(tenant.vercelProjectId, domain);
        if (!result) {
          return NextResponse.json(
            { error: 'Failed to register domain with Vercel' },
            { status: 500 }
          );
        }
      }

      await tenantRef.update({
        'domainRequest.status': 'approved',
        'domainRequest.reviewedAt': now,
        customDomain: domain,
        siteUrl: `https://${domain}`,
      });

      return NextResponse.json({
        success: true,
        message: `Domain ${domain} approved and registered`,
        domain,
      });
    }

    // Reject
    await tenantRef.update({
      'domainRequest.status': 'rejected',
      'domainRequest.reviewedAt': now,
      'domainRequest.rejectionReason': rejectionReason || 'Request denied',
    });

    return NextResponse.json({
      success: true,
      message: `Domain request rejected`,
    });
  } catch (error) {
    console.error('[ApproveDomain] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
