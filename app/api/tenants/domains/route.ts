import { NextRequest, NextResponse } from 'next/server';
import { vercelService } from '@/lib/vercel';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * GET /api/tenants/domains?tenantId=xxx
 * Fetches domains from Vercel for a tenant's project and identifies the custom domain.
 */
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  if (!vercelService.isConfigured()) {
    return NextResponse.json({ error: 'Vercel not configured' }, { status: 500 });
  }

  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    const vercelProjectId = tenant.vercelProjectId;
    if (!vercelProjectId) {
      return NextResponse.json({ error: 'Tenant has no Vercel project' }, { status: 404 });
    }

    const domains = await vercelService.getProjectDomains(vercelProjectId);

    // Find the custom domain (any domain that isn't the .newsroomaios.com subdomain)
    const customDomain = domains.find(
      (d: { name: string }) => !d.name.endsWith('.newsroomaios.com') && !d.name.endsWith('.vercel.app')
    );

    return NextResponse.json({
      domains: domains.map((d: { name: string }) => d.name),
      customDomain: customDomain?.name || null,
      subdomain: domains.find((d: { name: string }) => d.name.endsWith('.newsroomaios.com'))?.name || null,
    });
  } catch (error) {
    console.error('[Domains] Error fetching Vercel domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}
