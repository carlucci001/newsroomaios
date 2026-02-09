import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, doc, getDoc, addDoc } from 'firebase/firestore';
import { CREDIT_COSTS } from '@/types/credits';

// Platform secret - shared with all tenant sites
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

/**
 * POST /api/credits/deduct
 *
 * Logging-only endpoint. Tenant sites deduct credits locally via their own
 * deductCredits() function, then report usage here for platform-side auditing.
 * This endpoint logs to creditUsage but does NOT deduct from the tenant balance
 * (that already happened on the tenant side).
 *
 * Headers:
 *   X-Platform-Secret: shared platform secret
 *
 * Request body:
 * {
 *   tenantId: string,
 *   action: 'article_generation' | 'image_generation' | 'fact_check' | 'seo_optimization' | 'web_search',
 *   quantity?: number (default 1),
 *   description: string,
 *   articleId?: string,
 *   metadata?: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const platformSecret = request.headers.get('X-Platform-Secret');
    const body = await request.json();
    const { tenantId, action, quantity = 1, description, articleId, metadata } = body;

    // Verify platform secret
    if (platformSecret !== PLATFORM_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!tenantId || !action || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, action, description' },
        { status: 400 }
      );
    }

    // Validate action type
    if (!Object.keys(CREDIT_COSTS).includes(action)) {
      return NextResponse.json(
        { error: `Invalid action type: ${action}` },
        { status: 400 }
      );
    }

    const db = getDb();
    const creditsReported = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] * quantity;

    // Log the usage for platform-side auditing
    await addDoc(collection(db, 'creditUsage'), {
      tenantId,
      action,
      creditsUsed: creditsReported,
      description,
      timestamp: new Date(),
      ...(articleId && { articleId }),
      ...(metadata && { metadata }),
    });

    // Read current balance from tenants/{tenantId} (source of truth)
    const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
    let creditsRemaining = -1;
    let status = 'untracked';

    if (tenantSnap.exists()) {
      const data = tenantSnap.data();
      const subscriptionCredits = data.subscriptionCredits || 0;
      const topOffCredits = data.topOffCredits || 0;
      creditsRemaining = subscriptionCredits + topOffCredits;
      status = creditsRemaining > 0 ? 'active' : 'exhausted';
    }

    return NextResponse.json({
      success: true,
      creditsDeducted: creditsReported,
      creditsRemaining,
      status,
      isOverage: creditsRemaining <= 0 && creditsRemaining !== -1,
    });
  } catch (error: unknown) {
    console.error('[Credits Deduct] Error:', error);
    return NextResponse.json(
      { error: 'Failed to log credit usage', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
