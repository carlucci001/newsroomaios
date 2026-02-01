import { NextResponse } from 'next/server';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

/**
 * GET /api/admin/seed-wnct
 * Seeds WNC Times as the first tenant - one-time use
 */
export async function GET() {
  try {
    const db = getDb();
    const tenantId = 'wnct-times';
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Create tenant
    await setDoc(doc(db, 'tenants', tenantId), {
      businessName: 'WNC Times',
      slug: 'wnct-times',
      domain: 'wnctimes.com',
      ownerEmail: 'admin@wnctimes.com',
      apiKey: 'wnct-api-key-2024',
      serviceArea: {
        city: 'Asheville',
        state: 'NC',
        region: 'Western North Carolina',
      },
      categories: [
        { id: 'local-news', name: 'Local News', slug: 'local-news', directive: 'Western NC local news', enabled: true },
        { id: 'sports', name: 'Sports', slug: 'sports', directive: 'Local sports coverage', enabled: true },
        { id: 'business', name: 'Business', slug: 'business', directive: 'Regional business news', enabled: true },
        { id: 'weather', name: 'Weather', slug: 'weather', directive: 'WNC weather updates', enabled: true },
        { id: 'community', name: 'Community', slug: 'community', directive: 'Community events', enabled: true },
        { id: 'politics', name: 'Politics', slug: 'politics', directive: 'Local government news', enabled: true },
      ],
      status: 'active',
      licensingStatus: 'active',
      createdAt: now,
      platformUrl: 'https://newsroomaios.com',
    });

    // Create credit allocation
    await addDoc(collection(db, 'tenantCredits'), {
      tenantId: tenantId,
      planId: 'professional',
      cycleStartDate: now,
      cycleEndDate: endOfMonth,
      monthlyAllocation: 2000,
      creditsUsed: 0,
      creditsRemaining: 2000,
      overageCredits: 0,
      softLimit: 1600,
      hardLimit: 0,
      status: 'active',
      softLimitWarned: false,
    });

    return NextResponse.json({
      success: true,
      message: 'WNC Times tenant created!',
      tenantId,
      credits: 2000,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
