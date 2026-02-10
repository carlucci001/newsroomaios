import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const connectWebhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || '';

/**
 * POST /api/stripe/connect-webhooks
 * Handles Stripe Connect webhook events for connected tenant accounts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    if (!connectWebhookSecret) {
      console.error('[Connect Webhook] STRIPE_CONNECT_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
    }

    // Verify webhook signature
    const stripe = new Stripe(stripeSecretKey);
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, connectWebhookSecret);
    } catch (err: any) {
      console.error('[Connect Webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    console.log(`[Connect Webhook] Event: ${event.type} | Account: ${event.account || 'platform'}`);

    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const tenantId = account.metadata?.tenantId;

        if (!tenantId) {
          console.warn('[Connect Webhook] account.updated without tenantId metadata');
          break;
        }

        const isActive = account.charges_enabled && account.payouts_enabled;

        await db.collection('tenants').doc(tenantId).update({
          stripeConnectStatus: isActive ? 'active' : 'pending',
          stripeConnectUpdatedAt: new Date(),
        });

        console.log(`[Connect Webhook] Tenant ${tenantId} Connect status: ${isActive ? 'active' : 'pending'}`);
        break;
      }

      case 'payment_intent.succeeded': {
        // Log revenue for platform analytics (payment went to connected account)
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const connectedAccountId = event.account;

        if (!connectedAccountId) break;

        // Find tenant by connected account ID
        const tenantsSnapshot = await db.collection('tenants')
          .where('stripeConnectedAccountId', '==', connectedAccountId)
          .limit(1)
          .get();

        if (tenantsSnapshot.empty) break;

        const tenantId = tenantsSnapshot.docs[0].id;
        const amount = paymentIntent.amount;
        const applicationFee = paymentIntent.application_fee_amount || 0;

        await db.collection('tenantRevenue').add({
          tenantId,
          connectedAccountId,
          paymentIntentId: paymentIntent.id,
          amount,
          applicationFee,
          netToTenant: amount - applicationFee,
          currency: paymentIntent.currency,
          description: paymentIntent.description || '',
          metadata: paymentIntent.metadata || {},
          createdAt: new Date(),
        });

        console.log(`[Connect Webhook] Revenue logged: tenant=${tenantId} amount=${amount} fee=${applicationFee}`);
        break;
      }

      default:
        console.log(`[Connect Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Connect Webhook] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
