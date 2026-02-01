import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, doc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { TenantCredits, CREDIT_COSTS } from '@/types/credits';

// Platform secret - shared with all tenant sites
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

/**
 * POST /api/credits/check
 *
 * Called by tenant sites before performing AI operations.
 * Checks if the tenant has sufficient credits for the requested action.
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
    const platformSecret = request.headers.get('X-Platform-Secret');
    const body = await request.json();
    const { tenantId, action, quantity = 1 } = body;

    // Verify platform secret
    if (platformSecret !== PLATFORM_SECRET) {
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

    // Get tenant's credit balance
    const creditsQuery = query(
      collection(db, 'tenantCredits'),
      where('tenantId', '==', tenantId)
    );
    const creditsSnap = await getDocs(creditsQuery);

    if (creditsSnap.empty) {
      // No credit allocation - allow operation but log warning
      console.warn(`[Credits] No allocation for tenant ${tenantId}, allowing operation`);
      return NextResponse.json({
        allowed: true,
        creditsRequired: CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] * quantity,
        creditsRemaining: -1, // Indicates unlimited/untracked
        message: 'No credit allocation - operating in unlimited mode',
      });
    }

    const creditDoc = creditsSnap.docs[0];
    const credits = { id: creditDoc.id, ...creditDoc.data() } as TenantCredits;

    // Calculate credits required
    const creditsRequired = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] * quantity;

    // Check if tenant is suspended
    if (credits.status === 'suspended') {
      return NextResponse.json({
        allowed: false,
        creditsRequired,
        creditsRemaining: credits.creditsRemaining,
        message: 'Account is suspended. Please contact support.',
      });
    }

    // Check if hard limit is set and would be exceeded
    if (credits.hardLimit > 0 && credits.creditsUsed + creditsRequired > credits.hardLimit) {
      await updateDoc(doc(db, 'tenantCredits', creditDoc.id), {
        status: 'exhausted',
      });

      return NextResponse.json({
        allowed: false,
        creditsRequired,
        creditsRemaining: credits.creditsRemaining,
        message: 'Credit limit reached. AI operations are temporarily disabled.',
      });
    }

    // Check if tenant has enough credits (soft enforcement - warn but allow)
    if (credits.creditsRemaining < creditsRequired) {
      // Update status but still allow operation (can go negative)
      if (credits.status !== 'exhausted') {
        await updateDoc(doc(db, 'tenantCredits', creditDoc.id), {
          status: 'exhausted',
        });
      }
    }

    // Check soft limit warning
    if (
      credits.softLimit > 0 &&
      !credits.softLimitWarned &&
      credits.creditsUsed + creditsRequired >= credits.softLimit
    ) {
      await updateDoc(doc(db, 'tenantCredits', creditDoc.id), {
        softLimitWarned: true,
        status: 'warning',
      });
    }

    return NextResponse.json({
      allowed: true,
      creditsRequired,
      creditsRemaining: credits.creditsRemaining,
    });
  } catch (error: any) {
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
