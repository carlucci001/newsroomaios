import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CREDIT_COSTS } from '@/types/credits';
import { verifyPlatformSecret } from '@/lib/platformAuth';

/**
 * POST /api/credits/check
 *
 * Called by tenant sites before performing AI operations.
 * Checks if the tenant has sufficient credits for the requested action.
 * Reads from tenants/{tenantId} document (single source of truth).
 *
 * Headers:
 *   X-Platform-Secret: shared platform secret
 *
 * Request body:
 * {
 *   tenantId: string,
 *   action: 'article_generation' | 'image_generation' | 'fact_check' | 'seo_optimization' | 'web_search',
 *   quantity?: number (default 1)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, action, quantity = 1 } = body;

    // Verify platform secret
    if (!verifyPlatformSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!tenantId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, action' },
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
    const creditsRequired = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] * quantity;

    // Read from tenants/{tenantId} — the single source of truth
    const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));

    if (!tenantSnap.exists()) {
      console.warn(`[Credits] Tenant ${tenantId} not found, allowing operation`);
      return NextResponse.json({
        allowed: true,
        creditsRequired,
        creditsRemaining: -1,
        message: 'Tenant not found - operating in unlimited mode',
      });
    }

    const data = tenantSnap.data();
    const subscriptionCredits = data.subscriptionCredits || 0;
    const topOffCredits = data.topOffCredits || 0;
    const totalCredits = subscriptionCredits + topOffCredits;
    const licensingStatus = data.licensingStatus;

    // Check if tenant is suspended
    if (licensingStatus === 'suspended') {
      return NextResponse.json({
        allowed: false,
        creditsRequired,
        creditsRemaining: totalCredits,
        message: 'Account is suspended. Please contact support.',
      });
    }

    // Check if tenant has enough credits
    if (totalCredits < creditsRequired) {
      return NextResponse.json({
        allowed: false,
        creditsRequired,
        creditsRemaining: totalCredits,
        message: 'Insufficient credits. Please purchase a top-off or upgrade your plan.',
      });
    }

    return NextResponse.json({
      allowed: true,
      creditsRequired,
      creditsRemaining: totalCredits,
    });
  } catch (error: unknown) {
    console.error('[Credits Check] Error:', error);
    // On error, allow operation to not block the tenant
    return NextResponse.json({
      allowed: true,
      creditsRequired: 0,
      creditsRemaining: -1,
      message: 'Credit check failed, allowing operation',
    });
  }
}
