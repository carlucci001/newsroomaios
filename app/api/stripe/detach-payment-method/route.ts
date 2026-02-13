import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/stripe/detach-payment-method
 *
 * Removes a payment method from a tenant's Stripe customer.
 * Cannot remove the default payment method.
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

    // Check if this is the default payment method
    const customerRes = await fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`, {
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });
    const customerData = await customerRes.json();
    const defaultPmId = customerData.invoice_settings?.default_payment_method;

    if (paymentMethodId === defaultPmId) {
      return NextResponse.json(
        { error: 'Cannot remove the default payment method. Set a different card as default first.' },
        { status: 400 }
      );
    }

    // Detach the payment method
    const detachRes = await fetch(
      `https://api.stripe.com/v1/payment_methods/${encodeURIComponent(paymentMethodId)}/detach`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const detachData = await detachRes.json();
    if (!detachRes.ok) {
      return NextResponse.json(
        { error: detachData.error?.message || 'Failed to remove payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Detach PM] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}
