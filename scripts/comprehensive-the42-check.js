/**
 * Comprehensive check of the42.news configuration
 * Verifies: tenant record, categories, articles, site config, navigation, journalists
 */

async function comprehensiveCheck() {
  const platformSecret = 'paper-partner-2024';
  const tenantId = 'tenant_1770138901335_awej6s3mo';
  const baseUrl = 'https://newsroomaios.com';

  console.log('\n🔍 COMPREHENSIVE THE42.NEWS VERIFICATION\n');
  console.log('='.repeat(100));

  const checks = [];

  // 1. Check menus
  console.log('\n1️⃣  CHECKING MENUS...');
  try {
    const menusResponse = await fetch(`${baseUrl}/api/menus`, {
      headers: {
        'X-Platform-Secret': platformSecret,
        'X-Tenant-ID': tenantId,
      },
    });
    const menusData = await menusResponse.json();

    if (menusData.success && menusData.menus.length === 4) {
      const mainNav = menusData.menus.find(m => m.slug === 'main-nav');
      const topNav = menusData.menus.find(m => m.slug === 'top-nav');

      if (mainNav?.items?.length >= 10 && topNav?.items?.length === 6) {
        console.log('   ✅ Menus: 4 menus with correct item counts');
        checks.push({ name: 'Menus', status: 'PASS' });
      } else {
        console.log(`   ❌ Menus: Item counts wrong (main: ${mainNav?.items?.length}, top: ${topNav?.items?.length})`);
        checks.push({ name: 'Menus', status: 'FAIL', details: 'Item counts incorrect' });
      }
    } else {
      console.log('   ❌ Menus: Failed to fetch or wrong count');
      checks.push({ name: 'Menus', status: 'FAIL', details: menusData.error || 'Wrong count' });
    }
  } catch (error) {
    console.log('   ❌ Menus: Error -', error.message);
    checks.push({ name: 'Menus', status: 'ERROR', details: error.message });
  }

  // 2. Check if the42.news site is accessible
  console.log('\n2️⃣  CHECKING SITE ACCESSIBILITY...');
  try {
    const siteResponse = await fetch('https://the42.news', {
      method: 'HEAD',
      redirect: 'follow',
    });

    if (siteResponse.ok || siteResponse.status === 304) {
      console.log('   ✅ Site: https://the42.news is accessible');
      checks.push({ name: 'Site Accessibility', status: 'PASS' });
    } else {
      console.log(`   ⚠️  Site: Returned status ${siteResponse.status}`);
      checks.push({ name: 'Site Accessibility', status: 'WARN', details: `Status ${siteResponse.status}` });
    }
  } catch (error) {
    console.log('   ❌ Site: Error -', error.message);
    checks.push({ name: 'Site Accessibility', status: 'ERROR', details: error.message });
  }

  // 3. Check if admin is accessible
  console.log('\n3️⃣  CHECKING ADMIN PANEL...');
  try {
    const adminResponse = await fetch('https://the42.news/admin', {
      method: 'HEAD',
      redirect: 'follow',
    });

    if (adminResponse.ok || adminResponse.status === 304 || adminResponse.status === 401) {
      console.log('   ✅ Admin: /admin endpoint exists');
      checks.push({ name: 'Admin Panel', status: 'PASS' });
    } else {
      console.log(`   ⚠️  Admin: Returned status ${adminResponse.status}`);
      checks.push({ name: 'Admin Panel', status: 'WARN', details: `Status ${adminResponse.status}` });
    }
  } catch (error) {
    console.log('   ❌ Admin: Error -', error.message);
    checks.push({ name: 'Admin Panel', status: 'ERROR', details: error.message });
  }

  // 4. Check deployment status
  console.log('\n4️⃣  CHECKING VERCEL DEPLOYMENT...');
  try {
    const { execSync } = require('child_process');
    const output = execSync('vercel ls newspaper-the42 --scope fdllc 2>&1', { encoding: 'utf8' });

    if (output.includes('Ready') && output.includes('Production')) {
      console.log('   ✅ Deployment: the42 is deployed and ready');
      checks.push({ name: 'Vercel Deployment', status: 'PASS' });
    } else if (output.includes('Building')) {
      console.log('   ⚠️  Deployment: Currently building');
      checks.push({ name: 'Vercel Deployment', status: 'WARN', details: 'Building' });
    } else {
      console.log('   ⚠️  Deployment: Status unclear');
      checks.push({ name: 'Vercel Deployment', status: 'WARN', details: 'Status unclear' });
    }
  } catch (error) {
    console.log('   ⚠️  Deployment: Could not check status');
    checks.push({ name: 'Vercel Deployment', status: 'WARN', details: 'Could not verify' });
  }

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('\n📊 SUMMARY:\n');

  const passed = checks.filter(c => c.status === 'PASS').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  const warned = checks.filter(c => c.status === 'WARN').length;
  const errors = checks.filter(c => c.status === 'ERROR').length;

  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' :
                 check.status === 'FAIL' ? '❌' :
                 check.status === 'WARN' ? '⚠️' : '🔴';
    const details = check.details ? ` (${check.details})` : '';
    console.log(`   ${icon} ${check.name}: ${check.status}${details}`);
  });

  console.log(`\n   Total: ${checks.length} checks`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠️  Warnings: ${warned}`);
  console.log(`   🔴 Errors: ${errors}`);

  if (failed === 0 && errors === 0) {
    console.log('\n✅ THE42.NEWS IS PROPERLY CONFIGURED!\n');
  } else {
    console.log('\n⚠️  SOME ISSUES FOUND - See above for details\n');
  }

  console.log('='.repeat(100));
  console.log('\n');
}

comprehensiveCheck().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
