/**
 * Seed siteConfig for tenant with their selected categories
 * Run with: node scripts/seed-tenant-siteconfig.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
  storageBucket: "newsroomasios.firebasestorage.app",
  messagingSenderId: "23445908902",
  appId: "1:23445908902:web:ead0e3559af558852b7367",
};

const TENANT_ID = process.env.TENANT_ID || 'tenant_1770130007686_goh8kbfgl';

async function seedSiteConfig() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Get tenant data
  console.log('Fetching tenant data...');
  const tenantDoc = await getDoc(doc(db, 'tenants', TENANT_ID));

  if (!tenantDoc.exists()) {
    console.error('Tenant not found!');
    process.exit(1);
  }

  const tenant = tenantDoc.data();
  console.log('Tenant:', tenant.businessName);
  console.log('Categories:', tenant.categories?.length || 0);

  const categories = tenant.categories || [];
  const businessName = tenant.businessName || 'Local News';
  const serviceArea = tenant.serviceArea || { city: 'Local', state: '' };

  // Build navigation items from tenant's selected categories
  const navigationItems = categories.map((cat, index) => ({
    id: cat.id || cat.slug,
    label: cat.name,
    href: `/category/${cat.slug || cat.id}`,
    order: index,
    isActive: cat.enabled !== false,
  }));

  console.log('\nNavigation items:');
  navigationItems.forEach(item => console.log(`  - ${item.label} -> ${item.href}`));

  // Seed tenant's siteConfig/general
  console.log('\nSeeding siteConfig/general...');
  await setDoc(doc(db, `tenants/${TENANT_ID}/siteConfig`, 'general'), {
    siteName: businessName,
    tagline: `Your source for ${serviceArea.city} news`,
    logo: null,
    favicon: null,
    serviceArea,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Seed tenant's siteConfig/navigation
  console.log('Seeding siteConfig/navigation...');
  await setDoc(doc(db, `tenants/${TENANT_ID}/siteConfig`, 'navigation'), {
    mainNav: navigationItems,
    footerNav: [
      { id: 'about', label: 'About Us', href: '/about', order: 0 },
      { id: 'advertise', label: 'Advertise', href: '/advertise', order: 1 },
      { id: 'contact', label: 'Contact', href: '/contact', order: 2 },
      { id: 'privacy', label: 'Privacy Policy', href: '/privacy', order: 3 },
    ],
    updatedAt: new Date(),
  });

  // Seed tenant's siteConfig/categories
  console.log('Seeding siteConfig/categories...');
  await setDoc(doc(db, `tenants/${TENANT_ID}/siteConfig`, 'categories'), {
    categories: categories.map((cat, index) => ({
      id: cat.id || cat.slug,
      name: cat.name,
      slug: cat.slug || cat.id,
      color: cat.color || '#1d4ed8',
      description: cat.directive || '',
      isActive: cat.enabled !== false,
      sortOrder: index,
    })),
    updatedAt: new Date(),
  });

  // Seed tenant's settings/site
  console.log('Seeding settings/site...');
  await setDoc(doc(db, `tenants/${TENANT_ID}/settings`, 'site'), {
    name: businessName,
    tagline: `Your source for ${serviceArea.city} news`,
    serviceArea,
    categories: navigationItems,
    updatedAt: new Date(),
  });

  // Also seed ROOT level collections that the template might read from
  // These are fallbacks for templates that aren't fully multi-tenant aware

  console.log('\nSeeding ROOT level siteConfig...');
  await setDoc(doc(db, 'siteConfig', 'navigation'), {
    tenantId: TENANT_ID,
    mainNav: navigationItems,
    footerNav: [
      { id: 'about', label: 'About Us', href: '/about', order: 0 },
      { id: 'advertise', label: 'Advertise', href: '/advertise', order: 1 },
      { id: 'contact', label: 'Contact', href: '/contact', order: 2 },
    ],
    updatedAt: new Date(),
  });

  await setDoc(doc(db, 'siteConfig', 'general'), {
    tenantId: TENANT_ID,
    siteName: businessName,
    tagline: `Your source for ${serviceArea.city} news`,
    serviceArea,
    updatedAt: new Date(),
  });

  // Seed ROOT level settings
  console.log('Seeding ROOT level settings...');
  await setDoc(doc(db, 'settings', 'site'), {
    tenantId: TENANT_ID,
    name: businessName,
    tagline: `Your source for ${serviceArea.city} news`,
    categories: navigationItems,
    updatedAt: new Date(),
  });

  // Also update/create the categories collection entries
  console.log('\nUpdating ROOT categories collection...');
  for (const cat of categories) {
    const catId = cat.id || cat.slug;
    await setDoc(doc(db, 'categories', catId), {
      id: catId,
      name: cat.name,
      slug: cat.slug || catId,
      color: cat.color || '#1d4ed8',
      description: cat.directive || '',
      isActive: cat.enabled !== false,
      articleCount: 0,
      tenantId: TENANT_ID,
      updatedAt: new Date(),
    });
    console.log(`  - Created category: ${cat.name}`);
  }

  console.log('\n✅ Site config seeded successfully!');
  console.log(`   Tenant: ${businessName}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Navigation items: ${navigationItems.length}`);

  process.exit(0);
}

seedSiteConfig().catch((error) => {
  console.error('Error seeding site config:', error);
  process.exit(1);
});
