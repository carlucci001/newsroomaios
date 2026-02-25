import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/admin/push-fact-check-settings
 *
 * Pushes fact-check configuration from platform admin to all active tenant settings docs.
 * Settings are written to tenants/{id}/settings/config under the aiConfig.factCheckQuick
 * and aiConfig.factCheckDetailed keys, which the tenant's getFeatureConfig() reads.
 *
 * Tenants with their own Firebase project (e.g., WNC Times) are skipped.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      temperature, maxTokensQuick, maxTokensDetailed, defaultMode, model,
      usePerplexity, perplexityModel, perplexityMaxTokens, perplexityTemperature, perplexityRecencyFilter,
    } = body;

    if (temperature === undefined || !model) {
      return NextResponse.json(
        { error: 'temperature and model are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 500 }
      );
    }

    const tenantsSnap = await db.collection('tenants')
      .where('status', 'in', ['active', 'deployed', 'seeding', 'setup_complete'])
      .get();

    if (tenantsSnap.empty) {
      return NextResponse.json({
        success: true,
        updated: 0,
        skipped: 0,
        message: 'No active tenants found',
      });
    }

    // Map platform settings to the tenant aiConfig shape
    const factCheckSettings = {
      'aiConfig.factCheckQuick': {
        enabled: true,
        primaryProvider: 'gemini',
        primaryModel: model,
        temperature,
        maxTokens: maxTokensQuick || 500,
        customParams: {
          usePerplexity: usePerplexity ?? true,
          perplexityTemperature: perplexityTemperature ?? 0.1,
          perplexityMaxTokens: perplexityMaxTokens || 1500,
          perplexityRecencyFilter: perplexityRecencyFilter || 'week',
        },
      },
      'aiConfig.factCheckDetailed': {
        enabled: true,
        primaryProvider: 'gemini',
        primaryModel: model,
        fallbackProvider: usePerplexity ? 'perplexity' : undefined,
        fallbackModel: perplexityModel || 'sonar',
        temperature,
        maxTokens: maxTokensDetailed || 2000,
        customParams: {
          usePerplexity: usePerplexity ?? true,
          perplexityTemperature: perplexityTemperature ?? 0.1,
          perplexityMaxTokens: perplexityMaxTokens || 1500,
          perplexityRecencyFilter: perplexityRecencyFilter || 'week',
        },
      },
      'aiConfig.factCheckDefaultMode': defaultMode || 'quick',
    };

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();

      if (tenantData.firebaseDatabaseId && tenantData.firebaseDatabaseId !== 'default') {
        console.log(`[Push FactCheck] Skipping ${tenantId} — has separate database: ${tenantData.firebaseDatabaseId}`);
        skipped++;
        continue;
      }

      try {
        const settingsRef = db.doc(`tenants/${tenantId}/settings/config`);
        await settingsRef.set(factCheckSettings, { merge: true });
        updated++;
        console.log(`[Push FactCheck] Updated ${tenantId} → temp=${temperature}, model=${model}`);
      } catch (err: any) {
        console.error(`[Push FactCheck] Failed for ${tenantId}:`, err.message);
        errors.push(`${tenantId}: ${err.message}`);
      }
    }

    console.log(`[Push FactCheck] Done. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Fact-check settings pushed to ${updated} tenant(s)`,
    });
  } catch (error: any) {
    console.error('[Push FactCheck] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to push fact-check settings' },
      { status: 500 }
    );
  }
}
