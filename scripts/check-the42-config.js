const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const tenantId = 'tenant_1770138901335_awej6s3mo';

  console.log('Checking tenant configuration for the42:', tenantId);
  console.log('');

  // Get tenant doc
  const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
  if (!tenantDoc.exists()) {
    console.log('Tenant not found!');
    process.exit(1);
  }

  const tenant = tenantDoc.data();
  console.log('Business Name:', tenant.businessName);
  console.log('Service Area:', `${tenant.serviceArea.city}, ${tenant.serviceArea.state}`);
  console.log('');

  console.log('Selected Categories:');
  console.log('='.repeat(80));
  tenant.categories.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name}`);
    console.log(`   Slug: ${cat.slug}`);
    console.log(`   ID: ${cat.id}`);
  });

  console.log('');
  console.log('Checking article distribution:');
  console.log('='.repeat(80));

  const articlesSnap = await getDocs(collection(db, `tenants/${tenantId}/articles`));
  const categoryCount = {};
  articlesSnap.forEach(doc => {
    const data = doc.data();
    const cat = data.categorySlug || data.category;
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} articles`);
  });

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
