#!/usr/bin/env node

/**
 * Cleanup Script: Remove Duplicate Articles
 *
 * This script identifies and removes duplicate articles from a tenant's collection.
 * It keeps the newest version of each article (by publishedAt date) and removes older duplicates.
 *
 * Usage:
 *   node scripts/cleanup-duplicate-articles.js <tenantId> [--dry-run]
 *
 * Example:
 *   node scripts/cleanup-duplicate-articles.js tenant_1770138901335_awej6s3mo --dry-run
 *   node scripts/cleanup-duplicate-articles.js tenant_1770138901335_awej6s3mo
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqNa1xBBA651qbwVD9pJPrsqSiUWpHrls",
  authDomain: "newsroomasios.firebaseapp.com",
  projectId: "newsroomasios",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const args = process.argv.slice(2);
  const tenantId = args[0];
  const dryRun = args.includes('--dry-run');

  if (!tenantId) {
    console.error('Error: Please provide a tenant ID');
    console.log('Usage: node scripts/cleanup-duplicate-articles.js <tenantId> [--dry-run]');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('DUPLICATE ARTICLE CLEANUP SCRIPT');
  console.log('='.repeat(80));
  console.log(`Tenant ID: ${tenantId}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no deletions)' : 'LIVE (will delete duplicates)'}`);
  console.log('');

  // Fetch all articles
  console.log('Fetching articles...');
  const articlesSnap = await getDocs(collection(db, `tenants/${tenantId}/articles`));

  if (articlesSnap.empty) {
    console.log('No articles found.');
    process.exit(0);
  }

  console.log(`Found ${articlesSnap.size} articles`);
  console.log('');

  // Group articles by title to find duplicates
  const articlesByTitle = {};
  articlesSnap.forEach(docSnap => {
    const article = { id: docSnap.id, ...docSnap.data() };
    const title = article.title || 'UNTITLED';

    if (!articlesByTitle[title]) {
      articlesByTitle[title] = [];
    }
    articlesByTitle[title].push(article);
  });

  // Find duplicates
  const duplicateSets = Object.entries(articlesByTitle)
    .filter(([title, articles]) => articles.length > 1)
    .sort((a, b) => b[1].length - a[1].length); // Sort by number of duplicates

  if (duplicateSets.length === 0) {
    console.log('✅ No duplicate articles found!');
    process.exit(0);
  }

  console.log(`Found ${duplicateSets.length} titles with duplicates:`);
  console.log('='.repeat(80));

  let totalDuplicates = 0;
  let totalToDelete = 0;

  // Analyze and prepare deletion list
  const deletionList = [];

  for (const [title, articles] of duplicateSets) {
    const duplicateCount = articles.length;
    totalDuplicates += duplicateCount;
    totalToDelete += duplicateCount - 1; // Keep one, delete the rest

    console.log(`\n"${title}"`);
    console.log(`  Duplicates: ${duplicateCount}`);

    // Sort by publishedAt (newest first)
    articles.sort((a, b) => {
      const dateA = a.publishedAt?.seconds || 0;
      const dateB = b.publishedAt?.seconds || 0;
      return dateB - dateA;
    });

    // Keep the first (newest), mark rest for deletion
    articles.forEach((article, index) => {
      const date = article.publishedAt
        ? new Date(article.publishedAt.seconds * 1000).toISOString()
        : 'No date';

      if (index === 0) {
        console.log(`  ✅ KEEP:   ${article.id} (${date})`);
      } else {
        console.log(`  ❌ DELETE: ${article.id} (${date})`);
        deletionList.push({
          id: article.id,
          title: article.title,
          publishedAt: date,
        });
      }
    });
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total articles: ${articlesSnap.size}`);
  console.log(`Duplicate sets: ${duplicateSets.length}`);
  console.log(`Articles to keep: ${duplicateSets.length}`);
  console.log(`Articles to delete: ${totalToDelete}`);
  console.log('');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No articles were deleted');
    console.log('Run without --dry-run to perform actual deletion');
    process.exit(0);
  }

  // Confirm deletion
  console.log('⚠️  WARNING: This will permanently delete duplicate articles!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('');
  console.log('Starting deletion...');

  let deleted = 0;
  let errors = 0;

  for (const article of deletionList) {
    try {
      await deleteDoc(doc(db, `tenants/${tenantId}/articles`, article.id));
      deleted++;
      process.stdout.write(`\rDeleted: ${deleted}/${totalToDelete}`);
    } catch (error) {
      errors++;
      console.error(`\nError deleting ${article.id}:`, error.message);
    }
  }

  console.log('');
  console.log('');
  console.log('='.repeat(80));
  console.log('CLEANUP COMPLETE');
  console.log('='.repeat(80));
  console.log(`✅ Successfully deleted: ${deleted} articles`);
  if (errors > 0) {
    console.log(`❌ Errors: ${errors}`);
  }
  console.log(`📊 Remaining articles: ${articlesSnap.size - deleted}`);

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
