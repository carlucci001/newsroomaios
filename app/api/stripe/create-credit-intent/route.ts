import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const CREDIT_PACKS: Record<string, { credits: number; amount: number; priceId: string; name: string }> = {
  credits_50: {
    credits: 50,
    amount: 2900,
    priceId: process.env.STRIPE_PRICE_CREDITS_50 || 'price_credits_50',
    name: '50 Credits',
  },
  credits_100: {
    credits: 100,
    amount: 4900,
    priceId: process.env.STRIPE_PRICE_CREDITS_100 || 'price_credits_100',
    name: '100 Credits',
  },
  credits_250: {
    credits: 250,
    amount: 9900,
    priceId: process.env.STRIPE_PRICE_CREDITS_250 || 'price_credits_250',
    name: '250 Credits',
  },
};

async function stripeAPI(endpoint: string, method: string, params?: Record<string, string>) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured');

  const url = `https://api.stripe.com/v1${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  if (params && (method === 'POST' || method === 'PUT')) {
    options.body = new URLSearchParams(params).toString();
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error('Stripe API error:', data);
    throw new Error(data.error?.message || `Stripe error: ${response.status}`);
  }

  return data;
}

/**
 * POST /api/stripe/create-credit-intent
 *
 * Creates a Stripe PaymentIntent for purchasing a credit top-off pack.
 * Top-off credits never expire and roll over across billing cycles.
 */
export async function POST(request: NextRequest) {
  try {
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
        { error: `Invalid pack: ${packId}. Valid packs: ${Object.keys(CREDIT_PACKS).join(', ')}` },
        { status: 400 }
      );
    }

    // Get tenant to find their Stripe customer ID
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

    // If no Stripe customer, create one
    if (!customerId) {
      const customer = await stripeAPI('/customers', 'POST', {
        email: tenant.ownerEmail,
        'metadata[tenantId]': tenantId,
        'metadata[businessName]': tenant.businessName || '',
      });
      customerId = customer.id;

      await db.collection('tenants').doc(tenantId).update({
        stripeCustomerId: customerId,
      });
    }

    // Create PaymentIntent for the credit pack
    const paymentIntent = await stripeAPI('/payment_intents', 'POST', {
      amount: pack.amount.toString(),
      currency: 'usd',
      customer: customerId,
      'metadata[tenantId]': tenantId,
      'metadata[packId]': packId,
      'metadata[credits]': pack.credits.toString(),
      'metadata[type]': 'credit_topoff',
      'payment_method_types[0]': 'card',
      description: `${tenant.businessName || tenantId} - ${pack.name} Top-Off`,
    });

    console.log(`[Credit Intent] Created ${paymentIntent.id} for tenant ${tenantId} (${pack.name}, $${pack.amount / 100})`);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId,
      pack: {
        id: packId,
        credits: pack.credits,
        amount: pack.amount / 100,
        name: pack.name,
      },
    });
  } catch (error: any) {
    console.error('[Credit Intent] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/create-credit-intent
 *
 * Returns available credit packs and pricing.
 */
export async function GET() {
  const packs = Object.entries(CREDIT_PACKS).map(([id, pack]) => ({
    id,
    credits: pack.credits,
    price: pack.amount / 100,
    name: pack.name,
  }));

  return NextResponse.json({ packs });
}
