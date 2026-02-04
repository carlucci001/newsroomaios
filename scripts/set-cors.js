#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'gen-lang-client-0242565142.firebasestorage.app';
const CORS_FILE = path.join(__dirname, '..', 'firebase-storage-cors.json');

console.log('Setting CORS configuration for Firebase Storage...\n');
console.log(`Bucket: ${BUCKET_NAME}`);
console.log(`CORS config: ${CORS_FILE}\n`);

// Try to find gsutil
const gsutilCommands = [
  'gsutil',
  'gcloud storage buckets update',
  '"C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gsutil.cmd"',
  '%LOCALAPPDATA%\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gsutil.cmd'
];

async function tryCommand(cmd) {
  return new Promise((resolve) => {
    exec(`${cmd} cors set ${CORS_FILE} gs://${BUCKET_NAME}`, (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        console.log('✅ CORS configuration updated successfully!');
        console.log(stdout);
        resolve(true);
      }
    });
  });
}

async function setCORS() {
  for (const cmd of gsutilCommands) {
    console.log(`Trying: ${cmd}...`);
    const success = await tryCommand(cmd);
    if (success) {
      return;
    }
  }

  console.error('\n❌ Could not find gsutil or gcloud command.');
  console.error('\nPlease install Google Cloud SDK:');
  console.error('https://cloud.google.com/sdk/docs/install\n');
  console.error('Or run this command manually after installing:');
  console.error(`gsutil cors set ${CORS_FILE} gs://${BUCKET_NAME}`);
}

setCORS();
