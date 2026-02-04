#!/usr/bin/env node

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'newsroomaios'
  });
}

const db = admin.firestore();

async function checkDeployment() {
  try {
    const doc = await db.collection('tenants').doc('the42').get();

    if (!doc.exists) {
      console.log('❌ Tenant not found');
      process.exit(1);
    }

    const data = doc.data();
    console.log('\n📋 the42 Deployment Info:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Business Name:', data.businessName);
    console.log('Slug:', data.slug);
    console.log('Status:', data.status);
    console.log('Site URL:', data.siteUrl || '❌ NOT SET');
    console.log('Vercel Project ID:', data.vercelProjectId || '❌ NOT SET');
    console.log('Vercel Deployment ID:', data.vercelDeploymentId || '❌ NOT SET');
    console.log('GitHub Repo:', data.githubRepo || '❌ NOT SET');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!data.vercelProjectId && !data.githubRepo) {
      console.log('⚠️  WARNING: No deployment info found!');
      console.log('This tenant may have been created without automatic deployment.');
      console.log('\nNext steps:');
      console.log('1. Manual deployment needed');
      console.log('2. Or configure Vercel integration in platform');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDeployment();
