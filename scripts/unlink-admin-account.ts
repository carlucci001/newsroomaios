/**
 * Unlink admin account from tenant - make it a platform admin
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

async function unlinkAdmin() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = 'carlfarring@gmail.com';
  const password = 'Daisy2684';

  console.log(`\nUnlinking admin account: ${email}\n`);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log(`✅ User authenticated: ${user.uid}`);

    // Update user document - remove tenant linkage, make platform admin
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: 'platform_admin',
      isPlatformAdmin: true,
      createdAt: new Date(),
    }, { merge: false }); // merge: false = replace entire document

    console.log(`\n✅ Account updated to platform admin (no tenant linkage)`);
    console.log(`\nNote: You'll need to update the customer portal to support platform admin access.`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

unlinkAdmin();
