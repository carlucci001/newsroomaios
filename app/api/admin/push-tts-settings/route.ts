import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/admin/push-tts-settings
 *
 * Pushes TTS configuration from platform admin to all active tenant settings docs.
 * Each tenant's settings/config document gets updated with the TTS provider and voice settings.
 * Persona-specific voice overrides (voiceConfig.voiceId on individual personas) still take priority.
 *
 * NOTE: Tenants with their own Firebase project (e.g., WNC Times with gwnct database)
 * are skipped because the platform admin SDK can't write to a separate Firebase project.
 * Those tenants must have TTS settings configured via their own admin panel.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ttsProvider,
      elevenLabsVoiceId,
      elevenLabsModel,
      elevenLabsStability,
      elevenLabsSimilarity,
      elevenLabsStyle,
      elevenLabsSpeakerBoost,
    } = body;

    if (!ttsProvider) {
      return NextResponse.json(
        { error: 'ttsProvider is required' },
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

    // Get all active tenants
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

    // Build the TTS settings to push
    const ttsSettings: Record<string, unknown> = {
      ttsProvider,
    };

    if (ttsProvider === 'elevenlabs') {
      if (elevenLabsVoiceId) ttsSettings.elevenLabsVoiceId = elevenLabsVoiceId;
      if (elevenLabsModel) ttsSettings.elevenLabsModel = elevenLabsModel;
      if (elevenLabsStability !== undefined) ttsSettings.elevenLabsStability = elevenLabsStability;
      if (elevenLabsSimilarity !== undefined) ttsSettings.elevenLabsSimilarity = elevenLabsSimilarity;
      if (elevenLabsStyle !== undefined) ttsSettings.elevenLabsStyle = elevenLabsStyle;
      if (elevenLabsSpeakerBoost !== undefined) ttsSettings.elevenLabsSpeakerBoost = elevenLabsSpeakerBoost;
    }

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();

      // Skip tenants with their own Firebase project (e.g., WNC Times)
      // Platform admin SDK can't write to a separate Firebase project's Firestore
      if (tenantData.firebaseDatabaseId && tenantData.firebaseDatabaseId !== 'default') {
        console.log(`[Push TTS] Skipping ${tenantId} — has separate database: ${tenantData.firebaseDatabaseId}`);
        skipped++;
        continue;
      }

      try {
        const settingsRef = db.doc(`tenants/${tenantId}/settings/config`);
        await settingsRef.set(ttsSettings, { merge: true });
        updated++;
        console.log(`[Push TTS] Updated ${tenantId} → ${ttsProvider}`);
      } catch (err: any) {
        console.error(`[Push TTS] Failed for ${tenantId}:`, err.message);
        errors.push(`${tenantId}: ${err.message}`);
      }
    }

    console.log(`[Push TTS] Done. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `TTS settings (${ttsProvider}) pushed to ${updated} tenant(s)`,
    });
  } catch (error: any) {
    console.error('[Push TTS] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to push TTS settings' },
      { status: 500 }
    );
  }
}
