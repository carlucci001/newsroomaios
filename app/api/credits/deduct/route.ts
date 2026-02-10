import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, doc, addDoc, runTransaction } from 'firebase/firestore';
import { CREDIT_COSTS } from '@/types/credits';

// Platform secret - shared with all tenant sites
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * POST /api/credits/deduct
 *
 * Deducts credits from the tenant's balance on the platform (source of truth).
 * Uses an atomic Firestore transaction to prevent race conditions.
 * Deduction priority: subscription credits first, then top-off credits.
 * Also logs usage for auditing.
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
        { status: 401, headers: CORS_HEADERS }
      );
    }

    if (!tenantId || !action || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, action, description' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate action type
    if (!Object.keys(CREDIT_COSTS).includes(action)) {
      return NextResponse.json(
        { error: `Invalid action type: ${action}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const db = getDb();
    const creditCost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] * quantity;
    const tenantRef = doc(db, 'tenants', tenantId);

    // Atomic transaction: deduct credits from tenant balance
    let subscriptionAfter = 0;
    let topOffAfter = 0;
    let deductedFromSubscription = 0;
    let deductedFromTopOff = 0;
    let isOverage = false;

    await runTransaction(db, async (transaction) => {
      const tenantSnap = await transaction.get(tenantRef);

      if (!tenantSnap.exists()) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const data = tenantSnap.data();
      let subscriptionCredits = data.subscriptionCredits || 0;
      let topOffCredits = data.topOffCredits || 0;
      const totalAvailable = subscriptionCredits + topOffCredits;

      if (totalAvailable < creditCost) {
        isOverage = true;
        console.warn(`[Credits] Tenant ${tenantId} in overage: needs ${creditCost}, has ${totalAvailable}`);
      }

      // Deduct from subscription first, then top-off
      if (subscriptionCredits >= creditCost) {
        deductedFromSubscription = creditCost;
        subscriptionCredits -= creditCost;
      } else {
        deductedFromSubscription = subscriptionCredits;
        const remaining = creditCost - subscriptionCredits;
        subscriptionCredits = 0;
        deductedFromTopOff = Math.min(remaining, topOffCredits);
        topOffCredits = Math.max(0, topOffCredits - remaining);
      }

      subscriptionAfter = subscriptionCredits;
      topOffAfter = topOffCredits;

      // Update tenant balance
      transaction.update(tenantRef, {
        subscriptionCredits,
        topOffCredits,
        updatedAt: new Date(),
      });
    });

    const creditsRemaining = subscriptionAfter + topOffAfter;

    // Log usage for auditing (outside transaction)
    await addDoc(collection(db, 'creditUsage'), {
      tenantId,
      action,
      creditsUsed: creditCost,
      description,
      timestamp: new Date(),
      subscriptionAfter,
      topOffAfter,
      deductedFromSubscription,
      deductedFromTopOff,
      ...(articleId && { articleId }),
      ...(metadata && { metadata }),
    });

    console.log(`[Credits] ${tenantId}: -${creditCost} for ${action}. Remaining: ${creditsRemaining} (sub: ${subscriptionAfter}, topoff: ${topOffAfter})`);

    return NextResponse.json({
      success: true,
      creditsDeducted: creditCost,
      creditsRemaining,
      subscriptionCredits: subscriptionAfter,
      topOffCredits: topOffAfter,
      status: creditsRemaining > 0 ? 'active' : 'exhausted',
      isOverage,
    }, { headers: CORS_HEADERS });
  } catch (error: unknown) {
    console.error('[Credits Deduct] Error:', error);
    return NextResponse.json(
      { error: 'Failed to deduct credits', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
