/**
 * Firebase Admin SDK Setup
 *
 * Used for server-side operations that need to bypass Firestore rules.
 * Requires FIREBASE_SERVICE_ACCOUNT env var with the service account JSON.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let _adminApp: App | null = null;
let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

function getServiceAccount(): object | null {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    return null;
  }
  try {
    return JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error('[Firebase Admin] Failed to parse service account JSON:', e);
    return null;
  }
}

/**
 * Get Firebase Admin App instance
 * Falls back to default credentials if service account not provided
 */
export function getAdminApp(): App | null {
  if (_adminApp) return _adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    _adminApp = existingApps[0];
    return _adminApp;
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    console.warn('[Firebase Admin] No service account configured');
    return null;
  }

  try {
    _adminApp = initializeApp({
      credential: cert(serviceAccount as any),
    });
    return _adminApp;
  } catch (e) {
    console.error('[Firebase Admin] Failed to initialize:', e);
    return null;
  }
}

/**
 * Get Firestore Admin instance (bypasses security rules)
 */
export function getAdminDb(): Firestore | null {
  if (_adminDb) return _adminDb;

  const app = getAdminApp();
  if (!app) return null;

  try {
    _adminDb = getFirestore(app);
    return _adminDb;
  } catch (e) {
    console.error('[Firebase Admin] Failed to get Firestore:', e);
    return null;
  }
}

/**
 * Get Firebase Auth Admin instance (for creating/managing users)
 */
export function getAdminAuth(): Auth | null {
  if (_adminAuth) return _adminAuth;

  const app = getAdminApp();
  if (!app) return null;

  try {
    _adminAuth = getAuth(app);
    return _adminAuth;
  } catch (e) {
    console.error('[Firebase Admin] Failed to get Auth:', e);
    return null;
  }
}

/**
 * Default password for new admin accounts
 * Simple and easy to type - users are prompted to change it on first login
 */
export const DEFAULT_ADMIN_PASSWORD = 'Welcome1';

/**
 * Generate the default temporary password
 * Returns a simple, consistent password that users can easily see and type
 */
export function generateTempPassword(): string {
  return DEFAULT_ADMIN_PASSWORD;
}
