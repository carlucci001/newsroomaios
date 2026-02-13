import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { safeEnv } from '@/lib/env';

/**
 * POST /api/stripe/setup-intent
 *
 * Creates a Stripe SetupIntent for saving a new payment method (card)
 * without charging the customer.
 */
export async function POST(request: NextRequest) {
  try {
    const stripeKey = safeEnv('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
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
      return NextResponse.json({ error: 'No Stripe customer found for this tenant' }, { status: 400 });
    }

    const res = await fetch('https://api.stripe.com/v1/setup_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'payment_method_types[0]': 'card',
        usage: 'off_session',
      }).toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to create setup intent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientSecret: data.client_secret });
  } catch (error: any) {
    console.error('[Setup Intent] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
