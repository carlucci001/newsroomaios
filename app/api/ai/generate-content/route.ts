import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { generateContent } from '@/lib/gemini';
import { Tenant } from '@/types/tenant';

// Platform secret for internal calls
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/ai/generate-content
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

interface GenerateContentRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

/**
 * POST /api/ai/generate-content
 * Generic content generation endpoint for tenant admin features
 * (chat, suggestions, small content generation)
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
    const body: GenerateContentRequest = await request.json();

    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json(
        { success: false, error: 'prompt is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log(`[Generate Content] Tenant: ${tenant.id}, Prompt length: ${body.prompt.length}`);

    // Generate content using Gemini
    const content = await generateContent(
      body.prompt,
      {
        systemInstruction: body.systemInstruction,
        model: body.model || 'gemini-2.0-flash-exp',
        temperature: body.temperature,
        maxOutputTokens: body.maxTokens,
        responseMimeType: body.responseFormat === 'json' ? 'application/json' : 'text/plain',
      }
    );

    return NextResponse.json(
      {
        success: true,
        content,
      },
      { headers: CORS_HEADERS }
    );

  } catch (error: unknown) {
    console.error('[Generate Content] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content',
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
