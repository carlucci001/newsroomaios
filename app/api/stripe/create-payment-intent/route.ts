import { NextRequest, NextResponse } from 'next/server';

// Pricing tiers in cents
const PRICING = {
  setup: 19900, // $199 one-time setup fee
  starter: 9900, // $99/mo
  professional: 19900, // $199/mo
  enterprise: 29900, // $299/mo
};

// Helper to make Stripe REST API calls directly (bypasses SDK connection issues)
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

    // Log key info for debugging
    console.log('Stripe key type:', stripeKey.startsWith('sk_test_') ? 'TEST' : stripeKey.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN');

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

    // Find or create customer using REST API
    let customerId: string;

    // List customers by email
    const customersResponse = await stripeAPI(`/customers?email=${encodeURIComponent(email)}&limit=1`, 'GET');

    if (customersResponse.data && customersResponse.data.length > 0) {
      customerId = customersResponse.data[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      // Create new customer
      const newCustomer = await stripeAPI('/customers', 'POST', {
        email: email,
        'metadata[newspaperName]': newspaperName,
        'metadata[plan]': plan,
      });
      customerId = newCustomer.id;
      console.log('Created new customer:', customerId);
    }

    // Create payment intent using REST API (card only, no Apple Pay)
    const paymentIntent = await stripeAPI('/payment_intents', 'POST', {
      amount: totalAmount.toString(),
      currency: 'usd',
      customer: customerId,
      'metadata[newspaperName]': newspaperName,
      'metadata[plan]': plan,
      'metadata[setupFee]': setupFee.toString(),
      'metadata[monthlyFee]': monthlyFee.toString(),
      'payment_method_types[0]': 'card',
      description: `${newspaperName} - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Setup`,
    });

    console.log('Created payment intent:', paymentIntent.id);

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
    console.error('Stripe error:', error.message);
    return NextResponse.json(
      { error: `Failed to create payment intent: ${error.message}` },
      { status: 500 }
    );
  }
}
