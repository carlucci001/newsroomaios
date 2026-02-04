/**
 * Link user to a tenant
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

async function linkUserToTenant() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = process.argv[2] || 'carlfarring@gmail.com';
  const password = process.argv[3] || 'Daisy2684';

  console.log(`\nChecking user: ${email}\n`);

  try {
    // Sign in to get the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log(`✅ User authenticated: ${user.uid}`);

    // Check if user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`\n✅ User document exists`);
      console.log(`   Tenant ID: ${userData.tenantId}`);
      console.log(`   Role: ${userData.role}`);

      if (userData.tenantId) {
        const tenantDoc = await getDoc(doc(db, 'tenants', userData.tenantId));
        if (tenantDoc.exists()) {
          console.log(`   Tenant: ${tenantDoc.data().businessName}`);
          console.log(`\n✅ All set! You can log in.`);
        } else {
          console.log(`\n⚠️ Tenant not found, linking to first available tenant...`);
          await linkToFirstTenant(db, user.uid, email);
        }
      } else {
        console.log(`\n⚠️ No tenant linked, linking to first available tenant...`);
        await linkToFirstTenant(db, user.uid, email);
      }
    } else {
      console.log(`\n⚠️ User document doesn't exist, creating and linking...`);
      await linkToFirstTenant(db, user.uid, email);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

async function linkToFirstTenant(db: any, userId: string, email: string) {
  const tenantsRef = collection(db, 'tenants');
  const tenantsQuery = query(tenantsRef, limit(10));
  const tenantsSnapshot = await getDocs(tenantsQuery);

  if (!tenantsSnapshot.empty) {
    console.log('\nAvailable tenants:');
    tenantsSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`${idx + 1}. ${data.businessName} (${doc.id})`);
    });

    const firstTenant = tenantsSnapshot.docs[0];
    const tenantId = firstTenant.id;

    // Create/update user document
    await setDoc(doc(db, 'users', userId), {
      email: email,
      tenantId: tenantId,
      role: 'owner',
      createdAt: new Date(),
    }, { merge: true });

    console.log(`\n✅ Linked to tenant: ${firstTenant.data().businessName}`);
    console.log(`\nYou can now log in at: https://www.newsroomaios.com/account/login`);
  } else {
    console.log('\n⚠️ No tenants found in database');
  }
}

linkUserToTenant();
