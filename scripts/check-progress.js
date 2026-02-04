const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  // Get most recent tenant
  const tenantsSnap = await getDocs(query(collection(db, 'tenants'), orderBy('createdAt', 'desc'), limit(1)));

  if (tenantsSnap.empty) {
    console.log('No tenants found');
    process.exit(0);
  }

  const tenant = tenantsSnap.docs[0];
  const tenantData = tenant.data();
  console.log('Latest Tenant:', tenantData.businessName, '(' + tenant.id + ')');

  // Get setup status
  const statusDoc = await getDoc(doc(db, `tenants/${tenant.id}/meta`, 'setupStatus'));
  if (statusDoc.exists()) {
    const status = statusDoc.data();
    const percent = Math.round((status.articlesGenerated / status.totalArticles) * 100);
    console.log('Progress:', percent + '%');
    console.log('Articles:', status.articlesGenerated + '/' + status.totalArticles);
    console.log('Step:', status.currentStep);
    console.log('Categories:', Object.keys(status.categoryProgress || {}).join(', '));
  } else {
    console.log('No status document yet');
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
