import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { vercelService } from '@/lib/vercel';

/**
 * POST /api/tenants/deploy
 * Deploys a full WNC Times clone for a tenant
 *
 * Requires: PLATFORM_SECRET header or internal call
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized request
    const platformSecret = request.headers.get('X-Platform-Secret');
    const isInternal = request.headers.get('X-Internal-Call') === 'true';

    if (platformSecret !== process.env.PLATFORM_SECRET && !isInternal) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Check if Vercel API is configured
    if (!vercelService.isConfigured()) {
      console.error('[Deploy] Vercel API not configured - missing VERCEL_API_TOKEN');
      return NextResponse.json(
        { error: 'Deployment service not configured. Please add VERCEL_API_TOKEN to environment.' },
        { status: 503 }
      );
    }

    // Get tenant data from Firestore
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
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant data' },
        { status: 500 }
      );
    }

    // Update tenant status to deploying
    await db.collection('tenants').doc(tenantId).update({
      status: 'deploying',
      deploymentStartedAt: new Date(),
    });

    // Update setup progress - only mark deployment as in progress, don't overwrite seeding progress
    const progressRef = db.collection('tenants').doc(tenantId).collection('meta').doc('setupStatus');
    await progressRef.set({
      siteDeploying: true,
      lastUpdatedAt: new Date(),
    }, { merge: true });

    // Deploy to Vercel
    console.log(`[Deploy] Starting Vercel deployment for tenant: ${tenant.slug}`);

    const result = await vercelService.deployTenant({
      tenantId,
      slug: tenant.slug,
      businessName: tenant.businessName,
      serviceArea: tenant.serviceArea,
      ownerEmail: tenant.ownerEmail,
      categories: tenant.categories,
      apiKey: tenant.apiKey, // OPTION C: Pass tenant's API key for calling platform
    });

    if (!result.success) {
      // Update status to failed
      await db.collection('tenants').doc(tenantId).update({
        status: 'deployment_failed',
        deploymentError: result.error,
      });

      await progressRef.set({
        siteDeploying: false,
        deploymentError: result.error,
        lastUpdatedAt: new Date(),
      }, { merge: true });

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Update tenant with deployment info
    const siteUrl = result.subdomain
      ? `https://${result.subdomain}`
      : `https://${result.deploymentUrl}`;

    await db.collection('tenants').doc(tenantId).update({
      status: 'active',
      vercelProjectId: result.projectId,
      vercelDeploymentId: result.deploymentId,
      siteUrl,
      subdomain: result.subdomain,
      deployedAt: new Date(),
    });

    // Store siteUrl on setup progress - don't set 'complete' here, let seeding handle that
    await progressRef.set({
      siteUrl,
      siteDeployed: true,
      siteDeploying: false,
      lastUpdatedAt: new Date(),
    }, { merge: true });

    console.log(`[Deploy] Successfully deployed tenant ${tenant.slug} to ${siteUrl}`);

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      deploymentId: result.deploymentId,
      siteUrl,
      subdomain: result.subdomain,
    });

  } catch (error: unknown) {
    console.error('[Deploy] Error:', error);
    return NextResponse.json(
      { error: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenants/deploy?tenantId=xxx
 * Check deployment status for a tenant
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

    // If there's a deployment in progress, check Vercel for status
    if (tenant?.vercelDeploymentId && tenant?.status === 'deploying') {
      const deployment = await vercelService.getDeploymentStatus(tenant.vercelDeploymentId);

      if (deployment) {
        return NextResponse.json({
          status: tenant.status,
          deploymentState: deployment.readyState,
          siteUrl: tenant.siteUrl,
          subdomain: tenant.subdomain,
        });
      }
    }

    return NextResponse.json({
      status: tenant?.status || 'unknown',
      siteUrl: tenant?.siteUrl,
      subdomain: tenant?.subdomain,
      vercelProjectId: tenant?.vercelProjectId,
    });

  } catch (error: unknown) {
    console.error('[Deploy Status] Error:', error);
    return NextResponse.json(
      { error: `Failed to get status: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
