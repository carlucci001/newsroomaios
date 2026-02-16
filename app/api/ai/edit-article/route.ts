import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { editArticleDraft } from '@/lib/gemini';
import { getAIConfig } from '@/lib/aiConfigService';
import { verifyPlatformSecret } from '@/lib/platformAuth';
import { Tenant } from '@/types/tenant';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

interface EditArticleRequest {
  rawDraft: string;
  temperature?: number;
  skipIfDisabled?: boolean;
}

/**
 * POST /api/ai/edit-article
 * Runs the editing pass on a raw article draft.
 * Used by tenant scheduled agents after generating a raw draft.
 * Non-critical: callers should fall back to the raw draft on any error.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body: EditArticleRequest = await request.json();

    if (!body.rawDraft) {
      return NextResponse.json(
        { success: false, error: 'rawDraft is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const aiConfig = await getAIConfig();

    // If editing is disabled, return the raw draft unchanged
    if (!aiConfig.editingPass.enabled) {
      return NextResponse.json(
        { success: true, editedDraft: body.rawDraft, wasEdited: false },
        { headers: CORS_HEADERS }
      );
    }

    console.log(`[Edit Article] Running editing pass for tenant ${authResult.tenant!.id}`);

    const editedDraft = await editArticleDraft(body.rawDraft, {
      temperature: body.temperature ?? aiConfig.editingPass.temperature,
      maxTokens: 4096,
    });

    // Validate the edited draft still has the expected format
    if (!editedDraft.includes('TITLE:') || !editedDraft.includes('CONTENT:')) {
      console.warn('[Edit Article] Edited draft missing TITLE/CONTENT format, returning raw');
      return NextResponse.json(
        { success: true, editedDraft: body.rawDraft, wasEdited: false },
        { headers: CORS_HEADERS }
      );
    }

    // Guard against dramatic length changes (>15%)
    const rawWordCount = body.rawDraft.split(/\s+/).length;
    const editedWordCount = editedDraft.split(/\s+/).length;
    const changePercent = Math.abs((editedWordCount - rawWordCount) / rawWordCount);

    if (changePercent > 0.15) {
      console.warn(`[Edit Article] Length changed by ${(changePercent * 100).toFixed(1)}% — returning raw draft`);
      return NextResponse.json(
        { success: true, editedDraft: body.rawDraft, wasEdited: false },
        { headers: CORS_HEADERS }
      );
    }

    console.log(`[Edit Article] ✓ Editing pass complete (${rawWordCount} → ${editedWordCount} words)`);

    return NextResponse.json(
      { success: true, editedDraft, wasEdited: true },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[Edit Article] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit article',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

async function authenticateRequest(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
  tenant?: Tenant;
}> {
  const platformSecret = request.headers.get('x-platform-secret');
  const tenantId = request.headers.get('x-tenant-id');
  const apiKey = request.headers.get('x-api-key');

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

async function getTenant(tenantId: string): Promise<Tenant | null> {
  try {
    const db = getAdminDb();
    if (!db) return null;
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) return null;
    return { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
  } catch (error) {
    console.error('[Get Tenant] Error:', error);
    return null;
  }
}
