import { onAuthStateChanged, User } from 'firebase/auth';
import { getDb, getAuthInstance } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  const auth = getAuthInstance();
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Get tenant for authenticated user
export async function getUserTenant(userId: string): Promise<any | null> {
  try {
    const db = getDb();

    // Look up user document to get tenantId
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('[AccountAuth] User document not found:', userId);
      return null;
    }

    const userData = userDoc.data();
    const tenantId = userData?.tenantId;

    if (!tenantId) {
      console.log('[AccountAuth] No tenantId found for user:', userId);
      return null;
    }

    // Get tenant document
    const tenantDocRef = doc(db, 'tenants', tenantId);
    const tenantDoc = await getDoc(tenantDocRef);

    if (!tenantDoc.exists()) {
      console.log('[AccountAuth] Tenant document not found:', tenantId);
      return null;
    }

    return {
      id: tenantDoc.id,
      ...tenantDoc.data(),
    };
  } catch (error) {
    console.error('[AccountAuth] Error getting user tenant:', error);
    return null;
  }
}

// Check if user is tenant owner
export async function isTenantOwner(userId: string, tenantId: string): Promise<boolean> {
  try {
    const db = getDb();

    // Check if user exists in tenant's users subcollection with owner role
    const userDocRef = doc(db, `tenants/${tenantId}/users`, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.role === 'owner';
  } catch (error) {
    console.error('[AccountAuth] Error checking tenant owner:', error);
    return false;
  }
}

// Get user's role for a tenant
export async function getUserRole(userId: string, tenantId: string): Promise<string | null> {
  try {
    const db = getDb();

    const userDocRef = doc(db, `tenants/${tenantId}/users`, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data()?.role || null;
  } catch (error) {
    console.error('[AccountAuth] Error getting user role:', error);
    return null;
  }
}
