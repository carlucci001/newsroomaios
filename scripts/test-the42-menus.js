/**
 * Test the42.news menu API to see what menus are returned
 */

async function testMenus() {
  const tenantId = 'tenant_1770138901335_awej6s3mo'; // the42.news
  const apiKey = 'the42-1738138901335-5xowdw'; // the42 API key

  console.log('\n🔍 Testing the42.news menu API...\n');

  try {
    const response = await fetch('https://newsroomaios.com/api/menus', {
      method: 'GET',
      headers: {
        'X-Tenant-ID': tenantId,
        'X-API-Key': apiKey,
      },
    });

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Error:', data.error);
      process.exit(1);
    }

    console.log(`✅ Found ${data.menus.length} menus`);
    if (data.initialized) {
      console.log('🆕 Menus were just initialized with tenant categories!');
    }

    console.log('\n📋 MENUS:\n');

    data.menus.forEach(menu => {
      console.log(`\n${menu.name} (${menu.slug}):`);
      console.log(`  Items: ${menu.items?.length || 0}`);
      if (menu.items && menu.items.length > 0) {
        menu.items.forEach(item => {
          console.log(`    - ${item.label} → ${item.path}`);
        });
      }
    });

    console.log('\n');
  } catch (error) {
    console.error('❌ Failed to test menus:', error.message);
    process.exit(1);
  }
}

testMenus();
