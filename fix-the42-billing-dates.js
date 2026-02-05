const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'newsroomaios'
  });
}

const db = admin.firestore();

async function fixBillingDates() {
  try {
    const tenantId = 'tenant_1770138901335_awej6s3mo';
    const tenantRef = db.collection('tenants').doc(tenantId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      console.log('❌ Tenant not found');
      process.exit(1);
    }

    const data = tenantDoc.data();
    console.log('\n=== CURRENT BILLING DATES ===');
    console.log('Created At:', data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : 'N/A');
    console.log('Current Billing Start:', data.currentBillingStart ? new Date(data.currentBillingStart._seconds * 1000).toISOString() : 'N/A');
    console.log('Next Billing Date:', data.nextBillingDate ? new Date(data.nextBillingDate._seconds * 1000).toISOString() : 'N/A');

    // Calculate correct dates
    const createdAt = data.createdAt ? new Date(data.createdAt._seconds * 1000) : new Date();
    const currentBillingStart = createdAt;
    const nextBillingDate = new Date(createdAt);
    nextBillingDate.setDate(nextBillingDate.getDate() + 30); // 30 days from creation

    console.log('\n=== CORRECTED BILLING DATES ===');
    console.log('Current Billing Start:', currentBillingStart.toISOString());
    console.log('Next Billing Date:', nextBillingDate.toISOString());

    // Calculate days until renewal
    const now = new Date();
    const daysUntilRenewal = Math.max(0, Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    console.log('Days Until Renewal:', daysUntilRenewal);

    // Update tenant
    await tenantRef.update({
      currentBillingStart: admin.firestore.Timestamp.fromDate(currentBillingStart),
      nextBillingDate: admin.firestore.Timestamp.fromDate(nextBillingDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('\n✅ Updated the42 tenant billing dates');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixBillingDates();
