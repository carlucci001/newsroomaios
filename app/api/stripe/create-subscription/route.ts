import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_growth',
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional',
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
 * POST /api/stripe/create-subscription
 *
 * Creates a recurring Stripe Subscription after initial payment.
 * Uses trial_end to avoid double-charging (first month already paid via PaymentIntent).
 */
export async function POST(request: NextRequest) {
  try {
    const { customerId, plan, tenantId } = await request.json();

    if (!customerId || !plan || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, plan, tenantId' },
        { status: 400 }
      );
    }

    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}` },
        { status: 400 }
      );
    }

    // Get customer's saved payment method (saved via setup_future_usage on PaymentIntent)
    const paymentMethods = await stripeAPI(
      `/payment_methods?customer=${encodeURIComponent(customerId)}&type=card&limit=1`,
      'GET'
    );

    if (!paymentMethods.data || paymentMethods.data.length === 0) {
      console.error(`[Subscription] No payment method found for customer ${customerId}`);
      return NextResponse.json(
        { error: 'No payment method found for customer' },
        { status: 400 }
      );
    }

    const paymentMethodId = paymentMethods.data[0].id;

    // Set default payment method on customer for invoices
    await stripeAPI(`/customers/${encodeURIComponent(customerId)}`, 'POST', {
      'invoice_settings[default_payment_method]': paymentMethodId,
    });

    // First billing ~30 days from now (first month already paid)
    const trialEnd = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    // Create subscription
    const subscription = await stripeAPI('/subscriptions', 'POST', {
      customer: customerId,
      'items[0][price]': priceId,
      default_payment_method: paymentMethodId,
      trial_end: trialEnd.toString(),
      'metadata[tenantId]': tenantId,
      'metadata[plan]': plan,
    });

    console.log(`[Subscription] Created ${subscription.id} for tenant ${tenantId} (${plan}, trial until ${new Date(trialEnd * 1000).toISOString()})`);

    // Update tenant doc with Stripe IDs
    const db = getAdminDb();
    if (db) {
      await db.collection('tenants').doc(tenantId).update({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      trialEnd: new Date(trialEnd * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('[Subscription] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
