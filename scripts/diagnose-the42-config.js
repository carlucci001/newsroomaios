#!/usr/bin/env node

/**
 * Diagnose the42.news configuration for Option C
 */

const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
const PROJECT_NAME = 'newspaper-the42';

async function diagnoseConfig() {
  console.log('\n🔍 Diagnosing the42.news configuration for Option C...\n');

  if (!VERCEL_TOKEN) {
    console.log('⚠️  VERCEL_TOKEN not set - cannot check environment variables');
    console.log('Set it with: export VERCEL_API_TOKEN=your_token_here\n');

    console.log('📋 What to check manually in Vercel dashboard:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Go to: https://vercel.com → newspaper-the42 → Settings → Environment Variables');
    console.log('\n✅ Required variables for Option C:');
    console.log('  - PLATFORM_API_URL = https://newsroomaios.com');
    console.log('  - TENANT_API_KEY = [tenant API key]');
    console.log('  - NEXT_PUBLIC_TENANT_ID = the42');
    console.log('\n❌ Should NOT have (old architecture):');
    console.log('  - GEMINI_API_KEY');
    console.log('  - PERPLEXITY_API_KEY');
    console.log('  - PEXELS_API_KEY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }

  // Check environment variables via Vercel API
  console.log('Fetching environment variables from Vercel...\n');

  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${PROJECT_NAME}/env`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.log(`❌ Failed to fetch env vars: ${res.statusCode}`);
          console.log(data);
          resolve();
          return;
        }

        try {
          const response = JSON.parse(data);
          const envs = response.envs || [];

          console.log('📋 Environment Variables Status:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          // Check for required Option C variables
          const requiredVars = [
            'PLATFORM_API_URL',
            'TENANT_API_KEY',
            'NEXT_PUBLIC_TENANT_ID'
          ];

          const oldVars = [
            'GEMINI_API_KEY',
            'PERPLEXITY_API_KEY',
            'PEXELS_API_KEY'
          ];

          console.log('\n✅ Option C Required Variables:');
          requiredVars.forEach(varName => {
            const found = envs.find(e => e.key === varName);
            if (found) {
              console.log(`  ✓ ${varName}: SET`);
            } else {
              console.log(`  ✗ ${varName}: MISSING ⚠️`);
            }
          });

          console.log('\n❌ Old Architecture Variables (should be removed):');
          oldVars.forEach(varName => {
            const found = envs.find(e => e.key === varName);
            if (found) {
              console.log(`  ⚠️  ${varName}: STILL PRESENT (should be removed)`);
            } else {
              console.log(`  ✓ ${varName}: Not present (good)`);
            }
          });

          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          const hasRequired = requiredVars.every(v => envs.find(e => e.key === v));
          const hasOld = oldVars.some(v => envs.find(e => e.key === v));

          if (hasRequired && !hasOld) {
            console.log('\n✅ Configuration looks good for Option C!');
            console.log('the42.news should be able to call platform API.');
          } else if (!hasRequired) {
            console.log('\n⚠️  MISSING REQUIRED VARIABLES');
            console.log('Run: node scripts/set-the42-option-c-env-vars.js');
          } else if (hasOld) {
            console.log('\n⚠️  OLD VARIABLES STILL PRESENT');
            console.log('Remove them manually in Vercel dashboard or they will override platform API.');
          }

          console.log('');
          resolve();
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve();
    });

    req.end();
  });
}

diagnoseConfig()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
