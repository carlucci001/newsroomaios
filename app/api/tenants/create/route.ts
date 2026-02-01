import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';

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

    // Generate path-based URL
    const newspaperUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://newsroomaios.vercel.app'}/${slug}`;

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
