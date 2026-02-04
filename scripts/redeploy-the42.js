#!/usr/bin/env node

/**
 * Script to trigger redeployment of the42 tenant
 * This will pull the latest wnct-template code with our admin fixes
 */

const { vercelService } = require('../src/lib/vercel');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'newsroomaios'
  });
}

const db = admin.firestore();

async function redeployThe42() {
  try {
    console.log('[Redeploy] Fetching the42 tenant info...');

    const tenantDoc = await db.collection('tenants').doc('the42').get();

    if (!tenantDoc.exists) {
      console.error('❌ the42 tenant not found');
      process.exit(1);
    }

    const tenant = tenantDoc.data();
    console.log('[Redeploy] Found tenant:', tenant.businessName);
    console.log('[Redeploy] Vercel project ID:', tenant.vercelProjectId || 'NOT SET');

    if (!tenant.vercelProjectId) {
      console.error('❌ No Vercel project ID found for the42');
      console.log('\nThis tenant may have been deployed manually.');
      console.log('Options:');
      console.log('1. Go to Vercel dashboard and trigger a redeploy manually');
      console.log('2. Go to the tenant\'s GitHub repo and push an update');
      process.exit(1);
    }

    console.log('[Redeploy] Triggering new deployment...');
    const deployment = await vercelService.triggerDeployment(tenant.vercelProjectId);

    if (!deployment) {
      console.error('❌ Failed to trigger deployment');
      console.log('\nYou can manually trigger a redeploy:');
      console.log('1. Go to https://vercel.com');
      console.log('2. Find the newspaper-the42 project');
      console.log('3. Click "Redeploy" on the latest deployment');
      process.exit(1);
    }

    console.log('✅ Deployment triggered successfully!');
    console.log('- Deployment ID:', deployment.id);
    console.log('- Deployment URL:', deployment.url);
    console.log('\nThe site will update in a few minutes with the admin fixes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

redeployThe42()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
