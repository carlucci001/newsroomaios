import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { safeEnv } from '@/lib/env';

const PLAN_PRICES = {
  starter: { priceId: 'price_starter', amount: 9900, credits: 250 },
  growth: { priceId: 'price_growth', amount: 19900, credits: 575 },
  professional: { priceId: 'price_professional', amount: 29900, credits: 1000 },
};

/**
 * Update subscription plan (upgrade/downgrade)
 * Handles Stripe subscription modification with proration
 */
export async function POST(request: NextRequest) {
  try {
    const stripeKey = safeEnv('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const { tenantId, newPlanId } = await request.json();

    if (!tenantId || !newPlanId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!PLAN_PRICES[newPlanId as keyof typeof PLAN_PRICES]) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get tenant data
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenant = tenantDoc.data();
    const subscriptionId = tenant?.stripeSubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found for this tenant' },
        { status: 400 }
      );
    }

    // Get the new plan details
    const newPlan = PLAN_PRICES[newPlanId as keyof typeof PLAN_PRICES];

    // Update subscription via Stripe REST API
    // First, get the subscription to find the subscription item ID
    const getSubResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
        },
      }
    );

    if (!getSubResponse.ok) {
      const error = await getSubResponse.json();
      console.error('Stripe get subscription error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve subscription' },
        { status: 500 }
      );
    }

    const subscription = await getSubResponse.json();
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return NextResponse.json(
        { error: 'Subscription item not found' },
        { status: 500 }
      );
    }

    // Update the subscription with new price (with proration)
    const updateResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          [`items[0][id]`]: subscriptionItemId,
          [`items[0][price]`]: newPlan.priceId,
          'proration_behavior': 'create_prorations', // Create prorated invoice
        }).toString(),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('Stripe update subscription error:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Failed to update subscription' },
        { status: 500 }
      );
    }

    // Update tenant in Firestore
    await db.collection('tenants').doc(tenantId).update({
      plan: newPlanId,
      subscriptionCredits: newPlan.credits,
      updatedAt: new Date(),
    });

    // Log the plan change
    await db.collection('creditTransactions').add({
      tenantId,
      type: 'plan_change',
      creditPool: 'subscription',
      amount: newPlan.credits,
      balanceAfter: newPlan.credits,
      description: `Plan changed to ${newPlanId}`,
      createdAt: new Date(),
      metadata: {
        oldPlan: tenant?.plan || 'starter',
        newPlan: newPlanId,
      },
    });

    console.log(`[Stripe] Updated subscription for tenant ${tenantId} to ${newPlanId}`);

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
      newPlan: newPlanId,
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
