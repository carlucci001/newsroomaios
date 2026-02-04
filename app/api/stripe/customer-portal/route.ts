import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a Stripe Customer Portal session
 * Allows customers to manage payment methods, view invoices, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // TODO: Get tenant's Stripe customer ID from Firestore
    // For now, return a placeholder
    // const tenant = await getTenant(tenantId);
    // const customerId = tenant.stripeCustomerId;

    // Create Customer Portal session using REST API
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: 'cus_placeholder', // TODO: Get from tenant
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account/billing`,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Stripe portal error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Failed to create portal session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (error: any) {
    console.error('Customer portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
