import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// Pricing tiers in cents
const PRICING = {
  setup: 19900, // $199 one-time setup fee
  starter: 9900, // $99/mo
  professional: 19900, // $199/mo
  enterprise: 29900, // $299/mo
};

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
