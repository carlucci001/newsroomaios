import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { safeEnv } from '@/lib/env';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

// Credit packs — authoritative pricing (matches tenant creditPricing.ts)
const CREDIT_PACKS: Record<string, { credits: number; amount: number; name: string }> = {
  small:  { credits: 50,  amount: 500,  name: 'Small Pack' },
  medium: { credits: 100, amount: 1000, name: 'Medium Pack' },
  large:  { credits: 250, amount: 2000, name: 'Large Pack' },
  bulk:   { credits: 500, amount: 3500, name: 'Bulk Pack' },
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/stripe/credit-checkout
 *
 * Creates a Stripe Checkout Session for purchasing credit top-offs.
 * Called by tenant sites (proxied through their /api/stripe/checkout).
 * All payments go to Farrington Development's Stripe account.
 */
export async function POST(request: NextRequest) {
  try {
    const stripeKey = safeEnv('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { tenantId, packId, successUrl, cancelUrl } = body;

    if (!tenantId || !packId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, packId' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const pack = CREDIT_PACKS[packId];
    if (!pack) {
      return NextResponse.json(
        { error: `Invalid pack: ${packId}. Valid packs: ${Object.keys(CREDIT_PACKS).join(', ')}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: CORS_HEADERS });
    }

    // Verify tenant exists
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: CORS_HEADERS });
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
          name: tenant.businessName || tenant.siteName || tenantId,
          email: tenant.ownerEmail || '',
          description: `NewsroomAIOS subscriber — ${tenant.plan || 'starter'} plan`,
          'metadata[tenantId]': tenantId,
          'metadata[businessName]': tenant.businessName || '',
        }).toString(),
      });

      const customerData = await customerRes.json();
      if (!customerRes.ok) {
        return NextResponse.json(
          { error: customerData.error?.message || 'Failed to create customer' },
          { status: 500, headers: CORS_HEADERS }
        );
      }

      customerId = customerData.id;
      await db.collection('tenants').doc(tenantId).update({ stripeCustomerId: customerId });
    }

    // Use tenant-provided URLs if available, otherwise default to platform
    const baseUrl = safeEnv('NEXT_PUBLIC_BASE_URL', 'https://newsroomaios.com');
    const finalSuccessUrl = successUrl || `${baseUrl}/account/credits?purchase=success&session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/account/credits/purchase`;

    // Build descriptive product name so the customer knows exactly what they're paying for
    const newspaperName = tenant.businessName || tenant.siteName || tenantId;
    const productName = `NewsroomAIOS ${pack.name} — ${pack.credits} AI Credits`;
    const productDescription = `${pack.credits} AI credits for ${newspaperName}. Credits never expire. Service provided by Farrington Development LLC via NewsroomAIOS. All sales are final — no refunds.`;

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
        'line_items[0][price_data][product_data][name]': productName,
        'line_items[0][price_data][product_data][description]': productDescription,
        'line_items[0][price_data][unit_amount]': pack.amount.toString(),
        'line_items[0][quantity]': '1',
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        'metadata[tenantId]': tenantId,
        'metadata[packId]': packId,
        'metadata[credits]': pack.credits.toString(),
        'metadata[type]': 'credit_topoff',
        'metadata[newspaperName]': newspaperName,
        'payment_intent_data[statement_descriptor_suffix]': 'CREDITS',
      }).toString(),
    });

    const sessionData = await sessionRes.json();

    if (!sessionRes.ok) {
      console.error('[Credit Checkout] Stripe session error:', sessionData);
      return NextResponse.json(
        { error: sessionData.error?.message || 'Failed to create checkout session' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    console.log(`[Credit Checkout] Session ${sessionData.id} for tenant ${tenantId} (${pack.name}, ${pack.credits} credits)`);

    return NextResponse.json({ url: sessionData.url }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('[Credit Checkout] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
