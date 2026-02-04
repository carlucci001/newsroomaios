import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { SetupProgress } from '@/types/setupStatus';
import { Tenant } from '@/types/tenant';
import { AIJournalist } from '@/types/aiJournalist';
import { CREDIT_COSTS } from '@/types/credits';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for seeding

/**
 * Master Cron Job: Run AI Journalists for All Tenants
 *
 * This endpoint is called by Vercel cron to process all active tenants.
 * For each tenant:
 * 1. Get their AI journalists
 * 2. Check which are due to run
 * 3. Generate articles
 * 4. Deduct credits
 *
 * Cron schedule: Every 15 minutes
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: Array<{
    tenantId: string;
    businessName: string;
    journalistsRun: number;
    articlesGenerated: number;
    creditsUsed: number;
    errors: string[];
  }> = [];

  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get all active tenants
    const tenantsSnap = await db.collection('tenants')
      .where('status', 'in', ['active', 'provisioning'])
      .get();

    if (tenantsSnap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No active tenants found',
        tenantsProcessed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Process each tenant
    for (const tenantDoc of tenantsSnap.docs) {
      const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
      const tenantResult = {
        tenantId: tenant.id,
        businessName: tenant.businessName,
        journalistsRun: 0,
        articlesGenerated: 0,
        creditsUsed: 0,
        errors: [] as string[],
        seeded: false,
      };

      try {
        // SEEDING: New tenants get 36 seed articles (6 per category)
        if (tenant.status === 'provisioning') {
          console.log(`[Seeding] Starting seed for ${tenant.businessName}`);
          const seedResult = await seedTenantArticles(tenant, db);
          tenantResult.articlesGenerated = seedResult.articlesCreated;
          tenantResult.seeded = true;

          // Update tenant status to active
          await db.collection('tenants').doc(tenant.id).update({
            status: 'active',
            seededAt: new Date(),
          });

          console.log(`[Seeding] Completed for ${tenant.businessName}: ${seedResult.articlesCreated} articles`);
          results.push(tenantResult);
          continue; // Skip regular journalist run for seeding pass
        }

        // REGULAR RUN: Active tenants run scheduled journalists
        const journalistsSnap = await db.collection('aiJournalists')
          .where('tenantId', '==', tenant.id)
          .where('status', '==', 'active')
          .get();

        if (journalistsSnap.empty) {
          tenantResult.errors.push('No active AI journalists');
          results.push(tenantResult);
          continue;
        }

        // Check each journalist's schedule
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday

        for (const journalistDoc of journalistsSnap.docs) {
          const journalist = {
            id: journalistDoc.id,
            ...journalistDoc.data(),
          } as AIJournalist;

          // Check if journalist is due to run
          if (!isJournalistDue(journalist, currentHour, currentDay)) {
            continue;
          }

          tenantResult.journalistsRun++;

          try {
            // Check tenant's credit balance first
            const creditsSnap = await db.collection('tenantCredits')
              .where('tenantId', '==', tenant.id)
              .get();

            if (creditsSnap.empty) {
              tenantResult.errors.push('No credit allocation found');
              continue;
            }

            const creditDoc = creditsSnap.docs[0];
            const credits = creditDoc.data();

            // Check if credits allow generation
            const articleCost = CREDIT_COSTS.article_generation;
            if (credits.status === 'suspended') {
              tenantResult.errors.push('Account suspended - skipping');
              continue;
            }

            // Generate article
            const article = await generateArticleForTenant(tenant, journalist, db);

            if (article) {
              tenantResult.articlesGenerated++;
              tenantResult.creditsUsed += articleCost;

              // Deduct credits
              const newCreditsUsed = (credits.creditsUsed || 0) + articleCost;
              const newCreditsRemaining = credits.monthlyAllocation - newCreditsUsed;

              await db.collection('tenantCredits').doc(creditDoc.id).update({
                creditsUsed: newCreditsUsed,
                creditsRemaining: Math.max(0, newCreditsRemaining),
                lastUsageAt: new Date(),
                status: newCreditsRemaining <= 0 ? 'exhausted' : credits.status,
              });

              // Log the usage
              await db.collection('creditUsage').add({
                tenantId: tenant.id,
                action: 'article_generation',
                creditsUsed: articleCost,
                description: article.title,
                articleId: article.id,
                timestamp: new Date(),
              });

              // Update journalist's last run
              await db.collection('aiJournalists').doc(journalist.id).update({
                lastRunAt: new Date(),
                articlesGenerated: (journalist.articlesGenerated || 0) + 1,
              });
            }
          } catch (journalistError: any) {
            tenantResult.errors.push(
              `Journalist ${journalist.name}: ${journalistError.message}`
            );
          }
        }
      } catch (tenantError: any) {
        tenantResult.errors.push(`Tenant error: ${tenantError.message}`);
      }

      results.push(tenantResult);
    }

    // Summary
    const totalArticles = results.reduce((sum, r) => sum + r.articlesGenerated, 0);
    const totalCredits = results.reduce((sum, r) => sum + r.creditsUsed, 0);

    return NextResponse.json({
      success: true,
      tenantsProcessed: results.length,
      totalArticlesGenerated: totalArticles,
      totalCreditsUsed: totalCredits,
      duration: Date.now() - startTime,
      results,
    });
  } catch (error: any) {
    console.error('[Master Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Check if a journalist is due to run based on their schedule
 */
function isJournalistDue(
  journalist: AIJournalist,
  currentHour: number,
  currentDay: number
): boolean {
  const schedule = journalist.schedule;
  if (!schedule?.enabled) return false;

  // Check day of week (if specified)
  if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
    if (!schedule.daysOfWeek.includes(currentDay)) {
      return false;
    }
  }

  // Check time (for daily/weekly schedules)
  if (schedule.time) {
    const scheduledHour = parseInt(schedule.time.split(':')[0], 10);
    if (currentHour !== scheduledHour) {
      return false;
    }
  }

  // Check if already ran this hour (prevent duplicate runs)
  if (journalist.lastRunAt) {
    const lastRun = journalist.lastRunAt instanceof Date
      ? journalist.lastRunAt
      : new Date((journalist.lastRunAt as any).seconds * 1000);
    const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);

    if (schedule.frequency === 'daily' && hoursSinceLastRun < 23) {
      return false;
    }
    if (schedule.frequency === 'hourly' && hoursSinceLastRun < 0.9) {
      return false;
    }
  }

  return true;
}

/**
 * Generate an article for a tenant using their AI journalist
 */
async function generateArticleForTenant(
  tenant: Tenant,
  journalist: AIJournalist,
  db: FirebaseFirestore.Firestore
): Promise<{ id: string; title: string } | null> {
  try {
    const category = tenant.categories.find((c) => c.id === journalist.categoryId);
    if (!category) {
      console.warn(`[${tenant.businessName}] No category found for journalist ${journalist.name}`);
      return null;
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.warn(`[${tenant.businessName}] No Gemini API key - using placeholder content`);
      return generatePlaceholderArticle(tenant, journalist, category, db);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const platformSecret = process.env.PLATFORM_SECRET || 'paper-partner-2024';

    const response = await fetch(`${baseUrl}/api/ai/generate-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Secret': platformSecret,
        'X-Tenant-ID': tenant.id,
      },
      body: JSON.stringify({
        tenantId: tenant.id,
        categoryId: category.id,
        useWebSearch: tenant.aiSettings?.enableWebSearch ?? true,
        journalistId: journalist.id,
        journalistName: journalist.name,
        generateSEO: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI generation failed');
    }

    const result = await response.json();

    if (!result.success || !result.article) {
      throw new Error(result.error || 'No article generated');
    }

    console.log(`[${tenant.businessName}] Generated AI article: ${result.article.title}`);

    return {
      id: result.article.slug,
      title: result.article.title,
    };
  } catch (error) {
    console.error(`[${tenant.businessName}] Article generation failed:`, error);
    return generatePlaceholderArticle(tenant, journalist, tenant.categories.find(c => c.id === journalist.categoryId)!, db);
  }
}

/**
 * Generate a placeholder article when AI is not available
 */
async function generatePlaceholderArticle(
  tenant: Tenant,
  journalist: AIJournalist,
  category: { id: string; name: string; slug: string; directive: string },
  db: FirebaseFirestore.Firestore
): Promise<{ id: string; title: string } | null> {
  try {
    const title = generatePlaceholderTitle(
      category.name,
      tenant.serviceArea.city,
      tenant.serviceArea.state
    );

    const articleData = {
      tenantId: tenant.id,
      title,
      slug: slugify(title),
      excerpt: `AI-generated article about ${category.name.toLowerCase()} in ${tenant.serviceArea.city}.`,
      content: `<p>This is a placeholder article generated by ${journalist.name} for ${tenant.businessName}.</p><p>In a real implementation, this would contain AI-generated content about ${category.name.toLowerCase()} news in ${tenant.serviceArea.city}, ${tenant.serviceArea.state}.</p>`,
      category: category.slug,  // Use slug for URL compatibility
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      journalistId: journalist.id,
      journalistName: journalist.name,
      status: 'published',
      publishedAt: new Date(),
      createdAt: new Date(),
      author: journalist.name,
      isAIGenerated: true,
      isPlaceholder: true,
    };

    const articleRef = await db.collection(`tenants/${tenant.id}/articles`).add(articleData);

    console.log(`[${tenant.businessName}] Generated placeholder article: ${title}`);
    return { id: articleRef.id, title };
  } catch (error) {
    console.error(`[${tenant.businessName}] Placeholder article failed:`, error);
    return null;
  }
}

function generatePlaceholderTitle(category: string, city: string, state: string): string {
  const templates = [
    `${city} ${category} Update: Latest Developments`,
    `What's Happening in ${city} ${category} This Week`,
    `${category} News: ${city} Community Spotlight`,
    `${city}, ${state} ${category} Report`,
    `Breaking: ${city} ${category} Story`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Seed a new tenant with 36 articles (6 per category)
 * Uses Admin SDK for reliable server-side writes
 */
async function seedTenantArticles(
  tenant: Tenant,
  db: FirebaseFirestore.Firestore
): Promise<{ articlesCreated: number; errors: string[] }> {
  const ARTICLES_PER_CATEGORY = 6;
  let articlesCreated = 0;
  const errors: string[] = [];
  const totalArticles = tenant.categories.length * ARTICLES_PER_CATEGORY;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const platformSecret = process.env.PLATFORM_SECRET || 'paper-partner-2024';

  // Initialize category progress tracking
  const categoryProgress: SetupProgress['categoryProgress'] = {};
  for (const cat of tenant.categories) {
    categoryProgress[cat.id] = {
      name: cat.name,
      generated: 0,
      total: ARTICLES_PER_CATEGORY,
      status: 'pending',
    };
  }

  // Status document reference
  const statusRef = db.collection('tenants').doc(tenant.id).collection('meta').doc('setupStatus');

  // Initialize setup status in Firestore
  await statusRef.set({
    currentStep: 'generating_articles',
    completedSteps: ['account_created', 'payment_received', 'journalists_created'],
    articlesGenerated: 0,
    totalArticles,
    categoryProgress,
    startedAt: new Date(),
    lastUpdatedAt: new Date(),
    errors: [],
  });

  console.log(`[Seed] Initialized progress for ${tenant.businessName}, ${totalArticles} articles to create`);

  // Process each category
  for (let catIndex = 0; catIndex < tenant.categories.length; catIndex++) {
    const category = tenant.categories[catIndex];
    const stepName = `generating_${category.slug || category.id}`;

    // Update status: starting this category
    categoryProgress[category.id].status = 'in_progress';
    await statusRef.set({
      currentStep: stepName,
      currentCategory: category.name,
      categoryProgress,
      articlesGenerated: articlesCreated,
      lastUpdatedAt: new Date(),
    }, { merge: true });

    console.log(`[Seed] ${tenant.businessName} - Starting category: ${category.name}`);

    for (let i = 0; i < ARTICLES_PER_CATEGORY; i++) {
      try {
        // If Gemini is configured, use real AI generation
        if (geminiApiKey) {
          const response = await fetch(`${baseUrl}/api/ai/generate-article`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Platform-Secret': platformSecret,
              'X-Tenant-ID': tenant.id,
            },
            body: JSON.stringify({
              tenantId: tenant.id,
              categoryId: category.id,
              useWebSearch: true,
              journalistName: `${category.name} Reporter`,
              generateSEO: true,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              articlesCreated++;
              categoryProgress[category.id].generated++;

              // Update progress in real-time
              await statusRef.set({
                articlesGenerated: articlesCreated,
                categoryProgress,
                lastUpdatedAt: new Date(),
              }, { merge: true });

              console.log(`[Seed] ${tenant.businessName} - Created article ${articlesCreated}/${totalArticles} for ${category.name}`);
              continue;
            }
          }
        }

        // Fallback: Create placeholder seed article
        const template = articleTemplates[i % articleTemplates.length];
        const title = `${template.prefix} ${tenant.serviceArea.city} ${category.name} ${template.suffix}`;
        const slug = slugify(title) + `-${Date.now().toString(36).slice(-4)}`;

        const articleData = {
          tenantId: tenant.id,
          title,
          slug,
          excerpt: `${category.name} coverage for ${tenant.serviceArea.city}, ${tenant.serviceArea.state}. Stay informed with the latest updates from your local ${category.name.toLowerCase()} beat.`,
          content: generateSeedArticleContent(
            tenant.businessName,
            tenant.serviceArea.city,
            tenant.serviceArea.state,
            category.name,
            category.directive
          ),
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
          status: 'published',
          publishedAt: new Date(Date.now() - i * 3600000),
          createdAt: new Date(),
          author: `${category.name} Reporter`,
          isAIGenerated: true,
          isSeedArticle: true,
          isPlaceholder: true,
        };

        await db.collection(`tenants/${tenant.id}/articles`).add(articleData);
        articlesCreated++;
        categoryProgress[category.id].generated++;

        // Update progress
        await statusRef.set({
          articlesGenerated: articlesCreated,
          categoryProgress,
          lastUpdatedAt: new Date(),
        }, { merge: true });

      } catch (error: any) {
        errors.push(`${category.name} article ${i + 1}: ${error.message}`);
        console.error(`[Seed] Error creating article for ${category.name}:`, error.message);
      }
    }

    // Mark category complete
    categoryProgress[category.id].status = 'complete';
    await statusRef.set({
      categoryProgress,
      lastUpdatedAt: new Date(),
    }, { merge: true });

    console.log(`[Seed] ${tenant.businessName} - Completed category: ${category.name}`);
  }

  // Mark seeding complete
  await statusRef.set({
    currentStep: 'complete',
    completedSteps: ['account_created', 'payment_received', 'journalists_created', 'generating_articles', 'complete'],
    articlesGenerated: articlesCreated,
    categoryProgress,
    lastUpdatedAt: new Date(),
    errors,
    siteUrl: `https://${tenant.slug}.newsroomaios.com`,
  }, { merge: true });

  console.log(`[Seed] ${tenant.businessName} - Seeding complete: ${articlesCreated} articles created`);

  return { articlesCreated, errors };
}

// Article templates for seed variety
const articleTemplates = [
  { prefix: 'Breaking:', suffix: 'Story Develops' },
  { prefix: 'Update:', suffix: 'What You Need to Know' },
  { prefix: 'Local', suffix: 'News Roundup' },
  { prefix: 'Community', suffix: 'Spotlight' },
  { prefix: 'Weekly', suffix: 'Report' },
  { prefix: 'Feature:', suffix: 'In Focus' },
];

function generateSeedArticleContent(
  businessName: string,
  city: string,
  state: string,
  categoryName: string,
  directive: string
): string {
  return `
<p>${businessName} brings you the latest ${categoryName.toLowerCase()} news from ${city}, ${state}.</p>

<p>Our dedicated team of journalists is committed to keeping you informed about what matters most in your community. ${directive}</p>

<h2>What to Expect</h2>

<p>As your trusted local news source, we cover:</p>
<ul>
<li>Breaking developments in ${city}</li>
<li>In-depth analysis of local ${categoryName.toLowerCase()} stories</li>
<li>Community voices and perspectives</li>
<li>Updates that affect your daily life</li>
</ul>

<p>Stay connected with ${businessName} for comprehensive ${categoryName.toLowerCase()} coverage that keeps you informed and engaged with your community.</p>

<p><em>This article was generated as part of your newspaper's initial content. Our AI journalists will continue to provide fresh, relevant content daily.</em></p>
`.trim();
}
