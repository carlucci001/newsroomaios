import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';
import { safeEnv } from '@/lib/env';

const PLATFORM_URL = safeEnv('NEXT_PUBLIC_SITE_URL', 'https://www.newsroomaios.com');

async function stripeAPI(endpoint: string, method: string, params?: Record<string, string>) {
  const stripeKey = safeEnv('STRIPE_SECRET_KEY');
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
    console.error('[Stripe Connect] API error:', data);
    throw new Error(data.error?.message || `Stripe error: ${response.status}`);
  }

  return data;
}

function authenticateRequest(request: NextRequest): string | null {
  const tenantId = request.headers.get('x-tenant-id');
  const apiKey = request.headers.get('x-api-key');

  if (verifyPlatformSecret(request)) {
    return tenantId;
  }

  if (tenantId && apiKey) {
    return tenantId;
  }

  return null;
}

/**
 * GET /api/stripe/connect?tenantId=xxx
 * Check Stripe Connect status for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = authenticateRequest(request) ||
      request.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    const accountId = tenant.stripeConnectedAccountId;

    if (!accountId) {
      return NextResponse.json({
        success: true,
        status: 'not_connected',
        connectedAccountId: null,
      });
    }

    // Verify account status with Stripe
    try {
      const account = await stripeAPI(`/accounts/${encodeURIComponent(accountId)}`, 'GET');

      const isActive = account.charges_enabled && account.payouts_enabled;
      const status = isActive ? 'active' : 'pending';

      return NextResponse.json({
        success: true,
        status,
        connectedAccountId: accountId,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        businessName: account.business_profile?.name || null,
        email: account.email || null,
      });
    } catch {
      return NextResponse.json({
        success: true,
        status: 'error',
        connectedAccountId: accountId,
        message: 'Unable to verify account with Stripe',
      });
    }
  } catch (error: any) {
    console.error('[Stripe Connect] GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/stripe/connect
 * Create or resume Stripe Connect onboarding for a tenant
 *
 * Body: { tenantId, refreshUrl?, returnUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, refreshUrl, returnUrl } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantDoc.data()!;
    let accountId = tenant.stripeConnectedAccountId;

    // Create a new Connect account if one doesn't exist
    if (!accountId) {
      const account = await stripeAPI('/accounts', 'POST', {
        type: 'standard',
        'metadata[tenantId]': tenantId,
        'metadata[platform]': 'newsroomaios',
      });

      accountId = account.id;

      await db.collection('tenants').doc(tenantId).update({
        stripeConnectedAccountId: accountId,
        stripeConnectStatus: 'pending',
        stripeConnectCreatedAt: new Date(),
      });

      console.log(`[Stripe Connect] Created account ${accountId} for tenant ${tenantId}`);
    }

    // Generate onboarding link
    const defaultRefreshUrl = refreshUrl ||
      `${tenant.siteUrl || PLATFORM_URL}/admin?tab=settings&stripe=refresh`;
    const defaultReturnUrl = returnUrl ||
      `${tenant.siteUrl || PLATFORM_URL}/admin?tab=settings&stripe=success`;

    const accountLink = await stripeAPI('/account_links', 'POST', {
      account: accountId,
      refresh_url: defaultRefreshUrl,
      return_url: defaultReturnUrl,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId,
    });
  } catch (error: any) {
    console.error('[Stripe Connect] POST error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/stripe/connect
 * Disconnect a tenant's Stripe Connect account
 *
 * Body: { tenantId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    if (!verifyPlatformSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { FieldValue } = await import('firebase-admin/firestore');

    await db.collection('tenants').doc(tenantId).update({
      stripeConnectedAccountId: FieldValue.delete(),
      stripeConnectStatus: 'not_connected',
      stripeConnectDisconnectedAt: new Date(),
    });

    console.log(`[Stripe Connect] Disconnected account for tenant ${tenantId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Stripe Connect] DELETE error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
