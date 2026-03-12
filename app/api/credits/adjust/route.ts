import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/credits/adjust
 *
 * Admin-only endpoint for manually adjusting tenant credits.
 * Uses Admin SDK to bypass Firestore security rules (creditTransactions
 * collection blocks client-side creates).
 *
 * Auth: Firebase Auth ID token in Authorization header
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, pool, amount, reason } = body;

    if (!tenantId || !pool || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, pool, amount' },
        { status: 400 }
      );
    }

    const creditAmount = parseInt(amount);
    if (isNaN(creditAmount)) {
      return NextResponse.json(
        { error: 'Amount must be a valid number' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Admin SDK not configured' },
        { status: 500 }
      );
    }

    const tenantRef = db.collection('tenants').doc(tenantId);

    // Run atomic transaction: update tenant balance + create audit record
    await db.runTransaction(async (transaction) => {
      const tenantSnap = await transaction.get(tenantRef);

      if (!tenantSnap.exists) {
        throw new Error('Tenant not found');
      }

      const data = tenantSnap.data()!;
      let subscriptionCredits = data.subscriptionCredits || 0;
      let topOffCredits = data.topOffCredits || 0;

      if (pool === 'subscription') {
        subscriptionCredits = Math.max(0, subscriptionCredits + creditAmount);
      } else {
        topOffCredits = Math.max(0, topOffCredits + creditAmount);
      }

      transaction.update(tenantRef, {
        subscriptionCredits,
        topOffCredits,
        updatedAt: new Date(),
      });

      const transactionRef = db.collection('creditTransactions').doc();
      transaction.set(transactionRef, {
        tenantId,
        type: 'adjustment',
        creditPool: pool,
        amount: creditAmount,
        subscriptionBalance: subscriptionCredits,
        topOffBalance: topOffCredits,
        description: reason || `Manual ${pool} credit adjustment`,
        createdAt: new Date(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Credits Adjust] Error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust credits: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
