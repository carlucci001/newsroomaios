/**
 * Complete verification of the42.news menu configuration
 * Shows exactly what the42 is receiving from the platform API
 */

async function verifyMenus() {
  // Use platform secret for internal testing
  const platformSecret = 'paper-partner-2024';
  const tenantId = 'tenant_1770138901335_awej6s3mo';

  console.log('\n🔍 COMPLETE MENU VERIFICATION FOR THE42.NEWS\n');
  console.log('=' .repeat(80));

  try {
    // Call platform menu API with platform secret
    const response = await fetch('https://newsroomaios.com/api/menus', {
      method: 'GET',
      headers: {
        'X-Platform-Secret': platformSecret,
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ API Error:', error);
      console.error('Status:', response.status);
      process.exit(1);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Error:', data.error);
      process.exit(1);
    }

    console.log(`\n✅ Successfully fetched ${data.menus.length} menus`);
    if (data.initialized) {
      console.log('🆕 Menus were JUST initialized (fresh from categories!)');
    }
    console.log('\n' + '=' .repeat(80));

    // Expected items for each menu
    const expected = {
      'main-nav': ['Home', 'Categories (6)', 'Directory', 'Blog', 'Community'],
      'top-nav': ['Home', 'Advertise', 'Directory', 'Community', 'Contact', 'Blog'],
      'footer-quick-links': ['About Us', 'Contact', 'Advertise', 'Directory', 'Blog', 'Community'],
      'footer-categories': ['Categories (6)'],
    };

    // Analyze each menu
    let allCorrect = true;

    for (const menu of data.menus) {
      console.log(`\n📋 ${menu.name.toUpperCase()} (${menu.slug})`);
      console.log('-'.repeat(80));

      const items = menu.items || [];
      console.log(`   Total items: ${items.length}`);

      if (items.length === 0) {
        console.log('   ❌ NO ITEMS - EMPTY MENU!');
        allCorrect = false;
      } else {
        console.log('   Items:');
        items.forEach((item, idx) => {
          console.log(`      ${idx + 1}. ${item.label} → ${item.path}`);
        });
      }

      // Check against expected
      const exp = expected[menu.slug];
      if (exp) {
        console.log(`\n   Expected: ${exp.join(', ')}`);
        if (menu.slug === 'main-nav' || menu.slug === 'footer-categories') {
          // These should have categories
          const categoryCount = items.filter(i => i.path?.includes('/category/')).length;
          if (categoryCount < 6) {
            console.log(`   ❌ Missing categories! Found ${categoryCount}, expected 6`);
            allCorrect = false;
          } else {
            console.log(`   ✅ Has ${categoryCount} category links`);
          }
        }

        // Check for required standard pages
        const standardPages = ['Directory', 'Blog', 'Community'];
        for (const page of standardPages) {
          const hasPage = items.some(i => i.label === page);
          if (!hasPage && exp.some(e => e.includes(page))) {
            console.log(`   ❌ Missing: ${page}`);
            allCorrect = false;
          }
        }
      }
    }

    console.log('\n' + '=' .repeat(80));

    if (allCorrect) {
      console.log('\n✅ ALL MENUS LOOK CORRECT!\n');
    } else {
      console.log('\n❌ MENUS HAVE ISSUES - See above for details\n');
      console.log('🔧 To fix: Delete menus in Firestore and they will regenerate on next access\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

verifyMenus();
