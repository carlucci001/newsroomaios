import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/stripe/set-default-payment-method
 *
 * Sets a payment method as the default for a tenant's Stripe customer
 * and their active subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const { tenantId, paymentMethodId } = await request.json();
    if (!tenantId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, paymentMethodId' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    const customerId = tenant.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    // Update customer default payment method
    const customerRes = await fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'invoice_settings[default_payment_method]': paymentMethodId,
      }).toString(),
    });

    const customerData = await customerRes.json();
    if (!customerRes.ok) {
      return NextResponse.json(
        { error: customerData.error?.message || 'Failed to update default payment method' },
        { status: 500 }
      );
    }

    // Also update the subscription's default payment method if one exists
    const subscriptionId = tenant.stripeSubscriptionId;
    if (subscriptionId) {
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          default_payment_method: paymentMethodId,
        }).toString(),
      });

      if (!subRes.ok) {
        const subData = await subRes.json();
        console.warn('[Set Default PM] Could not update subscription default:', subData.error?.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Set Default PM] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to set default payment method' },
      { status: 500 }
    );
  }
}
