const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = 'tenant_1770130007686_goh8kbfgl';

async function main() {
  // Check journalists
  const journalistsSnap = await getDocs(query(
    collection(db, 'aiJournalists'),
    where('tenantId', '==', TENANT_ID)
  ));
  console.log('Journalists for tenant:', journalistsSnap.size);
  journalistsSnap.docs.forEach(d => {
    const data = d.data();
    console.log('  -', data.name, '| Status:', data.status, '| Category:', data.categoryId);
  });

  // Check tenant credits
  const creditsSnap = await getDocs(query(
    collection(db, 'tenantCredits'),
    where('tenantId', '==', TENANT_ID)
  ));
  console.log('\nCredits:', creditsSnap.size > 0 ? 'Found' : 'MISSING!');
  creditsSnap.docs.forEach(d => {
    const data = d.data();
    console.log('  Remaining:', data.creditsRemaining, '| Used:', data.creditsUsed);
  });

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
