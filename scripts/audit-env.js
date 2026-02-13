#!/usr/bin/env node

/**
 * Vercel Environment Variable Auditor
 *
 * Pulls env vars from Vercel, checks for trailing whitespace/newlines,
 * and optionally fixes them.
 *
 * Usage:
 *   node scripts/audit-env.js                  # Audit only (report)
 *   node scripts/audit-env.js --fix            # Audit + fix bad values
 *   node scripts/audit-env.js --environment preview   # Check preview env
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const envFlag = args.find((a, i) => args[i - 1] === '--environment') || 'production';

const TMP_FILE = path.join(__dirname, '..', '.env.audit-tmp');

// Keys where embedded newlines are expected (e.g., PEM private keys in JSON)
const SKIP_KEYS = new Set([
  'FIREBASE_SERVICE_ACCOUNT',
  'VERCEL_OIDC_TOKEN',
]);

// Keys that must be valid URLs (no whitespace allowed)
const URL_KEYS = new Set([
  'NEXT_PUBLIC_BASE_URL',
  'PLATFORM_API_URL',
  'WNCT_GIT_REPO_URL',
]);

// Keys where trailing whitespace breaks functionality
const CRITICAL_KEYS = new Set([
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_CONNECT_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'PERPLEXITY_API_KEY',
  'PEXELS_API_KEY',
  'ELEVENLABS_API_KEY',
  'RESEND_API_KEY',
  'GODADDY_API_KEY',
  'GODADDY_API_SECRET',
  'VERCEL_API_TOKEN',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'NEXT_PUBLIC_BASE_URL',
  'PLATFORM_API_URL',
  'PLATFORM_SECRET',
  'NEXT_PUBLIC_PLATFORM_SECRET',
  'NEXT_PUBLIC_PLATFORM_ADMIN_EMAIL',
]);

function pullEnvVars() {
  console.log(`\nPulling ${envFlag} env vars from Vercel...\n`);
  try {
    execSync(`npx vercel env pull "${TMP_FILE}" --environment ${envFlag}`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
    });
  } catch (err) {
    console.error('Failed to pull env vars. Make sure you are logged in to Vercel CLI.');
    console.error(err.message);
    process.exit(1);
  }
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};

  for (const line of content.split('\n')) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;

    const eqIndex = line.indexOf('=');
    const key = line.substring(0, eqIndex).trim();
    let value = line.substring(eqIndex + 1);

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

function auditVars(vars) {
  const issues = [];

  for (const [key, value] of Object.entries(vars)) {
    if (SKIP_KEYS.has(key)) continue;
    if (!value) continue;

    // Check for actual whitespace
    const trimmed = value.trim();
    const hasWhitespace = value !== trimmed;

    // Check for literal escape sequences (how vercel env pull serializes newlines)
    const hasLiteralNewline = /\\[rn]$/.test(value) || /\\r\\n$/.test(value);

    if (hasWhitespace || hasLiteralNewline) {
      let cleanValue = trimmed;
      let trailing = '';

      if (hasLiteralNewline) {
        // Strip literal \n, \r\n, \r from end
        cleanValue = value.replace(/\\r\\n$|\\n$|\\r$/, '');
        trailing = value.substring(cleanValue.length);
      } else {
        const trailingChars = value.substring(trimmed.length);
        trailing = trailingChars
          .replace(/\r/g, '\\r')
          .replace(/\n/g, '\\n')
          .replace(/ /g, '(space)');
        cleanValue = trimmed;
      }

      const isCritical = CRITICAL_KEYS.has(key);
      const isUrl = URL_KEYS.has(key);

      issues.push({
        key,
        value,
        trimmed: cleanValue,
        trailing,
        critical: isCritical,
        url: isUrl,
        severity: isCritical ? 'CRITICAL' : 'warning',
      });
    }
  }

  return issues;
}

function printReport(issues) {
  if (issues.length === 0) {
    console.log('All env vars are clean. No trailing whitespace or newlines found.\n');
    return;
  }

  const critical = issues.filter(i => i.critical);
  const warnings = issues.filter(i => !i.critical);

  console.log(`Found ${issues.length} env var(s) with trailing whitespace/newlines:\n`);

  if (critical.length > 0) {
    console.log('--- CRITICAL (will break API calls / URLs) ---');
    for (const issue of critical) {
      const preview = issue.trimmed.length > 30
        ? issue.trimmed.substring(0, 30) + '...'
        : issue.trimmed;
      console.log(`  ${issue.severity}  ${issue.key}`);
      console.log(`           Value: "${preview}" + trailing: ${issue.trailing}`);
      if (issue.url) {
        console.log(`           This is a URL key — trailing chars make URLs invalid for Stripe/APIs`);
      }
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('--- Warnings (may cause subtle issues) ---');
    for (const issue of warnings) {
      const preview = issue.trimmed.length > 30
        ? issue.trimmed.substring(0, 30) + '...'
        : issue.trimmed;
      console.log(`  ${issue.severity}  ${issue.key}`);
      console.log(`           Value: "${preview}" + trailing: ${issue.trailing}`);
    }
    console.log('');
  }
}

function fixIssues(issues) {
  console.log(`Fixing ${issues.length} env var(s)...\n`);

  let fixed = 0;
  let failed = 0;

  for (const issue of issues) {
    try {
      // Remove the bad value
      execSync(`npx vercel env rm ${issue.key} ${envFlag} -y`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
      });

      // Re-add with trimmed value (pipe to avoid shell interpretation)
      execSync(`npx vercel env add ${issue.key} ${envFlag}`, {
        input: issue.trimmed,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
      });

      console.log(`  FIXED  ${issue.key}`);
      fixed++;
    } catch (err) {
      console.error(`  FAILED ${issue.key}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${fixed} fixed, ${failed} failed`);

  if (fixed > 0) {
    console.log('\nIMPORTANT: You need to redeploy for the fixes to take effect.');
    console.log('The next git push will trigger a new deployment automatically.');
  }
}

function cleanup() {
  try {
    fs.unlinkSync(TMP_FILE);
  } catch {}
}

// --- Main ---
async function main() {
  console.log('=== Vercel Env Var Auditor ===');
  console.log(`Environment: ${envFlag}`);
  console.log(`Mode: ${shouldFix ? 'AUDIT + FIX' : 'AUDIT ONLY'}`);

  pullEnvVars();

  const vars = parseEnvFile(TMP_FILE);
  const totalVars = Object.keys(vars).length;
  console.log(`Found ${totalVars} env vars in ${envFlag}\n`);

  const issues = auditVars(vars);
  printReport(issues);

  if (shouldFix && issues.length > 0) {
    fixIssues(issues);
  } else if (issues.length > 0 && !shouldFix) {
    console.log('Run with --fix to auto-repair these values:');
    console.log(`  node scripts/audit-env.js --fix\n`);
  }

  cleanup();
}

main().catch(err => {
  console.error('Audit failed:', err.message);
  cleanup();
  process.exit(1);
});
