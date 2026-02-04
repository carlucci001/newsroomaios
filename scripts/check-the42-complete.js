#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkThe42() {
  try {
    const tenantId = 'tenant_1770138901335_awej6s3mo';

    // Get the42 tenant info
    const tenantDocRef = doc(db, 'tenants', tenantId);
    const tenantDoc = await getDoc(tenantDocRef);

    if (!tenantDoc.exists) {
      console.log('❌ the42 tenant not found!');
      return;
    }

    const tenant = tenantDoc.data();

    console.log('=== THE42 COMPREHENSIVE STATUS ===\n');

    // 1. Tenant Info
    console.log('📋 TENANT INFO:');
    console.log('  Status:', tenant.status);
    console.log('  Plan:', tenant.plan);
    console.log('  Service Area:', `${tenant.serviceArea?.city}, ${tenant.serviceArea?.state}`);
    console.log('');

    // 2. Credit Balance
    console.log('💳 CREDIT BALANCE:');
    const subCredits = tenant.subscriptionCredits || 0;
    const topCredits = tenant.topOffCredits || 0;
    console.log('  Subscription Credits:', subCredits);
    console.log('  Top-off Credits:', topCredits);
    console.log('  Total Credits:', subCredits + topCredits);
    console.log('');

    // 3. Articles
    const articlesCollection = collection(db, 'tenants', tenantId, 'articles');
    const articlesSnapshot = await getDocs(articlesCollection);
    console.log('📰 ARTICLES:');
    console.log('  Total:', articlesSnapshot.size);

    // Count by status
    let published = 0;
    let draft = 0;
    articlesSnapshot.forEach(doc => {
      const article = doc.data();
      if (article.status === 'published') published++;
      if (article.status === 'draft') draft++;
    });
    console.log('  Published:', published);
    console.log('  Draft:', draft);
    console.log('');

    // 4. Businesses (Directory)
    const businessesCollection = collection(db, 'tenants', tenantId, 'businesses');
    const businessesSnapshot = await getDocs(businessesCollection);
    console.log('🏢 DIRECTORY BUSINESSES:');
    console.log('  Total:', businessesSnapshot.size);
    if (businessesSnapshot.size > 0) {
      const categories = {};
      businessesSnapshot.forEach(doc => {
        const biz = doc.data();
        categories[biz.category] = (categories[biz.category] || 0) + 1;
      });
      console.log('  By Category:');
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`    - ${cat}: ${count}`);
      });
    }
    console.log('');

    // 5. Credit Transactions
    const creditsQuery = query(
      collection(db, 'creditTransactions'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const creditsSnapshot = await getDocs(creditsQuery);
    console.log('💰 RECENT CREDIT TRANSACTIONS:');
    if (creditsSnapshot.size === 0) {
      console.log('  No transactions yet (credit system may not have been used)');
    } else {
      creditsSnapshot.forEach(docSnap => {
        const tx = docSnap.data();
        let date = 'unknown date';
        if (tx.createdAt) {
          if (typeof tx.createdAt === 'string') {
            date = tx.createdAt;
          } else if (tx.createdAt.toDate) {
            date = tx.createdAt.toDate().toISOString();
          } else if (tx.createdAt.seconds) {
            date = new Date(tx.createdAt.seconds * 1000).toISOString();
          }
        }
        console.log(`  - ${tx.type}: ${tx.amount > 0 ? '+' : ''}${tx.amount} credits`);
        console.log(`    ${tx.description || '(no description)'}`);
        console.log(`    ${date}`);
      });
    }
    console.log('');

    // 6. AI Journalists
    const journalistsQuery = query(
      collection(db, 'aiJournalists'),
      where('tenantId', '==', tenantId)
    );
    const journalistsSnapshot = await getDocs(journalistsQuery);
    console.log('🤖 AI JOURNALISTS:');
    console.log('  Total:', journalistsSnapshot.size);
    if (journalistsSnapshot.size > 0) {
      journalistsSnapshot.forEach(doc => {
        const journalist = doc.data();
        console.log(`  - ${journalist.name} (${journalist.beat})`);
        console.log(`    Enabled: ${journalist.enabled}, Auto-publish: ${journalist.taskConfig?.autoPublish}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkThe42();
