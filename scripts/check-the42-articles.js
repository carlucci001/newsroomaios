const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const tenantId = 'tenant_1770138901335_awej6s3mo';

  console.log('Checking articles for the42 tenant:', tenantId);
  console.log('');

  // Get articles
  const articlesSnap = await getDocs(
    query(collection(db, `tenants/${tenantId}/articles`), limit(10))
  );

  console.log('Total articles found:', articlesSnap.size);
  console.log('');

  if (articlesSnap.empty) {
    console.log('NO ARTICLES FOUND!');
  } else {
    console.log('First 10 articles:');
    console.log('='.repeat(80));
    articlesSnap.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. ${data.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Category: ${data.category}`);
      console.log(`   CategorySlug: ${data.categorySlug}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Published: ${data.publishedAt ? new Date(data.publishedAt.seconds * 1000).toISOString() : 'Not published'}`);
    });
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
