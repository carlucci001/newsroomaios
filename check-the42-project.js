const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'newsroomaios'
  });
}

const db = admin.firestore();

async function checkProject() {
  const doc = await db.collection('tenants').doc('the42').get();
  if (doc.exists) {
    const data = doc.data();
    console.log('Vercel Project ID:', data.vercelProjectId || 'NOT SET');
    console.log('Vercel Project Name:', data.vercelProjectName || 'NOT SET');
    console.log('Domain:', data.domain || 'NOT SET');
    console.log('Business Name:', data.businessName || 'NOT SET');
  } else {
    console.log('Tenant not found');
  }
  process.exit(0);
}

checkProject().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
