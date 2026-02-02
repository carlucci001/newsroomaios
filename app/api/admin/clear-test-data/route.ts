import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

/**
 * DELETE /api/admin/clear-test-data
 *
 * Clears all test data from Firestore for a fresh start.
 * Requires X-Platform-Secret header for authorization.
 *
 * Query params:
 * - confirm=yes (required to actually delete)
 * - keepWnct=true (optional, keeps WNCT tenant if exists)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify platform secret
    const secret = request.headers.get('X-Platform-Secret');
    if (secret !== PLATFORM_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');
    const keepWnct = searchParams.get('keepWnct') === 'true';

    if (confirm !== 'yes') {
      return NextResponse.json({
        success: false,
        error: 'Add ?confirm=yes to confirm deletion',
        message: 'This will delete all tenants, articles, AI journalists, credits, and onboarding progress.',
      });
    }

    const db = getDb();
    const results = {
      tenantsDeleted: 0,
      articlesDeleted: 0,
      journalistsDeleted: 0,
      creditsDeleted: 0,
      onboardingDeleted: 0,
      errors: [] as string[],
    };

    // 1. Get all tenants
    const tenantsSnap = await getDocs(collection(db, 'tenants'));
    const tenantIds: string[] = [];

    for (const tenantDoc of tenantsSnap.docs) {
      const tenantData = tenantDoc.data();

      // Optionally skip WNCT
      if (keepWnct && tenantData.businessName?.toLowerCase().includes('wnct')) {
        console.log(`[Clear] Keeping WNCT tenant: ${tenantDoc.id}`);
        continue;
      }

      tenantIds.push(tenantDoc.id);

      try {
        // Delete tenant's articles subcollection
        const articlesSnap = await getDocs(collection(db, `tenants/${tenantDoc.id}/articles`));
        for (const articleDoc of articlesSnap.docs) {
          await deleteDoc(doc(db, `tenants/${tenantDoc.id}/articles`, articleDoc.id));
          results.articlesDeleted++;
        }

        // Delete tenant's meta subcollection (setup status)
        const metaSnap = await getDocs(collection(db, `tenants/${tenantDoc.id}/meta`));
        for (const metaDoc of metaSnap.docs) {
          await deleteDoc(doc(db, `tenants/${tenantDoc.id}/meta`, metaDoc.id));
        }

        // Delete tenant document
        await deleteDoc(doc(db, 'tenants', tenantDoc.id));
        results.tenantsDeleted++;
        console.log(`[Clear] Deleted tenant: ${tenantData.businessName}`);
      } catch (error: any) {
        results.errors.push(`Tenant ${tenantDoc.id}: ${error.message}`);
      }
    }

    // 2. Delete AI journalists for deleted tenants
    if (tenantIds.length > 0) {
      const journalistsSnap = await getDocs(collection(db, 'aiJournalists'));
      for (const journalistDoc of journalistsSnap.docs) {
        const data = journalistDoc.data();
        if (tenantIds.includes(data.tenantId)) {
          await deleteDoc(doc(db, 'aiJournalists', journalistDoc.id));
          results.journalistsDeleted++;
        }
      }
    }

    // 3. Delete tenant credits for deleted tenants
    if (tenantIds.length > 0) {
      const creditsSnap = await getDocs(collection(db, 'tenantCredits'));
      for (const creditDoc of creditsSnap.docs) {
        const data = creditDoc.data();
        if (tenantIds.includes(data.tenantId)) {
          await deleteDoc(doc(db, 'tenantCredits', creditDoc.id));
          results.creditsDeleted++;
        }
      }
    }

    // 4. Delete credit usage records for deleted tenants
    if (tenantIds.length > 0) {
      const usageSnap = await getDocs(collection(db, 'creditUsage'));
      for (const usageDoc of usageSnap.docs) {
        const data = usageDoc.data();
        if (tenantIds.includes(data.tenantId)) {
          await deleteDoc(doc(db, 'creditUsage', usageDoc.id));
        }
      }
    }

    // 5. Delete onboarding progress
    const onboardingSnap = await getDocs(collection(db, 'onboardingProgress'));
    for (const onboardingDoc of onboardingSnap.docs) {
      await deleteDoc(doc(db, 'onboardingProgress', onboardingDoc.id));
      results.onboardingDeleted++;
    }

    return NextResponse.json({
      success: true,
      message: 'Test data cleared successfully',
      results,
    });
  } catch (error: any) {
    console.error('[Clear Test Data] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clear-test-data
 *
 * Preview what would be deleted without actually deleting.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify platform secret
    const secret = request.headers.get('X-Platform-Secret');
    if (secret !== PLATFORM_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const preview = {
      tenants: [] as { id: string; name: string; articles: number }[],
      aiJournalists: 0,
      tenantCredits: 0,
      onboardingProgress: 0,
    };

    // Count tenants and their articles
    const tenantsSnap = await getDocs(collection(db, 'tenants'));
    for (const tenantDoc of tenantsSnap.docs) {
      const articlesSnap = await getDocs(collection(db, `tenants/${tenantDoc.id}/articles`));
      preview.tenants.push({
        id: tenantDoc.id,
        name: tenantDoc.data().businessName || 'Unknown',
        articles: articlesSnap.size,
      });
    }

    // Count other collections
    const journalistsSnap = await getDocs(collection(db, 'aiJournalists'));
    preview.aiJournalists = journalistsSnap.size;

    const creditsSnap = await getDocs(collection(db, 'tenantCredits'));
    preview.tenantCredits = creditsSnap.size;

    const onboardingSnap = await getDocs(collection(db, 'onboardingProgress'));
    preview.onboardingProgress = onboardingSnap.size;

    return NextResponse.json({
      success: true,
      message: 'Preview of data to be deleted. Use DELETE method with ?confirm=yes to delete.',
      preview,
      totalTenants: preview.tenants.length,
      totalArticles: preview.tenants.reduce((sum, t) => sum + t.articles, 0),
    });
  } catch (error: any) {
    console.error('[Clear Test Data Preview] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
