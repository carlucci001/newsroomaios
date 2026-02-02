import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, getDocs, query, where, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { SetupProgress } from '@/types/setupStatus';
import { AIJournalist } from '@/types/aiJournalist';

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

    // Check if domain already exists
    const db = getDb();
    const tenantsRef = collection(db, 'tenants');
    const domainQuery = query(tenantsRef, where('domain', '==', domain));
    const existingTenants = await getDocs(domainQuery);

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

    await setDoc(doc(tenantsRef, tenantId), tenantData);

    // Create setup progress document for status tracking
    const progressData: SetupProgress = {
      tenantId,
      currentStep: 'creating_journalists',
      articlesGenerated: 0,
      totalArticles: 36,
      categoryProgress: {},
      startedAt: new Date(),
    };

    // Initialize category progress
    for (const cat of selectedCategories) {
      progressData.categoryProgress[cat.id] = {
        generated: 0,
        total: 6,
        status: 'pending',
      };
    }

    await setDoc(doc(db, 'tenants', tenantId, 'meta', 'setupStatus'), progressData);

    // Create 6 AI journalists (one per category)
    const journalistNames = [
      'Alex Rivera', 'Jordan Chen', 'Sam Martinez',
      'Taylor Brooks', 'Morgan Lee', 'Casey Kim'
    ];

    for (let i = 0; i < selectedCategories.length; i++) {
      const cat = selectedCategories[i];
      const journalist: Omit<AIJournalist, 'id'> = {
        tenantId,
        name: journalistNames[i],
        categoryId: cat.id,
        categoryName: cat.name,
        status: 'active',
        schedule: {
          frequency: 'daily',
          hour: 6 + i, // Stagger: 6AM, 7AM, 8AM, etc.
          timezone: 'America/New_York',
        },
        articlesGenerated: 0,
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'aiJournalists'), journalist);
    }

    // Trigger seeding in background (don't await - let it run async)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsroomaios.vercel.app';
    fetch(`${baseUrl}/api/scheduled/run-all-tenants`, {
      method: 'GET',
      headers: { 'X-Trigger-Source': 'tenant-creation' },
    }).catch(err => console.error('Failed to trigger seeding:', err));

    // Generate path-based URL
    const newspaperUrl = `${baseUrl}/${slug}`;

    return NextResponse.json({
      success: true,
      tenantId,
      slug,
      newspaperUrl,
      message: 'Newspaper provisioned successfully!',
      tenant: tenantData,
    });

  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
