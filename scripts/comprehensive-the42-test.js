/**
 * Comprehensive test of the42.news
 * Tests all components for:
 * 1. Functionality
 * 2. WNC Times references (should be ZERO)
 * 3. Location-specific content (should be Cincinnati/Hamilton County)
 */

const TENANT_ID = 'tenant_1770138901335_awej6s3mo';
const BASE_URL = 'https://the42.news';

async function comprehensiveTest() {
  console.log('\n🧪 COMPREHENSIVE THE42.NEWS SYSTEM TEST\n');
  console.log('='.repeat(100));

  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  // Test 1: Homepage loads
  console.log('\n1️⃣  TESTING HOMEPAGE...');
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      const html = await response.text();

      // Check for WNC Times references
      const wncReferences = [
        'WNC Times',
        'wnctimes',
        'Western North Carolina',
        'Asheville',
        'Buncombe County',
      ];

      const foundBadRefs = wncReferences.filter(ref =>
        html.toLowerCase().includes(ref.toLowerCase())
      );

      if (foundBadRefs.length > 0) {
        results.failed.push({
          test: 'Homepage - WNC Times References',
          details: `Found references to: ${foundBadRefs.join(', ')}`,
        });
      } else {
        results.passed.push('Homepage - No WNC Times references');
      }

      // Check for Cincinnati references
      const cincinnatiRefs = ['Cincinnati', 'Hamilton County'];
      const hasCincinnati = cincinnatiRefs.some(ref =>
        html.toLowerCase().includes(ref.toLowerCase())
      );

      if (!hasCincinnati) {
        results.warnings.push('Homepage - No Cincinnati/Hamilton County references found');
      } else {
        results.passed.push('Homepage - Has Cincinnati/Hamilton County references');
      }

      results.passed.push('Homepage - Loads successfully');
    } else {
      results.failed.push({
        test: 'Homepage',
        details: `Failed to load (status ${response.status})`,
      });
    }
  } catch (error) {
    results.failed.push({
      test: 'Homepage',
      details: error.message,
    });
  }

  // Test 2: Advertising page
  console.log('\n2️⃣  TESTING ADVERTISING PAGE...');
  try {
    const response = await fetch(`${BASE_URL}/advertise`);
    if (response.ok) {
      const html = await response.text();

      // Check for WNC Times references
      if (html.toLowerCase().includes('wnc times') || html.toLowerCase().includes('asheville')) {
        results.failed.push({
          test: 'Advertising - WNC Times References',
          details: 'Found WNC Times or Asheville references',
        });
      } else {
        results.passed.push('Advertising - No WNC Times references');
      }

      // Check for Cincinnati
      if (html.toLowerCase().includes('cincinnati') || html.toLowerCase().includes('hamilton county')) {
        results.passed.push('Advertising - Has Cincinnati/Hamilton County context');
      } else {
        results.warnings.push('Advertising - Should mention Cincinnati/Hamilton County');
      }

      results.passed.push('Advertising - Page loads');
    } else {
      results.failed.push({
        test: 'Advertising',
        details: `Failed to load (status ${response.status})`,
      });
    }
  } catch (error) {
    results.failed.push({
      test: 'Advertising',
      details: error.message,
    });
  }

  // Test 3: Directory page
  console.log('\n3️⃣  TESTING DIRECTORY PAGE...');
  try {
    const response = await fetch(`${BASE_URL}/directory`);
    if (response.ok) {
      const html = await response.text();

      // Check for WNC Times references
      if (html.toLowerCase().includes('wnc times') || html.toLowerCase().includes('asheville')) {
        results.failed.push({
          test: 'Directory - WNC Times References',
          details: 'Found WNC Times or Asheville references',
        });
      } else {
        results.passed.push('Directory - No WNC Times references');
      }

      // Check for Cincinnati
      if (html.toLowerCase().includes('cincinnati') || html.toLowerCase().includes('hamilton')) {
        results.passed.push('Directory - Has Cincinnati context');
      } else {
        results.warnings.push('Directory - Should be focused on Cincinnati area');
      }

      results.passed.push('Directory - Page loads');
    } else {
      results.failed.push({
        test: 'Directory',
        details: `Failed to load (status ${response.status})`,
      });
    }
  } catch (error) {
    results.failed.push({
      test: 'Directory',
      details: error.message,
    });
  }

  // Test 4: Community page
  console.log('\n4️⃣  TESTING COMMUNITY PAGE...');
  try {
    const response = await fetch(`${BASE_URL}/community`);
    if (response.ok) {
      const html = await response.text();

      // Check for WNC Times references
      if (html.toLowerCase().includes('wnc times') || html.toLowerCase().includes('asheville')) {
        results.failed.push({
          test: 'Community - WNC Times References',
          details: 'Found WNC Times or Asheville references',
        });
      } else {
        results.passed.push('Community - No WNC Times references');
      }

      // Check for maps/location data
      if (html.includes('google.com/maps') || html.includes('latitude') || html.includes('longitude')) {
        results.passed.push('Community - Has map functionality');
      } else {
        results.warnings.push('Community - No map found');
      }

      results.passed.push('Community - Page loads');
    } else {
      results.failed.push({
        test: 'Community',
        details: `Failed to load (status ${response.status})`,
      });
    }
  } catch (error) {
    results.failed.push({
      test: 'Community',
      details: error.message,
    });
  }

  // Test 5: Blog page
  console.log('\n5️⃣  TESTING BLOG PAGE...');
  try {
    const response = await fetch(`${BASE_URL}/blog`);
    if (response.ok) {
      const html = await response.text();

      // Check for WNC Times references
      if (html.toLowerCase().includes('wnc times')) {
        results.failed.push({
          test: 'Blog - WNC Times References',
          details: 'Found WNC Times references',
        });
      } else {
        results.passed.push('Blog - No WNC Times references');
      }

      results.passed.push('Blog - Page loads');
    } else {
      results.failed.push({
        test: 'Blog',
        details: `Failed to load (status ${response.status})`,
      });
    }
  } catch (error) {
    results.failed.push({
      test: 'Blog',
      details: error.message,
    });
  }

  // Test 6: Category pages (check articles)
  console.log('\n6️⃣  TESTING CATEGORY PAGES & ARTICLES...');
  const categories = ['local-news', 'politics', 'crime', 'business', 'agriculture', 'college-sports'];

  for (const cat of categories) {
    try {
      const response = await fetch(`${BASE_URL}/category/${cat}`);
      if (response.ok) {
        const html = await response.text();

        // Check for articles
        if (html.includes('article') || html.includes('headline')) {
          results.passed.push(`Category ${cat} - Has articles`);
        } else {
          results.warnings.push(`Category ${cat} - No articles found`);
        }

        // Check for WNC Times
        if (html.toLowerCase().includes('wnc times') || html.toLowerCase().includes('asheville')) {
          results.failed.push({
            test: `Category ${cat}`,
            details: 'Contains WNC Times references',
          });
        }
      }
    } catch (error) {
      results.warnings.push(`Category ${cat} - Could not test: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('\n📊 TEST RESULTS SUMMARY\n');

  console.log(`✅ PASSED: ${results.passed.length}`);
  results.passed.forEach(p => console.log(`   ✓ ${p}`));

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS: ${results.warnings.length}`);
    results.warnings.forEach(w => console.log(`   ⚠ ${w}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED: ${results.failed.length}`);
    results.failed.forEach(f => {
      console.log(`   ✗ ${f.test || f}`);
      if (f.details) console.log(`     ${f.details}`);
    });
  }

  console.log('\n' + '='.repeat(100));

  if (results.failed.length === 0) {
    console.log('\n🎉 ALL CRITICAL TESTS PASSED!\n');
    if (results.warnings.length > 0) {
      console.log('⚠️  Address warnings before demo\n');
    }
  } else {
    console.log('\n🚨 CRITICAL ISSUES FOUND - MUST FIX BEFORE DEMO\n');
    process.exit(1);
  }
}

comprehensiveTest().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
