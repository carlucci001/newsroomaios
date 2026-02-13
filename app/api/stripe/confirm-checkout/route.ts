import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/stripe/confirm-checkout
 *
 * Called after user returns from a Stripe Checkout Session.
 * Retrieves the session, verifies payment, and applies credits.
 */
export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Retrieve the Checkout Session from Stripe
    const sessionRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { 'Authorization': `Bearer ${stripeKey}` },
      }
    );

    const session = await sessionRes.json();
    if (!sessionRes.ok) {
      return NextResponse.json(
        { error: session.error?.message || 'Failed to retrieve session' },
        { status: 500 }
      );
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${session.payment_status}` },
        { status: 400 }
      );
    }

    const tenantId = session.metadata?.tenantId;
    const packId = session.metadata?.packId;
    const credits = parseInt(session.metadata?.credits || '0', 10);
    const paymentIntentId = session.payment_intent;

    if (!tenantId || !credits || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Session missing required metadata' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Idempotency: check if already processed
    const existingTxn = await db.collection('creditTransactions')
      .where('reference', '==', paymentIntentId)
      .limit(1)
      .get();

    if (!existingTxn.empty) {
      return NextResponse.json({
        success: true,
        message: 'Credits already applied',
        creditsAdded: credits,
      });
    }

    // Add credits to tenant
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    const currentTopOff = tenant.topOffCredits || 0;
    const newTopOff = currentTopOff + credits;
    const amount = session.amount_total || 0;

    await db.collection('tenants').doc(tenantId).update({
      topOffCredits: newTopOff,
      updatedAt: new Date(),
    });

    // Update tenantCredits doc if it exists
    const creditsQuery = await db.collection('tenantCredits')
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();

    if (!creditsQuery.empty) {
      const creditDoc = creditsQuery.docs[0];
      const currentData = creditDoc.data();
      await creditDoc.ref.update({
        creditsRemaining: (currentData.creditsRemaining || 0) + credits,
        ...(currentData.status === 'exhausted' && { status: 'active' }),
      });
    }

    // Log transaction
    await db.collection('creditTransactions').add({
      tenantId,
      type: 'purchase',
      creditPool: 'topoff',
      amount: credits,
      balanceAfter: newTopOff,
      description: `Purchased ${credits} credits ($${(amount / 100).toFixed(2)})`,
      reference: paymentIntentId,
      createdAt: new Date(),
      metadata: { sessionId, packId },
    });

    console.log(`[Confirm Checkout] Added ${credits} credits to tenant ${tenantId} (top-off: ${newTopOff})`);

    return NextResponse.json({
      success: true,
      creditsAdded: credits,
      totalTopOff: newTopOff,
    });
  } catch (error: any) {
    console.error('[Confirm Checkout] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm purchase' },
      { status: 500 }
    );
  }
}
