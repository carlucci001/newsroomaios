const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = 'tenant_1770130007686_goh8kbfgl';

async function main() {
  console.log('Setting tenant status to provisioning for seeding...');
  await updateDoc(doc(db, 'tenants', TENANT_ID), {
    status: 'provisioning',
  });
  console.log('Done! Tenant will now be seeded.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
