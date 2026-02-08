import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { vercelService } from '@/lib/vercel';

interface RolloutResult {
  tenantId: string;
  slug: string;
  success: boolean;
  deploymentId?: string;
  error?: string;
}

/**
 * POST /api/tenants/rollout
 * Redeploy ALL active tenants with the latest template code.
 *
 * This is the "fix applies to everybody" endpoint.
 * When the wnct-template repo gets a fix, call this to roll it out
 * to every active newspaper site.
 *
 * Requires: PLATFORM_SECRET header
 * Optional body: { version?: string, dryRun?: boolean }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check
    const platformSecret = request.headers.get('X-Platform-Secret');
    if (platformSecret !== process.env.PLATFORM_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!vercelService.isConfigured()) {
      return NextResponse.json(
        { error: 'Vercel API not configured' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const version = body.version || 'unknown';
    const dryRun = body.dryRun === true;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get all active tenants
    const tenantsSnapshot = await db.collection('tenants')
      .where('status', '==', 'active')
      .get();

    if (tenantsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No active tenants to redeploy',
        results: [],
      });
    }

    const tenants = tenantsSnapshot.docs.map(doc => ({
      id: doc.id,
      slug: doc.data().slug as string,
      businessName: doc.data().businessName as string,
      vercelProjectId: doc.data().vercelProjectId as string | undefined,
    }));

    console.log(`[Rollout] Starting rollout of v${version} to ${tenants.length} tenants (dryRun: ${dryRun})`);

    // Create rollout record in Firestore
    const rolloutRef = db.collection('rollouts').doc();
    await rolloutRef.set({
      id: rolloutRef.id,
      version,
      dryRun,
      totalTenants: tenants.length,
      status: 'in_progress',
      startedAt: new Date(),
      triggeredBy: 'api',
    });

    // Deploy tenants sequentially to avoid Vercel API rate limits
    const results: RolloutResult[] = [];

    for (const tenant of tenants) {
      if (!tenant.slug) {
        results.push({
          tenantId: tenant.id,
          slug: '(missing)',
          success: false,
          error: 'Tenant has no slug',
        });
        continue;
      }

      if (dryRun) {
        console.log(`[Rollout] DRY RUN: Would redeploy ${tenant.slug}`);
        results.push({
          tenantId: tenant.id,
          slug: tenant.slug,
          success: true,
          deploymentId: 'dry-run',
        });
        continue;
      }

      console.log(`[Rollout] Redeploying ${tenant.slug}...`);
      const result = await vercelService.redeployTenant(tenant.slug);

      results.push({
        tenantId: tenant.id,
        slug: tenant.slug,
        success: result.success,
        deploymentId: result.deploymentId,
        error: result.error,
      });

      // Update tenant record with latest deployment info
      if (result.success && result.deploymentId) {
        await db.collection('tenants').doc(tenant.id).update({
          lastRolloutVersion: version,
          lastRolloutDeploymentId: result.deploymentId,
          lastRolloutAt: new Date(),
        });
      }

      // Small delay between deployments to be kind to Vercel API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const durationMs = Date.now() - startTime;

    // Update rollout record
    await rolloutRef.update({
      status: failed === 0 ? 'completed' : 'completed_with_errors',
      succeeded,
      failed,
      durationMs,
      completedAt: new Date(),
      results,
    });

    const summary = `Rollout v${version}: ${succeeded}/${tenants.length} succeeded, ${failed} failed (${Math.round(durationMs / 1000)}s)`;
    console.log(`[Rollout] ${summary}`);

    return NextResponse.json({
      success: failed === 0,
      summary,
      rolloutId: rolloutRef.id,
      version,
      dryRun,
      totalTenants: tenants.length,
      succeeded,
      failed,
      durationMs,
      results,
    });

  } catch (error: unknown) {
    console.error('[Rollout] Error:', error);
    return NextResponse.json(
      { error: `Rollout failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenants/rollout?id=xxx
 * Get status of a rollout, or list recent rollouts
 */
export async function GET(request: NextRequest) {
  try {
    const platformSecret = request.headers.get('X-Platform-Secret');
    if (platformSecret !== process.env.PLATFORM_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const rolloutId = request.nextUrl.searchParams.get('id');

    if (rolloutId) {
      // Get specific rollout
      const doc = await db.collection('rollouts').doc(rolloutId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Rollout not found' }, { status: 404 });
      }
      return NextResponse.json(doc.data());
    }

    // List recent rollouts
    const snapshot = await db.collection('rollouts')
      .orderBy('startedAt', 'desc')
      .limit(10)
      .get();

    const rollouts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        version: data.version,
        status: data.status,
        totalTenants: data.totalTenants,
        succeeded: data.succeeded,
        failed: data.failed,
        durationMs: data.durationMs,
        startedAt: data.startedAt,
        dryRun: data.dryRun,
      };
    });

    return NextResponse.json({ rollouts });

  } catch (error: unknown) {
    console.error('[Rollout] Error:', error);
    return NextResponse.json(
      { error: `Failed to get rollout data: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
