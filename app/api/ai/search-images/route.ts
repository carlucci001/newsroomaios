import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Tenant } from '@/types/tenant';

// Platform secret for internal calls
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/ai/search-images
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

interface SearchImagesRequest {
  query: string;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

/**
 * POST /api/ai/search-images
 * Search for stock photos via Pexels API
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
    const body: SearchImagesRequest = await request.json();

    // Validate required fields
    if (!body.query) {
      return NextResponse.json(
        { success: false, error: 'query is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!PEXELS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Pexels API key not configured on platform' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    console.log(`[Search Images] Tenant: ${tenant.id}, Query: ${body.query}`);

    // Search Pexels for images
    const pexelsUrl = new URL('https://api.pexels.com/v1/search');
    pexelsUrl.searchParams.set('query', body.query);
    pexelsUrl.searchParams.set('per_page', String(body.perPage || 15));
    if (body.orientation) {
      pexelsUrl.searchParams.set('orientation', body.orientation);
    }

    const controller = new AbortController();
    const pexelsTimeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
    const pexelsResponse = await fetch(pexelsUrl.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
      signal: controller.signal,
    });
    clearTimeout(pexelsTimeout);

    if (!pexelsResponse.ok) {
      throw new Error(`Pexels API error: ${pexelsResponse.status}`);
    }

    const data: PexelsResponse = await pexelsResponse.json();

    // Transform photos to simpler format
    const photos = data.photos.map(photo => ({
      id: photo.id,
      url: photo.src.large,
      thumbnailUrl: photo.src.medium,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      alt: photo.alt || body.query,
      width: photo.width,
      height: photo.height,
    }));

    return NextResponse.json(
      {
        success: true,
        photos,
        totalResults: data.total_results,
      },
      { headers: CORS_HEADERS }
    );

  } catch (error: unknown) {
    console.error('[Search Images] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search images',
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
    if (platformSecret !== PLATFORM_SECRET) {
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
