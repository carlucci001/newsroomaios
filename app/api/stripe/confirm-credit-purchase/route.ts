import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const CREDIT_PACKS: Record<string, { credits: number; amount: number }> = {
  credits_50: { credits: 50, amount: 2900 },
  credits_100: { credits: 100, amount: 4900 },
  credits_250: { credits: 250, amount: 9900 },
};

async function stripeAPI(endpoint: string, method: string) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured');

  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Stripe error: ${response.status}`);
  }
  return data;
}

/**
 * POST /api/stripe/confirm-credit-purchase
 *
 * Called after the client-side Stripe payment succeeds.
 * Verifies the PaymentIntent with Stripe, then adds credits to the tenant.
 * Top-off credits never expire and roll over across billing cycles.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, paymentIntentId, packId } = await request.json();

    if (!tenantId || !paymentIntentId || !packId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, paymentIntentId, packId' },
        { status: 400 }
      );
    }

    const pack = CREDIT_PACKS[packId];
    if (!pack) {
      return NextResponse.json(
        { error: `Invalid pack: ${packId}` },
        { status: 400 }
      );
    }

    // Verify payment succeeded with Stripe
    const paymentIntent = await stripeAPI(
      `/payment_intents/${encodeURIComponent(paymentIntentId)}`,
      'GET'
    );

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Verify the payment amount matches the pack
    if (paymentIntent.amount !== pack.amount) {
      console.error(`[Credit Purchase] Amount mismatch: expected ${pack.amount}, got ${paymentIntent.amount}`);
      return NextResponse.json(
        { error: 'Payment amount does not match selected pack' },
        { status: 400 }
      );
    }

    // Verify this payment hasn't already been applied (idempotency)
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const existingTxn = await db.collection('creditTransactions')
      .where('reference', '==', paymentIntentId)
      .limit(1)
      .get();

    if (!existingTxn.empty) {
      console.log(`[Credit Purchase] Already processed: ${paymentIntentId}`);
      return NextResponse.json({
        success: true,
        message: 'Credits already applied',
        credits: pack.credits,
      });
    }

    // Add credits to tenant
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    const currentTopOff = tenant.topOffCredits || 0;
    const newTopOff = currentTopOff + pack.credits;

    // Update tenant doc — top-off credits never expire
    await db.collection('tenants').doc(tenantId).update({
      topOffCredits: newTopOff,
      updatedAt: new Date(),
    });

    // Also update tenantCredits doc if it exists (add to creditsRemaining)
    const creditsQuery = await db.collection('tenantCredits')
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();

    if (!creditsQuery.empty) {
      const creditDoc = creditsQuery.docs[0];
      const currentData = creditDoc.data();
      const newRemaining = (currentData.creditsRemaining || 0) + pack.credits;

      await creditDoc.ref.update({
        creditsRemaining: newRemaining,
        // If they were exhausted, reactivate
        ...(currentData.status === 'exhausted' && { status: 'active' }),
      });
    }

    // Log the transaction
    await db.collection('creditTransactions').add({
      tenantId,
      type: 'purchase',
      creditPool: 'topoff',
      amount: pack.credits,
      balanceAfter: newTopOff,
      description: `Purchased ${pack.credits} credits ($${pack.amount / 100})`,
      reference: paymentIntentId,
      createdAt: new Date(),
    });

    console.log(`[Credit Purchase] Added ${pack.credits} credits to tenant ${tenantId} (total top-off: ${newTopOff})`);

    return NextResponse.json({
      success: true,
      creditsAdded: pack.credits,
      totalTopOff: newTopOff,
      totalCredits: (tenant.subscriptionCredits || 0) + newTopOff,
    });
  } catch (error: any) {
    console.error('[Credit Purchase] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm credit purchase' },
      { status: 500 }
    );
  }
}
