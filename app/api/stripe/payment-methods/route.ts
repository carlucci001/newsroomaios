import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { safeEnv } from '@/lib/env';

/**
 * GET /api/stripe/payment-methods?tenantId={id}
 *
 * Lists saved payment methods (cards) for a tenant's Stripe customer.
 */
export async function GET(request: NextRequest) {
  try {
    const stripeKey = safeEnv('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId');
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
      return NextResponse.json({ paymentMethods: [] });
    }

    // Fetch payment methods and customer in parallel
    const [pmRes, customerRes] = await Promise.all([
      fetch(`https://api.stripe.com/v1/payment_methods?customer=${encodeURIComponent(customerId)}&type=card`, {
        headers: { 'Authorization': `Bearer ${stripeKey}` },
      }),
      fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`, {
        headers: { 'Authorization': `Bearer ${stripeKey}` },
      }),
    ]);

    const pmData = await pmRes.json();
    const customerData = await customerRes.json();

    if (!pmRes.ok) {
      return NextResponse.json(
        { error: pmData.error?.message || 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    const defaultPmId = customerData.invoice_settings?.default_payment_method || null;

    const paymentMethods = (pmData.data || []).map((pm: any) => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === defaultPmId,
    }));

    return NextResponse.json({ paymentMethods });
  } catch (error: any) {
    console.error('[Payment Methods] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to list payment methods' },
      { status: 500 }
    );
  }
}
