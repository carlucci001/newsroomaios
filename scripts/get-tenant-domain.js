const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
  storageBucket: "newsroomasios.firebasestorage.app",
  messagingSenderId: "23445908902",
  appId: "1:23445908902:web:ead0e3559af558852b7367",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const tenantDoc = await getDoc(doc(db, 'tenants', 'tenant_1770080631285_tp82nake5'));
  if (tenantDoc.exists()) {
    const data = tenantDoc.data();
    console.log('Tenant found:');
    console.log('  ID:', tenantDoc.id);
    console.log('  Name:', data.businessName);
    console.log('  Domain:', data.domain);
    console.log('  Slug:', data.slug);
  } else {
    console.log('Tenant not found');
  }
  process.exit(0);
}

main().catch(console.error);
