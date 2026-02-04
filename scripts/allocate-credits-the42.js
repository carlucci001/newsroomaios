#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, setDoc, collection, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function allocateCredits() {
  try {
    const tenantId = 'tenant_1770138901335_awej6s3mo';

    console.log('Allocating credits to the42...\n');

    // Calculate next billing date (30 days from now)
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setDate(nextBilling.getDate() + 30);

    // Update tenant with credits and plan
    const tenantRef = doc(db, 'tenants', tenantId);
    await updateDoc(tenantRef, {
      subscriptionCredits: 575,  // Growth plan: 500 base + 75 bonus
      topOffCredits: 0,
      plan: 'growth',
      currentBillingStart: now,
      nextBillingDate: nextBilling,
      updatedAt: now
    });

    console.log('✅ Credits allocated:');
    console.log('  Subscription Credits: 575 (Growth plan)');
    console.log('  Top-off Credits: 0');
    console.log('  Total: 575 credits');
    console.log('  Plan: growth ($49/month)');
    console.log('  Next Billing:', nextBilling.toISOString());
    console.log('');

    // Create initial credit transaction record
    const transactionRef = doc(collection(db, 'creditTransactions'));
    await setDoc(transactionRef, {
      tenantId: tenantId,
      type: 'subscription',
      creditPool: 'subscription',
      amount: 575,
      subscriptionBalance: 575,
      topOffBalance: 0,
      description: 'Initial credit allocation - Growth plan (500 + 75 bonus)',
      createdAt: now
    });

    console.log('✅ Credit transaction recorded');
    console.log('');
    console.log('the42 can now use AI features!');
    console.log('  - Generate 115 articles (5 credits each)');
    console.log('  - Or 287 TTS generations (2 credits avg)');
    console.log('  - Or mix of features');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

allocateCredits();
