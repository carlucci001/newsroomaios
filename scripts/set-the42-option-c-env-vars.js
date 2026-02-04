#!/usr/bin/env node

/**
 * Set environment variables for the42 Vercel project (Option C architecture)
 * This updates the42 to use centralized platform API instead of direct Gemini calls
 */

const https = require('https');
const admin = require('firebase-admin');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
const PROJECT_NAME = 'newspaper-the42'; // Note: was 'the42-newspaper' in old script

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'newsroomaios'
  });
}

const db = admin.firestore();

async function getThe42Data() {
  try {
    const tenantDoc = await db.collection('tenants').doc('the42').get();

    if (!tenantDoc.exists) {
      console.error('❌ the42 tenant not found in database');
      process.exit(1);
    }

    const tenant = tenantDoc.data();

    if (!tenant.apiKey) {
      console.error('❌ the42 tenant has no apiKey field');
      console.log('This is required for Option C architecture');
      process.exit(1);
    }

    console.log('✅ Retrieved the42 tenant data from Firestore');
    console.log(`- Tenant ID: ${tenantDoc.id}`);
    console.log(`- Business Name: ${tenant.businessName}`);
    console.log(`- API Key: ${tenant.apiKey.substring(0, 15)}...`);

    return {
      tenantId: tenantDoc.id,
      apiKey: tenant.apiKey,
      ...tenant
    };
  } catch (error) {
    console.error('❌ Error fetching tenant data:', error.message);
    process.exit(1);
  }
}

async function setEnvVars() {
  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN or VERCEL_API_TOKEN not set');
    console.log('Set it in your environment or run: vercel env pull');
    process.exit(1);
  }

  console.log('\n🔧 Updating the42 environment variables for Option C...\n');

  // Get tenant data from Firestore
  const tenantData = await getThe42Data();

  // NEW: Option C environment variables
  const envVars = [
    // Platform connection (OPTION C: Centralized API)
    { key: 'PLATFORM_API_URL', value: process.env.NEXT_PUBLIC_BASE_URL || 'https://newsroomaios.com' },
    { key: 'TENANT_API_KEY', value: tenantData.apiKey },

    // Tenant identification
    { key: 'TENANT_ID', value: tenantData.tenantId },
    { key: 'NEXT_PUBLIC_TENANT_ID', value: tenantData.tenantId },

    // Site configuration
    { key: 'NEXT_PUBLIC_SITE_NAME', value: tenantData.businessName || 'The 42' },
    { key: 'NEXT_PUBLIC_SERVICE_AREA_CITY', value: tenantData.serviceArea?.city || 'Cincinnati' },
    { key: 'NEXT_PUBLIC_SERVICE_AREA_STATE', value: tenantData.serviceArea?.state || 'Ohio' },

    // Firebase Client SDK (same as platform)
    { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
    { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN },
    { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
    { key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET },
    { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID },
    { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID },

    // Firebase Admin SDK (for server-side)
    { key: 'FIREBASE_ADMIN_PROJECT_ID', value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
    { key: 'FIREBASE_ADMIN_CLIENT_EMAIL', value: process.env.FIREBASE_ADMIN_CLIENT_EMAIL },
    { key: 'FIREBASE_ADMIN_PRIVATE_KEY', value: process.env.FIREBASE_ADMIN_PRIVATE_KEY },

    // Platform secret (for internal calls)
    { key: 'PLATFORM_SECRET', value: process.env.PLATFORM_SECRET },
  ];

  console.log('📝 Environment variables to set:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  envVars.forEach(v => {
    const displayValue = v.value ? (v.value.length > 30 ? `${v.value.substring(0, 30)}...` : v.value) : '❌ MISSING';
    console.log(`  ${v.key}: ${displayValue}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const envVar of envVars) {
    if (!envVar.value) {
      console.log(`⚠️  Skipping ${envVar.key} - no value set`);
      continue;
    }

    try {
      const data = JSON.stringify({
        key: envVar.key,
        value: envVar.value,
        type: 'encrypted',
        target: ['production', 'preview', 'development']
      });

      const options = {
        hostname: 'api.vercel.com',
        path: `/v10/projects/${PROJECT_NAME}/env`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`✅ Set ${envVar.key}`);
              resolve();
            } else if (res.statusCode === 409) {
              console.log(`ℹ️  ${envVar.key} already exists (use Vercel dashboard to update)`);
              resolve();
            } else {
              console.log(`❌ Failed to set ${envVar.key}: ${responseData}`);
              resolve(); // Continue with other vars
            }
          });
        });

        req.on('error', (error) => {
          console.error(`❌ Error setting ${envVar.key}:`, error.message);
          resolve(); // Continue with other vars
        });

        req.write(data);
        req.end();
      });

    } catch (error) {
      console.error(`❌ Error with ${envVar.key}:`, error.message);
    }
  }

  console.log('\n✅ Environment variables updated for Option C!');
  console.log('\n📝 Next steps:');
  console.log('1. Trigger a redeploy: node scripts/redeploy-the42.js');
  console.log('2. Test article creation on the42.news/admin');
  console.log('3. Verify platform API receives requests\n');
}

setEnvVars()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
