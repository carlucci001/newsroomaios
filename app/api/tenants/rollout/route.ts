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

// Beta rollout group — edit this list to add/remove beta testers
const BETA_TENANTS = [
  'wnct-times',
  'hendo',
  'oceanside-news',
  'hardhatsports',
  'atlanta-news-network',
  'the42',
];

/**
 * POST /api/tenants/rollout
 * Redeploy active tenants with the latest template code.
 *
 * Supports scoped rollouts:
 *   scope: 'beta'  → deploy only to BETA_TENANTS (5 tenants)
 *   scope: 'all'   → deploy to ALL active tenants (default)
 *   tenantSlugs: ['slug1', 'slug2'] → deploy to specific tenants (ad-hoc override)
 *
 * ⚠️  WNC TIMES CAVEAT (tenant: wnct-times, project: newspaper-wnct-times)
 * WNC Times uses a DIFFERENT Firebase project (gen-lang-client-0242565142) and
 * a NAMED Firestore database (gwnct). It deploys the same wnct-template code as
 * every other tenant, but its Vercel env vars route it to gwnct instead of the
 * platform's default database. The rollout's env var backfill (ensureEnvVars) only
 * ADDS missing vars — it will NOT overwrite WNC Times' Firebase config. However,
 * if WNC Times' Firebase env vars are ever deleted, the backfill would inject the
 * WRONG values (platform's newsroomasios instead of gen-lang-client-0242565142).
 * See ARCHITECTURE.md "WNC Times — Special Architecture" for full details.
 *
 * Requires: PLATFORM_SECRET header
 * Optional body: { version?: string, commitHash?: string, dryRun?: boolean, scope?: 'beta'|'all', tenantSlugs?: string[] }
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
    const version = body.version || process.env.NEXT_PUBLIC_PLATFORM_VERSION || 'unknown';
    const commitHash = body.commitHash || '';
    const dryRun = body.dryRun === true;
    const scope = body.scope || 'all'; // 'beta' | 'all'
    const tenantSlugs = body.tenantSlugs as string[] | undefined;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get tenants based on scope
    let tenantsSnapshot;
    if (tenantSlugs && tenantSlugs.length > 0) {
      // Ad-hoc: deploy to specific tenants by slug
      tenantsSnapshot = await db.collection('tenants')
        .where('status', '==', 'active')
        .where('slug', 'in', tenantSlugs)
        .get();
    } else if (scope === 'beta') {
      // Beta group only
      tenantsSnapshot = await db.collection('tenants')
        .where('status', '==', 'active')
        .where('slug', 'in', BETA_TENANTS)
        .get();
    } else {
      // All active tenants
      tenantsSnapshot = await db.collection('tenants')
        .where('status', '==', 'active')
        .get();
    }

    if (tenantsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No active tenants to redeploy',
        results: [],
      });
    }

    const tenants = tenantsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug as string,
        businessName: data.businessName as string,
        vercelProjectId: data.vercelProjectId as string | undefined,
        apiKey: data.apiKey as string,
        serviceArea: data.serviceArea as { city: string; state: string } | undefined,
      };
    });

    const scopeLabel = tenantSlugs ? `custom(${tenantSlugs.join(',')})` : scope;
    console.log(`[Rollout] Starting ${scopeLabel} rollout of v${version} to ${tenants.length} tenants (dryRun: ${dryRun})`);

    // Create rollout record in Firestore
    const rolloutRef = db.collection('rollouts').doc();
    await rolloutRef.set({
      id: rolloutRef.id,
      version,
      commitHash,
      scope: scopeLabel,
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
      const result = await vercelService.redeployTenant(tenant.slug, {
        tenantId: tenant.id,
        apiKey: tenant.apiKey,
        businessName: tenant.businessName,
        serviceArea: tenant.serviceArea,
      }, version);

      const entry: RolloutResult = {
        tenantId: tenant.id,
        slug: tenant.slug,
        success: result.success,
      };
      if (result.deploymentId) entry.deploymentId = result.deploymentId;
      if (result.error) entry.error = result.error;
      results.push(entry);

      // Update tenant record with latest deployment info
      if (result.success && result.deploymentId) {
        const tenantUpdate: Record<string, any> = {
          lastRolloutVersion: version,
          lastRolloutDeploymentId: result.deploymentId,
          lastRolloutAt: new Date(),
        };
        if (commitHash) tenantUpdate.lastRolloutCommit = commitHash;
        await db.collection('tenants').doc(tenant.id).update(tenantUpdate);
      }

      // Small delay between deployments to be kind to Vercel API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const durationMs = Date.now() - startTime;

    // Post-rollout verification: check which tenants are still on an older commit
    let staleCount = 0;
    const staleTenants: string[] = [];
    if (commitHash && !dryRun) {
      const allActiveSnapshot = await db.collection('tenants')
        .where('status', '==', 'active')
        .get();
      for (const doc of allActiveSnapshot.docs) {
        const data = doc.data();
        if (data.lastRolloutCommit !== commitHash) {
          staleCount++;
          staleTenants.push(data.slug || doc.id);
        }
      }
    }

    const allCurrent = commitHash ? staleCount === 0 : null;

    // Update rollout record
    await rolloutRef.update({
      status: failed === 0 ? 'completed' : 'completed_with_errors',
      succeeded,
      failed,
      durationMs,
      completedAt: new Date(),
      results,
      staleCount,
      staleTenants,
      allTenantsCurrentAfterRollout: allCurrent,
    });

    const summary = `Rollout v${version} (${scopeLabel}): ${succeeded}/${tenants.length} succeeded, ${failed} failed (${Math.round(durationMs / 1000)}s)`;
    console.log(`[Rollout] ${summary}`);
    if (commitHash) {
      console.log(`[Rollout] Commit: ${commitHash.substring(0, 8)} | Stale tenants: ${staleCount}${staleTenants.length > 0 ? ` (${staleTenants.join(', ')})` : ''}`);
    }

    return NextResponse.json({
      success: failed === 0,
      summary,
      rolloutId: rolloutRef.id,
      version,
      commitHash: commitHash || undefined,
      scope: scopeLabel,
      dryRun,
      totalTenants: tenants.length,
      succeeded,
      failed,
      durationMs,
      results,
      staleCount,
      staleTenants,
      allTenantsCurrentAfterRollout: allCurrent,
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
        commitHash: data.commitHash || null,
        scope: data.scope || 'all',
        status: data.status,
        totalTenants: data.totalTenants,
        succeeded: data.succeeded,
        failed: data.failed,
        staleCount: data.staleCount ?? null,
        allTenantsCurrentAfterRollout: data.allTenantsCurrentAfterRollout ?? null,
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
