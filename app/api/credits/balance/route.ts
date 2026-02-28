import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';
import { Tenant } from '@/types/tenant';
import { DEFAULT_PLANS } from '@/types/credits';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/credits/balance
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /api/credits/balance?tenantId=xxx
 * Get tenant credits and billing information
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const tenant = authResult.tenant!;
    const tenantData: any = tenant; // Use any to access billing fields not in Tenant type

    // Calculate days until renewal
    let daysUntilRenewal = 0;
    if (tenantData.nextBillingDate) {
      const nextBilling = tenantData.nextBillingDate._seconds
        ? new Date(tenantData.nextBillingDate._seconds * 1000)
        : new Date(tenantData.nextBillingDate);
      const now = new Date();
      daysUntilRenewal = Math.max(0, Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Look up plan limits
    const planId = tenantData.plan || 'starter';
    const planDef = DEFAULT_PLANS.find(p => p.id === planId) || DEFAULT_PLANS[0];

    // Return credits and billing info
    return NextResponse.json(
      {
        success: true,
        balance: {
          total: (tenantData.subscriptionCredits || 0) + (tenantData.topOffCredits || 0),
          subscription: tenantData.subscriptionCredits || 0,
          topOff: tenantData.topOffCredits || 0,
        },
        plan: planId,
        planLimits: {
          maxAIJournalists: planDef.maxAIJournalists,
          maxPersonas: planDef.maxPersonas,
          maxArticlesPerDay: planDef.maxArticlesPerDay,
          monthlyCredits: planDef.monthlyCredits,
        },
        status: tenantData.licensingStatus || 'active',
        daysUntilRenewal,
        nextBillingDate: tenantData.nextBillingDate,
        currentBillingStart: tenantData.currentBillingStart,
      },
      { headers: CORS_HEADERS }
    );

  } catch (error: unknown) {
    console.error('[Credits Balance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get credits balance',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * Authenticate incoming requests
 * Supports both internal (platform secret) and external (tenant API key) auth
 */
async function authenticateRequest(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
  tenant?: Tenant;
}> {
  const platformSecret = request.headers.get('x-platform-secret');
  const tenantId = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenantId');
  const apiKey = request.headers.get('x-api-key');

  // Option 1: Platform secret (internal calls)
  if (platformSecret) {
    if (!verifyPlatformSecret(request)) {
      return { valid: false, error: 'Invalid platform secret' };
    }
    // For internal calls, tenant must still be provided
    if (!tenantId) {
      return { valid: false, error: 'Tenant ID required' };
    }
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return { valid: false, error: 'Tenant not found' };
    }
    return { valid: true, tenant };
  }

  // Option 2: Tenant API key (external tenant calls)
  if (tenantId && apiKey) {
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return { valid: false, error: 'Tenant not found' };
    }
    if (tenant.apiKey !== apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }
    return { valid: true, tenant };
  }

  return { valid: false, error: 'Authentication required' };
}

/**
 * Get tenant by ID
 */
async function getTenant(tenantId: string): Promise<Tenant | null> {
  try {
    const db = getAdminDb();
    if (!db) {
      console.error('[Get Tenant] Database not configured');
      return null;
    }

    const tenantDoc = await db.collection('tenants').doc(tenantId).get();

    if (!tenantDoc.exists) {
      return null;
    }

    return { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
  } catch (error) {
    console.error('[Get Tenant] Error:', error);
    return null;
  }
}
