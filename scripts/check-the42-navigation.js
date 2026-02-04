#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls',
  authDomain: 'newsroomasios.firebaseapp.com',
  projectId: 'newsroomasios',
});

const db = getFirestore(app);

async function checkNavigation() {
  try {
    const tenantId = 'tenant_1770138901335_awej6s3mo';

    console.log('=== THE42 NAVIGATION & CATEGORIES ===\n');

    // Check navigation config
    const navDoc = await getDoc(doc(db, 'tenants', tenantId, 'siteConfig', 'navigation'));
    if (navDoc.exists()) {
      const nav = navDoc.data();
      console.log('📋 NAVIGATION MENU:');
      console.log('Main Nav Items:', nav.mainNav?.length || 0);
      console.log('');

      if (nav.mainNav && nav.mainNav.length > 0) {
        nav.mainNav.forEach((item, idx) => {
          console.log(`${idx + 1}. "${item.label}"`);
          console.log(`   Path: ${item.href}`);
          console.log(`   ID: ${item.id}`);
          console.log(`   Active: ${item.isActive !== false}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Navigation config not found!');
    }

    // Check categories
    const categoriesSnap = await getDocs(collection(db, 'tenants', tenantId, 'categories'));
    console.log('📁 CATEGORIES IN FIRESTORE:');
    console.log('Total:', categoriesSnap.size);
    console.log('');

    const categories = [];
    categoriesSnap.forEach(docSnap => {
      const cat = docSnap.data();
      categories.push({
        id: docSnap.id,
        name: cat.name,
        slug: cat.slug,
        order: cat.order || 0
      });
    });

    categories.sort((a, b) => a.order - b.order);
    categories.forEach((cat, idx) => {
      console.log(`${idx + 1}. ${cat.name}`);
      console.log(`   Slug: ${cat.slug}`);
      console.log(`   ID: ${cat.id}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkNavigation();
