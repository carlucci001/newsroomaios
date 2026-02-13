import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

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

    // Get tenant's Stripe customer ID from Firestore
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenant = tenantDoc.data();
    const customerId = tenant?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this tenant' },
        { status: 400 }
      );
    }

    // Create Customer Portal session using REST API
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://newsroomaios.com').trim();
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${baseUrl}/account/billing`,
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
