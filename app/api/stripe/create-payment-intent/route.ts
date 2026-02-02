import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Pricing tiers in cents
const PRICING = {
  setup: 19900, // $199 one-time setup fee
  starter: 9900, // $99/mo
  professional: 19900, // $199/mo
  enterprise: 29900, // $299/mo
};

export async function POST(request: NextRequest) {
  try {
    // Verify Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Log key prefix for debugging (safe - only shows test/live mode)
    console.log('Stripe key type:', stripeKey.startsWith('sk_test_') ? 'TEST' : stripeKey.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN');
    console.log('Stripe key length:', stripeKey.length);

    // Initialize Stripe client with explicit API version
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
    });

    const body = await request.json();
    const { plan, email, newspaperName } = body;

    if (!plan || !email || !newspaperName) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, email, newspaperName' },
        { status: 400 }
      );
    }

    // Get plan price
    const planKey = plan as keyof typeof PRICING;
    if (!PRICING[planKey] && plan !== 'custom') {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // For initial payment, charge setup fee + first month
    const setupFee = PRICING.setup;
    const monthlyFee = PRICING[planKey] || 0;
    const totalAmount = setupFee + monthlyFee;

    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          newspaperName: newspaperName,
          plan: plan,
        },
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      customer: customer.id,
      metadata: {
        newspaperName: newspaperName,
        plan: plan,
        setupFee: setupFee.toString(),
        monthlyFee: monthlyFee.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `${newspaperName} - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Setup`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      breakdown: {
        setupFee: setupFee / 100,
        monthlyFee: monthlyFee / 100,
        total: totalAmount / 100,
      },
    });
  } catch (error: any) {
    console.error('Stripe error full:', JSON.stringify(error, null, 2));
    console.error('Stripe error type:', error?.type);
    console.error('Stripe error code:', error?.code);
    console.error('Stripe error message:', error?.message);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create payment intent: ${errorMessage}` },
      { status: 500 }
    );
  }
}
