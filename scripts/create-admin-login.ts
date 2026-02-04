/**
 * Create admin login for customer portal
 */

import { getAdminAuth, getAdminDb } from '../src/lib/firebaseAdmin';

async function createAdminLogin() {
  const auth = getAdminAuth();
  const db = getAdminDb();

  if (!auth || !db) {
    console.error('❌ Firebase Admin not configured');
    return;
  }

  // Admin email - you can change this
  const adminEmail = process.argv[2] || 'admin@newsroomaios.com';
  const adminPassword = process.argv[3] || 'admin123456';

  console.log('Creating admin login...\n');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}\n`);

  try {
    // Check if user already exists
    let user;
    try {
      user = await auth.getUserByEmail(adminEmail);
      console.log('✅ User already exists:', user.uid);
    } catch (err) {
      // Create new user
      user = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        emailVerified: true,
      });
      console.log('✅ Created new user:', user.uid);
    }

    // Find admin's tenant (look for your main tenant)
    const tenantsSnapshot = await db.collection('tenants').limit(10).get();

    console.log('\nAvailable tenants:');
    tenantsSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`${idx + 1}. ${data.businessName} (${doc.id}) - ${data.ownerEmail}`);
    });

    // If there's a tenant, link the user to the first one
    if (!tenantsSnapshot.empty) {
      const firstTenant = tenantsSnapshot.docs[0];
      const tenantId = firstTenant.id;

      // Create/update user document
      await db.collection('users').doc(user.uid).set({
        email: adminEmail,
        tenantId: tenantId,
        role: 'owner',
        createdAt: new Date(),
      }, { merge: true });

      console.log(`\n✅ Linked user to tenant: ${firstTenant.data().businessName}`);
      console.log(`\nYou can now log in at: https://www.newsroomaios.com/account/login`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log('\n⚠️ No tenants found. User created but not linked to any tenant.');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

createAdminLogin();
