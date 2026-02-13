import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { safeEnv } from '@/lib/env';

const CREDIT_PACKS: Record<string, { credits: number; amount: number; name: string }> = {
  credits_100: { credits: 100, amount: 1900, name: '100 Credits' },
  credits_250: { credits: 250, amount: 4500, name: '250 Credits' },
  credits_500: { credits: 500, amount: 8500, name: '500 Credits' },
  credits_1000: { credits: 1000, amount: 15000, name: '1,000 Credits' },
};

/**
 * POST /api/stripe/credit-checkout
 *
 * Creates a Stripe Checkout Session for purchasing credit top-offs.
 * Returns a URL that the client redirects to.
 */
export async function POST(request: NextRequest) {
  try {
    const stripeKey = safeEnv('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const { tenantId, packId } = await request.json();

    if (!tenantId || !packId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, packId' },
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

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    let customerId = tenant.stripeCustomerId;

    // Create Stripe customer if missing
    if (!customerId) {
      const customerRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: tenant.ownerEmail || '',
          'metadata[tenantId]': tenantId,
          'metadata[businessName]': tenant.businessName || '',
        }).toString(),
      });

      const customerData = await customerRes.json();
      if (!customerRes.ok) {
        return NextResponse.json(
          { error: customerData.error?.message || 'Failed to create customer' },
          { status: 500 }
        );
      }

      customerId = customerData.id;
      await db.collection('tenants').doc(tenantId).update({ stripeCustomerId: customerId });
    }

    const baseUrl = safeEnv('NEXT_PUBLIC_BASE_URL', 'https://newsroomaios.com');

    // Create Checkout Session
    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'payment',
        customer: customerId,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': `${pack.name} Top-Off`,
        'line_items[0][price_data][product_data][description]': `${pack.credits} AI credits — never expire`,
        'line_items[0][price_data][unit_amount]': pack.amount.toString(),
        'line_items[0][quantity]': '1',
        success_url: `${baseUrl}/account/credits?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/account/credits/purchase`,
        'metadata[tenantId]': tenantId,
        'metadata[packId]': packId,
        'metadata[credits]': pack.credits.toString(),
        'metadata[type]': 'credit_topoff',
      }).toString(),
    });

    const sessionData = await sessionRes.json();

    if (!sessionRes.ok) {
      console.error('Stripe Checkout Session error:', sessionData);
      return NextResponse.json(
        { error: sessionData.error?.message || 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    console.log(`[Credit Checkout] Session ${sessionData.id} for tenant ${tenantId} (${pack.name})`);

    return NextResponse.json({ url: sessionData.url });
  } catch (error: any) {
    console.error('[Credit Checkout] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
