/**
 * Create Firebase Auth user
 */
const admin = require('firebase-admin');

// Initialize with service account from environment
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT environment variable not set');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'newsroomasios'
  });
}

async function createUser() {
  const email = 'carlfarring@gmail.com';
  const password = 'Daisy2684';

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
      displayName: 'Carl Farrington'
    });
    console.log('User created successfully!');
    console.log('UID:', user.uid);
    console.log('Email:', user.email);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists. Updating password...');
      try {
        const existingUser = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(existingUser.uid, {
          password
        });
        console.log('Password updated successfully!');
        console.log('UID:', existingUser.uid);
      } catch (updateError) {
        console.error('Failed to update password:', updateError.message);
      }
    } else {
      console.error('Error creating user:', error.message);
    }
  }
  process.exit(0);
}

createUser();
