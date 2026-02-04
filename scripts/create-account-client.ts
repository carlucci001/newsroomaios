/**
 * Create customer account using Firebase client SDK
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

async function createAccount() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = process.argv[2] || 'carlfarring@gmail.com';
  const password = process.argv[3] || 'Daisy2684';

  console.log(`\nCreating account for: ${email}\n`);

  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log(`✅ User created: ${user.uid}`);

    // Find first tenant to link to
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

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        tenantId: tenantId,
        role: 'owner',
        createdAt: new Date(),
      });

      console.log(`\n✅ Linked to tenant: ${firstTenant.data().businessName}`);
      console.log(`\nLogin at: https://www.newsroomaios.com/account/login`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    } else {
      console.log('\n⚠️ No tenants found');
    }

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('✅ Account already exists for this email');
      console.log(`\nYou can log in at: https://www.newsroomaios.com/account/login`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  process.exit(0);
}

createAccount();
