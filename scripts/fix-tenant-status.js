const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = 'tenant_1770130007686_goh8kbfgl';
const PROJECT_ID = 'prj_CK6nnBRJaDNi1KcjXewUUxlai4BB';
const DEPLOYMENT_ID = 'dpl_EfT6BByFyQd3aggku8oUJPMEcqqo';
const SITE_URL = 'https://newspaper-the42.vercel.app';

async function main() {
  console.log('Updating tenant record...');

  // Update tenant document
  await updateDoc(doc(db, 'tenants', TENANT_ID), {
    status: 'active',
    vercelProjectId: PROJECT_ID,
    vercelDeploymentId: DEPLOYMENT_ID,
    siteUrl: SITE_URL,
    subdomain: 'the42.newsroomaios.com',
    deployedAt: new Date(),
  });

  console.log('Updating setup status...');

  // Update setup status
  await updateDoc(doc(db, `tenants/${TENANT_ID}/meta`, 'setupStatus'), {
    currentStep: 'deploying_site',
    siteUrl: SITE_URL,
    lastUpdatedAt: new Date(),
  });

  console.log('Done! Tenant updated with deployment info.');
  console.log('Site URL:', SITE_URL);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
