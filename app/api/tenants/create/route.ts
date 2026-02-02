import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Tenant } from '@/types/tenant';
import { SetupProgress } from '@/types/setupStatus';
import { createDefaultJournalists } from '@/types/aiJournalist';

function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const {
      businessName,
      ownerEmail,
      domain,
      serviceArea,
      selectedCategories,
    } = await request.json();

    // Validation
    if (!businessName || !ownerEmail || !domain || !serviceArea || !selectedCategories) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (selectedCategories.length !== 6) {
      return NextResponse.json(
        { error: 'Must select exactly 6 categories' },
        { status: 400 }
      );
    }

    // Get Admin Firestore (bypasses security rules)
    const db = getAdminDb();
    if (!db) {
      console.error('Firebase Admin not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check if domain already exists
    const existingTenants = await db.collection('tenants')
      .where('domain', '==', domain)
      .get();

    if (!existingTenants.empty) {
      return NextResponse.json(
        { error: 'Domain already in use' },
        { status: 409 }
      );
    }

    // Create tenant record
    const slug = generateSlug(businessName);
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const apiKey = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const tenantData: Tenant = {
      id: tenantId,
      businessName,
      slug,
      domain,
      ownerEmail,
      apiKey,
      serviceArea,
      categories: selectedCategories,
      status: 'provisioning',
      licensingStatus: 'trial',
      createdAt: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    };

    await db.collection('tenants').doc(tenantId).set(tenantData);

    // Create setup progress document for status tracking
    const now = new Date();
    const progressData: SetupProgress = {
      currentStep: 'journalists_created',
      completedSteps: ['account_created', 'payment_received'],
      articlesGenerated: 0,
      totalArticles: 36,
      categoryProgress: {},
      startedAt: now,
      lastUpdatedAt: now,
      errors: [],
    };

    // Initialize category progress
    for (const cat of selectedCategories) {
      progressData.categoryProgress[cat.id] = {
        name: cat.name,
        generated: 0,
        total: 6,
        status: 'pending',
      };
    }

    await db.collection('tenants').doc(tenantId).collection('meta').doc('setupStatus').set(progressData);

    // Create 6 AI journalists (one per category)
    const journalists = createDefaultJournalists(tenantId, businessName, selectedCategories);
    const batch = db.batch();
    for (const journalist of journalists) {
      const journalistRef = db.collection('aiJournalists').doc();
      batch.set(journalistRef, journalist);
    }
    await batch.commit();

    // Trigger seeding in background (don't await - let it run async)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsroomaios.vercel.app';
    fetch(`${baseUrl}/api/scheduled/run-all-tenants`, {
      method: 'GET',
      headers: { 'X-Trigger-Source': 'tenant-creation' },
    }).catch(err => console.error('Failed to trigger seeding:', err));

    // Trigger Vercel deployment in background
    fetch(`${baseUrl}/api/tenants/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Call': 'true',
        'X-Platform-Secret': process.env.PLATFORM_SECRET || '',
      },
      body: JSON.stringify({ tenantId }),
    }).catch(err => console.error('Failed to trigger deployment:', err));

    // Generate temporary path-based URL (will be replaced by subdomain after deployment)
    const newspaperUrl = `https://${slug}.newsroomaios.com`;

    return NextResponse.json({
      success: true,
      tenantId,
      slug,
      newspaperUrl,
      message: 'Newspaper provisioned successfully!',
      tenant: tenantData,
    });

  } catch (error: any) {
    console.error('Error creating tenant:', error);
    console.error('Error message:', error?.message);
    return NextResponse.json(
      { error: `Failed to create tenant: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
