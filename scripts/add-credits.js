const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = 'tenant_1770130007686_goh8kbfgl';

async function main() {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await addDoc(collection(db, 'tenantCredits'), {
    tenantId: TENANT_ID,
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

  console.log('Credits added! 2000 credits allocated.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
