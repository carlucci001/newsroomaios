import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth, generateTempPassword } from '@/lib/firebaseAdmin';
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

    // Create admin user account for the tenant
    let adminCredentials: { email: string; temporaryPassword: string; uid?: string } | null = null;
    const auth = getAdminAuth();
    if (auth) {
      try {
        const tempPassword = generateTempPassword();

        // Check if user already exists
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(ownerEmail);
          console.log(`[Tenant Create] User ${ownerEmail} already exists, will link to tenant`);
        } catch {
          // User doesn't exist, create new one
          userRecord = await auth.createUser({
            email: ownerEmail,
            password: tempPassword,
            displayName: businessName + ' Admin',
          });
          console.log(`[Tenant Create] Created admin user: ${userRecord.uid}`);
        }

        // Store admin user info in tenant's users collection
        await db.collection(`tenants/${tenantId}/users`).doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: ownerEmail,
          displayName: businessName + ' Admin',
          role: 'owner',
          tenantId,
          createdAt: new Date(),
          lastLoginAt: null,
        });

        // Also create a root-level user document that maps user to tenant
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: ownerEmail,
          tenantId,
          role: 'owner',
          createdAt: new Date(),
        }, { merge: true });

        adminCredentials = {
          email: ownerEmail,
          temporaryPassword: tempPassword,
          uid: userRecord.uid,
        };
      } catch (authError: any) {
        console.error('[Tenant Create] Failed to create admin user:', authError);
        // Continue without admin account - not a fatal error
      }
    }

    // Create categories subcollection for template compatibility
    const categoryColors: Record<string, string> = {
      'local-news': '#1d4ed8',
      'sports': '#dc2626',
      'business': '#059669',
      'politics': '#6366f1',
      'entertainment': '#7c3aed',
      'weather': '#0ea5e9',
      'lifestyle': '#db2777',
      'outdoors': '#16a34a',
      'community': '#f59e0b',
      'crime': '#991b1b',
      'agriculture': '#15803d',
      'education': '#1e40af',
      'health': '#0d9488',
      'real-estate': '#7c2d12',
      'technology': '#4f46e5',
    };

    const catBatch = db.batch();
    for (let i = 0; i < selectedCategories.length; i++) {
      const cat = selectedCategories[i];
      const catRef = db.collection(`tenants/${tenantId}/categories`).doc(cat.id || cat.slug);
      catBatch.set(catRef, {
        name: cat.name,
        slug: cat.slug || cat.id,
        color: categoryColors[cat.slug] || categoryColors[cat.id] || '#1d4ed8',
        description: cat.directive || '',
        editorialDirective: cat.directive || '',
        isActive: cat.enabled !== false,
        sortOrder: i,
        articleCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await catBatch.commit();

    // Build navigation items from selected categories
    const navigationItems = selectedCategories.map((cat: any, index: number) => ({
      id: cat.id || cat.slug,
      label: cat.name,
      href: `/category/${cat.slug || cat.id}`,
      order: index,
      isActive: cat.enabled !== false,
    }));

    // Seed siteConfig for the tenant (navigation, general settings)
    const siteConfigBatch = db.batch();

    // siteConfig/general
    siteConfigBatch.set(db.collection(`tenants/${tenantId}/siteConfig`).doc('general'), {
      siteName: businessName,
      tagline: `Your source for ${serviceArea.city} news`,
      logo: null,
      favicon: null,
      serviceArea,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // siteConfig/navigation
    siteConfigBatch.set(db.collection(`tenants/${tenantId}/siteConfig`).doc('navigation'), {
      mainNav: navigationItems,
      footerNav: [
        { id: 'about', label: 'About Us', href: '/about', order: 0 },
        { id: 'advertise', label: 'Advertise', href: '/advertise', order: 1 },
        { id: 'contact', label: 'Contact', href: '/contact', order: 2 },
        { id: 'privacy', label: 'Privacy Policy', href: '/privacy', order: 3 },
      ],
      updatedAt: new Date(),
    });

    // siteConfig/categories
    siteConfigBatch.set(db.collection(`tenants/${tenantId}/siteConfig`).doc('categories'), {
      categories: selectedCategories.map((cat: any, index: number) => ({
        id: cat.id || cat.slug,
        name: cat.name,
        slug: cat.slug || cat.id,
        color: categoryColors[cat.slug] || categoryColors[cat.id] || '#1d4ed8',
        description: cat.directive || '',
        isActive: cat.enabled !== false,
        sortOrder: index,
      })),
      updatedAt: new Date(),
    });

    // settings/site
    siteConfigBatch.set(db.collection(`tenants/${tenantId}/settings`).doc('site'), {
      name: businessName,
      tagline: `Your source for ${serviceArea.city} news`,
      serviceArea,
      categories: navigationItems,
      updatedAt: new Date(),
    });

    await siteConfigBatch.commit();
    console.log(`[Tenant Create] Seeded siteConfig for ${tenantId}`);

    // Also seed ROOT level collections for template compatibility
    const rootBatch = db.batch();
    rootBatch.set(db.collection('siteConfig').doc('navigation'), {
      tenantId,
      mainNav: navigationItems,
      updatedAt: new Date(),
    });
    rootBatch.set(db.collection('siteConfig').doc('general'), {
      tenantId,
      siteName: businessName,
      tagline: `Your source for ${serviceArea.city} news`,
      serviceArea,
      updatedAt: new Date(),
    });
    rootBatch.set(db.collection('settings').doc('site'), {
      tenantId,
      name: businessName,
      categories: navigationItems,
      updatedAt: new Date(),
    });

    // Seed root categories collection
    for (const cat of selectedCategories) {
      const catId = cat.id || cat.slug;
      rootBatch.set(db.collection('categories').doc(catId), {
        id: catId,
        name: cat.name,
        slug: cat.slug || catId,
        color: categoryColors[cat.slug] || categoryColors[catId] || '#1d4ed8',
        description: cat.directive || '',
        isActive: cat.enabled !== false,
        tenantId,
        updatedAt: new Date(),
      });
    }
    await rootBatch.commit();
    console.log(`[Tenant Create] Seeded ROOT collections for ${tenantId}`);

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
      adminCredentials, // Includes email and temporaryPassword for user to log in
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
