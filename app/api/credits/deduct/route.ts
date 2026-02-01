import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, doc, getDocs, query, where, updateDoc, addDoc } from 'firebase/firestore';
import { TenantCredits, CreditUsage, CREDIT_COSTS } from '@/types/credits';

// Platform secret - shared with all tenant sites
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

/**
 * POST /api/credits/deduct
 *
 * Called by tenant sites after successfully completing an AI operation.
 * Deducts credits from the tenant's balance and logs the usage.
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
    const creditsToDeduct = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] * quantity;

    // Get tenant's credit balance
    const creditsQuery = query(
      collection(db, 'tenantCredits'),
      where('tenantId', '==', tenantId)
    );
    const creditsSnap = await getDocs(creditsQuery);

    if (creditsSnap.empty) {
      // No credit allocation - just log the usage without updating balance
      console.warn(`[Credits] No allocation for tenant ${tenantId}, logging usage only`);

      // Log usage even without credit allocation
      await addDoc(collection(db, 'creditUsage'), {
        tenantId,
        action,
        creditsUsed: creditsToDeduct,
        description,
        timestamp: new Date(),
        ...(articleId && { articleId }),
        ...(metadata && { metadata }),
      });

      return NextResponse.json({
        success: true,
        creditsDeducted: creditsToDeduct,
        creditsRemaining: -1,
        status: 'untracked',
        isOverage: false,
      });
    }

    const creditDoc = creditsSnap.docs[0];
    const credits = { id: creditDoc.id, ...creditDoc.data() } as TenantCredits;

    // Update credit balance
    const newCreditsUsed = credits.creditsUsed + creditsToDeduct;
    const newCreditsRemaining = credits.monthlyAllocation - newCreditsUsed;
    const isOverage = newCreditsRemaining < 0;

    // Determine new status
    let newStatus = credits.status;
    if (newCreditsRemaining <= 0) {
      newStatus = 'exhausted';
    } else if (credits.softLimit > 0 && newCreditsUsed >= credits.softLimit) {
      newStatus = 'warning';
    } else {
      newStatus = 'active';
    }

    // Update the credit document
    await updateDoc(doc(db, 'tenantCredits', creditDoc.id), {
      creditsUsed: newCreditsUsed,
      creditsRemaining: Math.max(0, newCreditsRemaining),
      overageCredits: isOverage ? credits.overageCredits + Math.abs(newCreditsRemaining) : credits.overageCredits,
      status: newStatus,
      lastUsageAt: new Date(),
    });

    // Log the usage
    const usageEntry: Omit<CreditUsage, 'id'> = {
      tenantId,
      action: action as CreditUsage['action'],
      creditsUsed: creditsToDeduct,
      description,
      timestamp: new Date(),
      ...(articleId && { articleId }),
      ...(metadata && { metadata }),
    };

    await addDoc(collection(db, 'creditUsage'), usageEntry);

    // Log transaction for billing purposes
    await addDoc(collection(db, 'creditTransactions'), {
      tenantId,
      type: 'usage',
      amount: -creditsToDeduct,
      balance: Math.max(0, newCreditsRemaining),
      description: `${action.replace(/_/g, ' ')}: ${description}`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      creditsDeducted: creditsToDeduct,
      creditsRemaining: Math.max(0, newCreditsRemaining),
      status: newStatus,
      isOverage,
    });
  } catch (error: any) {
    console.error('[Credits Deduct] Error:', error);
    return NextResponse.json(
      { error: 'Failed to deduct credits', message: error.message },
      { status: 500 }
    );
  }
}
