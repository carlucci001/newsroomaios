#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, setDoc } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls',
  authDomain: 'newsroomasios.firebaseapp.com',
  projectId: 'newsroomasios',
});

const db = getFirestore(app);

// Simplified category name mappings
const NAME_FIXES = {
  'Politics & Government': 'Politics',
  'Crime & Public Safety': 'Crime',
  'Agriculture & Farming': 'Agriculture',
  'College Sports': 'College Sports', // Keep this one as is
  'Jobs & Employment': 'Jobs',
  'Arts & Entertainment': 'Entertainment',
  'Food & Dining': 'Food',
  'Faith & Religion': 'Faith',
  'Pets & Animals': 'Pets',
  'Events & Calendar': 'Events',
  'Senior Living': 'Seniors',
  'Veterans & Military': 'Veterans',
  'Youth & Teens': 'Youth',
  'Health & Wellness': 'Health',
  'Outdoors & Recreation': 'Outdoors',
  'Development & Growth': 'Development',
  'Tourism & Travel': 'Tourism',
  'Local History': 'History',
  'Letters to Editor': 'Letters',
};

async function fixCategories() {
  try {
    const tenantId = 'tenant_1770138901335_awej6s3mo';

    console.log('=== FIXING THE42 CATEGORY NAMES ===\n');

    // 1. Update categories
    const categoriesSnap = await getDocs(collection(db, 'tenants', tenantId, 'categories'));
    console.log(`Found ${categoriesSnap.size} categories\n`);

    let categoriesUpdated = 0;
    for (const docSnap of categoriesSnap.docs) {
      const category = docSnap.data();
      const oldName = category.name;
      const newName = NAME_FIXES[oldName] || oldName;

      if (oldName !== newName) {
        await updateDoc(doc(db, 'tenants', tenantId, 'categories', docSnap.id), {
          name: newName
        });
        console.log(`✅ "${oldName}" → "${newName}"`);
        categoriesUpdated++;
      }
    }

    if (categoriesUpdated === 0) {
      console.log('No category names needed updating');
    }
    console.log('');

    // 2. Update navigation
    console.log('Updating navigation menu...');
    const navDoc = await doc(db, 'tenants', tenantId, 'siteConfig', 'navigation');
    const navSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'siteConfig'));

    let navigation = null;
    navSnapshot.forEach(docSnap => {
      if (docSnap.id === 'navigation') {
        navigation = docSnap.data();
      }
    });

    if (navigation && navigation.mainNav) {
      const updatedMainNav = navigation.mainNav.map(item => {
        const newLabel = NAME_FIXES[item.label] || item.label;
        if (newLabel !== item.label) {
          console.log(`✅ Nav: "${item.label}" → "${newLabel}"`);
        }
        return {
          ...item,
          label: newLabel
        };
      });

      await setDoc(doc(db, 'tenants', tenantId, 'siteConfig', 'navigation'), {
        ...navigation,
        mainNav: updatedMainNav,
        updatedAt: new Date()
      });

      console.log('\n✅ Navigation updated successfully!');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Categories updated: ${categoriesUpdated}`);
    console.log('Navigation menu: Updated');
    console.log('\n✅ the42 category names are now clean and concise!');
    console.log('Clear your browser cache and reload the42 to see changes.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixCategories();
