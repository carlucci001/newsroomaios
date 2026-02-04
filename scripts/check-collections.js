const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const tenantId = 'tenant_1770138901335_awej6s3mo';

  console.log('Checking collections for tenant:', tenantId);
  console.log('');

  // Check root collections that tenant sites need
  const rootCollections = ['ads', 'activeAds', 'modules', 'siteConfig', 'personas'];

  for (const collName of rootCollections) {
    try {
      const snapshot = await getDocs(query(collection(db, collName), limit(1)));
      console.log(`${collName}: ${snapshot.size} documents (exists: ${!snapshot.empty})`);
    } catch (error) {
      console.log(`${collName}: ERROR - ${error.message}`);
    }
  }

  console.log('');
  console.log('Checking tenant-specific collections:');

  const tenantCollections = ['siteConfig', 'modules'];
  for (const collName of tenantCollections) {
    try {
      const path = `tenants/${tenantId}/${collName}`;
      const snapshot = await getDocs(query(collection(db, path), limit(1)));
      console.log(`${path}: ${snapshot.size} documents (exists: ${!snapshot.empty})`);
    } catch (error) {
      console.log(`${path}: ERROR - ${error.message}`);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
