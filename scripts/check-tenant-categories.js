const admin = require('firebase-admin');
const fs = require('fs');

async function getServiceAccount() {
  const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
  const tokenLine = envLines.find(l => l.startsWith('VERCEL_API_TOKEN='));
  const token = tokenLine.split('=')[1].replace(/"/g, '').trim();
  const teamId = 'team_xDwP9PG9cTJSbrjfQGexCNbW';
  const projId = 'prj_X0z7d1Gx03lBLhTyYZ4au2x9uLMG';
  const r = await fetch(`https://api.vercel.com/v9/projects/${projId}/env?teamId=${teamId}&decrypt=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const d = await r.json();
  return JSON.parse(d.envs.find(e => e.key === 'FIREBASE_SERVICE_ACCOUNT').value);
}

async function main() {
  const sa = await getServiceAccount();
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  const db = admin.firestore();

  const tenantsSnap = await db.collection('tenants').get();
  console.log(`\n=== TENANT CATEGORIES AUDIT ===\n`);
  console.log(`Found ${tenantsSnap.size} tenants\n`);

  for (const tenantDoc of tenantsSnap.docs) {
    const tenant = tenantDoc.data();
    const tenantId = tenantDoc.id;

    console.log(`--- ${tenant.businessName || tenantId} (${tenantId}) ---`);

    // Categories array on tenant doc (what was selected during onboarding)
    const docCategories = tenant.categories || [];
    console.log(`  Selected during onboarding: [${docCategories.map(c => c.name || c.slug).join(', ')}]`);

    // Categories subcollection (what the tenant site actually reads)
    const catSnap = await db.collection(`tenants/${tenantId}/categories`).get();
    if (catSnap.empty) {
      console.log(`  Categories subcollection: EMPTY`);
    } else {
      const catNames = catSnap.docs.map(d => {
        const data = d.data();
        return `${data.name} (slug=${data.slug}, active=${data.isActive}, order=${data.sortOrder})`;
      });
      console.log(`  Categories subcollection (${catSnap.size}):`);
      catNames.forEach(n => console.log(`    - ${n}`));
    }

    // Check if they MATCH
    const onboardingNames = new Set(docCategories.map(c => (c.name || '').toLowerCase()));
    const subcollNames = new Set(catSnap.docs.map(d => (d.data().name || '').toLowerCase()));
    const match = onboardingNames.size === subcollNames.size &&
      [...onboardingNames].every(n => subcollNames.has(n));
    if (!match && docCategories.length > 0) {
      console.log(`  *** MISMATCH between onboarding selections and subcollection ***`);
    }

    console.log('');
  }

  // Root-level categories
  console.log(`\n--- ROOT-LEVEL 'categories' collection ---`);
  const rootCatSnap = await db.collection('categories').get();
  if (rootCatSnap.empty) {
    console.log(`  (empty)`);
  } else {
    console.log(`  Found ${rootCatSnap.size} root categories:`);
    rootCatSnap.docs.forEach(d => {
      const data = d.data();
      console.log(`    - ${data.name} (slug=${data.slug}, id=${d.id})`);
    });
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
