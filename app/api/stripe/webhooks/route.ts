import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { safeEnv } from '@/lib/env';

const PLAN_CREDITS = {
  starter: 250,
  growth: 575,
  professional: 1000,
};

/**
 * Stripe Webhook Handler
 *
 * Handles subscription lifecycle events:
 * - payment_succeeded: Reset monthly credits
 * - subscription.updated: Update plan details
 * - subscription.deleted: Handle cancellation
 * - invoice.payment_failed: Handle failed payment
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = safeEnv('STRIPE_WEBHOOK_SECRET');
    const stripeKey = safeEnv('STRIPE_SECRET_KEY');

    if (!webhookSecret || !stripeKey) {
      console.error('[Webhook] Stripe not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Get the raw body for signature verification
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] Missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature using Stripe SDK
    const stripe = new Stripe(stripeKey);
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};

        // Only handle credit top-off purchases
        if (metadata.type === 'credit_topoff' && metadata.tenantId && metadata.credits) {
          const tenantId = metadata.tenantId;
          const creditsToAdd = parseInt(metadata.credits, 10);
          const sessionId = session.id;

          console.log(`[Webhook] Checkout completed: ${creditsToAdd} credits for tenant ${tenantId}`);

          // Idempotency: check if already processed
          const existingTx = await db
            .collection('creditTransactions')
            .where('stripeSessionId', '==', sessionId)
            .limit(1)
            .get();

          if (!existingTx.empty) {
            console.log(`[Webhook] Already processed session ${sessionId}, skipping`);
            break;
          }

          const tenantDoc = await db.collection('tenants').doc(tenantId).get();
          if (!tenantDoc.exists) {
            console.error(`[Webhook] Tenant ${tenantId} not found`);
            break;
          }

          const tenantData = tenantDoc.data()!;
          const currentTopOff = tenantData.topOffCredits || 0;
          const newTopOff = currentTopOff + creditsToAdd;

          // Add credits to tenant
          await db.collection('tenants').doc(tenantId).update({
            topOffCredits: newTopOff,
            updatedAt: new Date(),
          });

          // Log transaction
          await db.collection('creditTransactions').add({
            tenantId,
            type: 'topoff',
            creditPool: 'topoff',
            amount: creditsToAdd,
            subscriptionBalance: tenantData.subscriptionCredits || 0,
            topOffBalance: newTopOff,
            description: `Purchased ${creditsToAdd} top-off credits`,
            createdAt: new Date(),
            stripeSessionId: sessionId,
            stripePaymentId: session.payment_intent as string,
          });

          console.log(`[Webhook] Added ${creditsToAdd} top-off credits to tenant ${tenantId} (new balance: ${newTopOff})`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`[Webhook] Payment succeeded: ${invoice.id}`);

        // Find tenant by Stripe customer ID
        const tenantsSnapshot = await db
          .collection('tenants')
          .where('stripeCustomerId', '==', invoice.customer)
          .limit(1)
          .get();

        if (tenantsSnapshot.empty) {
          console.warn(`[Webhook] No tenant found for customer ${invoice.customer}`);
          break;
        }

        const tenantDoc = tenantsSnapshot.docs[0];
        const tenant = tenantDoc.data();
        const tenantId = tenantDoc.id;

        // Reset subscription credits for new billing cycle
        const planId = tenant.plan || 'starter';
        const monthlyCredits = PLAN_CREDITS[planId as keyof typeof PLAN_CREDITS] || 250;

        await db.collection('tenants').doc(tenantId).update({
          subscriptionCredits: monthlyCredits,
          currentBillingStart: new Date(),
          nextBillingDate: new Date(invoice.period_end * 1000),
          licensingStatus: 'active',
          status: 'active',
          updatedAt: new Date(),
        });

        // Log credit reset transaction
        await db.collection('creditTransactions').add({
          tenantId,
          type: 'subscription',
          creditPool: 'subscription',
          amount: monthlyCredits,
          balanceAfter: monthlyCredits,
          description: `Monthly credit allocation - ${planId} plan`,
          createdAt: new Date(),
          metadata: {
            invoiceId: invoice.id,
            planId,
            billingCycle: 'monthly',
          },
        });

        // Store invoice record
        await db.collection('invoices').doc(invoice.id).set({
          tenantId,
          stripeInvoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
          status: invoice.status,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          periodStart: new Date(invoice.period_start * 1000),
          periodEnd: new Date(invoice.period_end * 1000),
          paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : new Date(),
          createdAt: new Date(),
        });

        console.log(`[Webhook] Reset credits for tenant ${tenantId}: ${monthlyCredits}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`[Webhook] Payment failed: ${invoice.id}`);

        // Find tenant and update status
        const tenantsSnapshot = await db
          .collection('tenants')
          .where('stripeCustomerId', '==', invoice.customer)
          .limit(1)
          .get();

        if (!tenantsSnapshot.empty) {
          const tenantId = tenantsSnapshot.docs[0].id;

          await db.collection('tenants').doc(tenantId).update({
            licensingStatus: 'past_due',
            updatedAt: new Date(),
          });

          console.log(`[Webhook] Marked tenant ${tenantId} as past_due`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number };
        console.log(`[Webhook] Subscription updated: ${subscription.id}`);

        // Find tenant and update subscription details
        const tenantsSnapshot = await db
          .collection('tenants')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (!tenantsSnapshot.empty) {
          const tenantId = tenantsSnapshot.docs[0].id;

          await db.collection('tenants').doc(tenantId).update({
            licensingStatus: subscription.status,
            ...(subscription.current_period_end && {
              nextBillingDate: new Date(subscription.current_period_end * 1000),
            }),
            updatedAt: new Date(),
          });

          // Log subscription event
          await db.collection('subscriptionEvents').add({
            tenantId,
            subscriptionId: subscription.id,
            type: 'updated',
            description: `Subscription updated - status: ${subscription.status}`,
            createdAt: new Date(),
            metadata: {
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });

          console.log(`[Webhook] Updated subscription for tenant ${tenantId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`[Webhook] Subscription deleted: ${subscription.id}`);

        // Find tenant and mark as canceled
        const tenantsSnapshot = await db
          .collection('tenants')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (!tenantsSnapshot.empty) {
          const tenantId = tenantsSnapshot.docs[0].id;

          await db.collection('tenants').doc(tenantId).update({
            licensingStatus: 'canceled',
            status: 'suspended',
            updatedAt: new Date(),
          });

          // Log cancellation
          await db.collection('subscriptionEvents').add({
            tenantId,
            subscriptionId: subscription.id,
            type: 'canceled',
            description: 'Subscription canceled',
            createdAt: new Date(),
          });

          console.log(`[Webhook] Canceled subscription for tenant ${tenantId}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
