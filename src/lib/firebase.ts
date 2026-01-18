import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Trim env vars to remove any accidental whitespace/newlines
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
};

// Lazy initialization - only when needed
let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

// Getter functions - use these for Firebase operations
export function getDb(): Firestore {
  if (!_db) {
    // Note: newsroomaios uses default database, not a named one like wnct-next
    _db = getFirestore(getApp());
  }
  return _db;
}

export function getAuthInstance(): Auth {
  if (!_auth) {
    _auth = getAuth(getApp());
  }
  return _auth;
}

export function getStorageInstance(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getApp());
  }
  return _storage;
}

// Legacy exports - these create instances on first property access
// For collection(), doc(), etc. - use getDb() directly
export const db = new Proxy({} as Firestore, {
  get(target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const auth = new Proxy({} as Auth, {
  get(target, prop, receiver) {
    const instance = getAuthInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(target, prop, receiver) {
    const instance = getStorageInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export default getApp;
