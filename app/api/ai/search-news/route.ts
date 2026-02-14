import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { searchNewsWithRetry } from '@/lib/webSearch';
import { getAIConfig } from '@/lib/aiConfigService';
import { verifyPlatformSecret } from '@/lib/platformAuth';
import { Tenant } from '@/types/tenant';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/ai/search-news
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

interface SearchNewsRequest {
  query: string;
  focusArea?: string;
  city?: string;
  state?: string;
}

/**
 * POST /api/ai/search-news
 * Search for current news using Perplexity with 3-pass retry strategy.
 * Uses centralized AI config for model and search parameters.
 */
export async function POST(request: NextRequest) {
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
    const body: SearchNewsRequest = await request.json();

    // Validate required fields
    if (!body.query) {
      return NextResponse.json(
        { success: false, error: 'query is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log(`[Search News] Tenant: ${tenant.id}, Query: ${body.query}`);

    // Load platform AI config for web search parameters
    const aiConfig = await getAIConfig();

    // Use tenant's service area for city/state if not provided
    const city = body.city || tenant.serviceArea?.city;
    const state = body.state || tenant.serviceArea?.state;

    // Run 3-pass search strategy
    const source = await searchNewsWithRetry(body.query, {
      focusArea: body.focusArea,
      city,
      state,
      config: {
        model: aiConfig.webSearch.model,
        maxTokens: aiConfig.webSearch.maxTokens,
        temperature: aiConfig.webSearch.temperature,
        searchDomainFilter: aiConfig.webSearch.searchDomainFilter,
        searchRecencyFilter: aiConfig.webSearch.searchRecencyFilter,
      },
    });

    if (!source) {
      return NextResponse.json(
        {
          success: true,
          source: null,
          message: 'No news found for this query',
        },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        source: {
          title: source.title,
          description: source.description,
          fullContent: source.fullContent,
          sourceName: source.sourceName,
          url: source.url || null,
        },
      },
      { headers: CORS_HEADERS }
    );

  } catch (error: unknown) {
    console.error('[Search News] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search news',
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
  const tenantId = request.headers.get('x-tenant-id');
  const apiKey = request.headers.get('x-api-key');

  // Option 1: Platform secret (internal calls)
  if (platformSecret) {
    if (!verifyPlatformSecret(request)) {
      return { valid: false, error: 'Invalid platform secret' };
    }
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
