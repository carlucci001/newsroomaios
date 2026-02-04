#!/usr/bin/env node

/**
 * Set environment variables for the42 Vercel project
 */

const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
const PROJECT_NAME = 'the42-newspaper';

const envVars = [
  { key: 'NEXT_PUBLIC_TENANT_ID', value: 'the42' },
  { key: 'NEXT_PUBLIC_SITE_NAME', value: 'The 42' },
  { key: 'NEXT_PUBLIC_SERVICE_AREA_CITY', value: 'Cincinnati' },
  { key: 'NEXT_PUBLIC_SERVICE_AREA_STATE', value: 'Ohio' },
  { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
  { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN },
  { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
  { key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET },
  { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID },
  { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID },
];

async function setEnvVars() {
  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN or VERCEL_API_TOKEN not set');
    console.log('Run: vercel env pull to get your token');
    process.exit(1);
  }

  console.log(`Setting environment variables for project: ${PROJECT_NAME}\n`);

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

  console.log('\n✅ Environment variables set!');
  console.log('\nNext step: Trigger a redeploy in Vercel dashboard');
  console.log('Or run: vercel --prod');
}

setEnvVars()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
