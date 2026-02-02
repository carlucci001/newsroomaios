/**
 * Update tenant status and trigger article seeding
 * Run with: npx ts-node --skip-project scripts/update-tenant-status.ts
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync(join(process.cwd(), 'service-account.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const TENANT_ID = 'tenant_1770068405395_elutn6pu6';

async function updateTenantStatus() {
  console.log('Updating tenant status...\n');

  // Get the tenant
  const tenantRef = db.collection('tenants').doc(TENANT_ID);
  const tenantDoc = await tenantRef.get();

  if (!tenantDoc.exists) {
    console.error('Tenant not found:', TENANT_ID);
    process.exit(1);
  }

  const tenant = tenantDoc.data()!;
  console.log('Current tenant status:', tenant.status);
  console.log('Current siteUrl:', tenant.siteUrl);
  console.log('Current slug:', tenant.slug);

  // Update tenant with deployment info and set status to 'provisioning'
  await tenantRef.update({
    status: 'provisioning',
    vercelProjectId: 'prj_TnGNe4amP93XYmbSVBH1ifsIjSIG',
    vercelDeploymentId: 'dpl_H3jFPzzPpDAnGH1NeB4d3EEMwLyx',
    siteUrl: 'https://the42.newsroomaios.com',
    subdomain: 'the42.newsroomaios.com',
    deployedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('\n✅ Tenant updated!');
  console.log('  - Status: provisioning');
  console.log('  - Site URL: https://the42.newsroomaios.com');

  // Check setup progress
  const progressRef = db.collection('tenants').doc(TENANT_ID).collection('meta').doc('setupProgress');
  const progressDoc = await progressRef.get();

  if (progressDoc.exists) {
    const progress = progressDoc.data()!;
    console.log('\nSetup Progress:');
    console.log('  - Articles created:', progress.articlesCreated || 0);
    console.log('  - Articles total:', progress.articlesTotal || 36);
    console.log('  - Seed complete:', progress.seedingComplete || false);
  }

  // Count AI journalists
  const journalistsSnap = await db.collection('aiJournalists').where('tenantId', '==', TENANT_ID).get();
  console.log('\nAI Journalists:', journalistsSnap.size);

  // Count articles
  const articlesSnap = await db.collection('tenants').doc(TENANT_ID).collection('articles').get();
  console.log('Articles:', articlesSnap.size);

  console.log('\n✅ Done! Tenant is ready for seeding.');
}

updateTenantStatus()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
