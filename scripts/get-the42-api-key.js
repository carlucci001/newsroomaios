#!/usr/bin/env node

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'newsroomaios'
  });
}

const db = admin.firestore();

async function getApiKey() {
  try {
    // Try with 'the42' document ID first
    let doc = await db.collection('tenants').doc('the42').get();

    if (!doc.exists) {
      // If not found, try the full tenant ID
      doc = await db.collection('tenants').doc('tenant_1770138901335_awej6s3mo').get();
    }

    if (!doc.exists) {
      console.log('❌ Tenant not found');
      console.log('Tried: the42 and tenant_1770138901335_awej6s3mo');
      process.exit(1);
    }

    const data = doc.data();
    console.log('\n🔑 the42 API Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tenant ID:', doc.id);
    console.log('Business Name:', data.businessName);
    console.log('API Key:', data.apiKey || '❌ NOT SET');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (data.apiKey) {
      console.log('✅ Ready to use in .env.local:');
      console.log(`TENANT_API_KEY=${data.apiKey}`);
      console.log(`NEXT_PUBLIC_TENANT_ID=${doc.id}`);
    } else {
      console.log('⚠️  WARNING: API key not set for this tenant!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getApiKey();
