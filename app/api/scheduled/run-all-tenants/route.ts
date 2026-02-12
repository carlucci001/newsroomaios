import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { SetupProgress } from '@/types/setupStatus';
import { Tenant } from '@/types/tenant';
import { AIJournalist } from '@/types/aiJournalist';
import { CREDIT_COSTS } from '@/types/credits';
import { getAIConfig } from '@/lib/aiConfigService';

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

    // Get all active tenants (include 'seeding'/'deploying' to handle race conditions)
    const tenantsSnap = await db.collection('tenants')
      .where('status', 'in', ['active', 'provisioning', 'seeding', 'deploying'])
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
        // Check seededAt instead of status to handle race condition with deploy endpoint
        if (!tenant.seededAt) {
          console.log(`[Seeding] Checking if ${tenant.businessName} needs seeding`);

          // CRITICAL FIX: Check if articles already exist to prevent duplicate seeding
          const existingArticlesSnap = await db
            .collection(`tenants/${tenant.id}/articles`)
            .limit(1)
            .get();

          if (!existingArticlesSnap.empty) {
            console.log(`[Seeding] ${tenant.businessName} already has articles - skipping seeding and marking active`);
            await db.collection('tenants').doc(tenant.id).update({
              status: 'active',
              seededAt: new Date(),
            });
            tenantResult.errors.push('Already seeded - marked active');
            results.push(tenantResult);
            continue;
          }

          // CRITICAL FIX: Atomically mark tenant as 'seeding' to prevent concurrent runs
          await db.collection('tenants').doc(tenant.id).update({
            status: 'seeding',
            seedingStartedAt: new Date(),
          });

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

          // Trigger directory seeding on the tenant site (fire-and-forget)
          const tenantSiteUrl = `https://${tenant.slug}.newsroomaios.com`;
          const directoryCats = (tenant as any).directoryCategories as string[] | undefined;
          if (directoryCats && directoryCats.length > 0) {
            try {
              console.log(`[Seeding] Triggering directory seed for ${tenant.businessName} (${directoryCats.length} categories)`);
              const dirRes = await fetch(`${tenantSiteUrl}/api/directory/seed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories: directoryCats }),
              });
              if (dirRes.ok) {
                const dirResult = await dirRes.json();
                console.log(`[Seeding] Directory seeded for ${tenant.businessName}: ${dirResult.totalBusinesses} businesses`);
                // Update setupStatus with directory info
                const statusRef = db.collection('tenants').doc(tenant.id).collection('meta').doc('setupStatus');
                await statusRef.set({
                  directorySeeded: true,
                  directoryBusinessCount: dirResult.totalBusinesses || 0,
                  lastUpdatedAt: new Date(),
                }, { merge: true });
              } else {
                console.warn(`[Seeding] Directory seed returned ${dirRes.status} for ${tenant.businessName}`);
              }
            } catch (dirErr) {
              console.warn(`[Seeding] Directory seed failed for ${tenant.businessName} (site may not be ready yet):`, dirErr);
            }
          }

          results.push(tenantResult);
          continue; // Skip regular journalist run for seeding pass
        }

        // CRITICAL FIX: Handle stuck seeding status (recovery mechanism)
        if (tenant.status === 'seeding') {
          const seedingStartedAt = tenant.seedingStartedAt;
          const oneHourAgo = Date.now() - (60 * 60 * 1000);

          // If seeding has been running for more than 1 hour, it's likely stuck
          if (seedingStartedAt) {
            const seedingStartTime = seedingStartedAt instanceof Date
              ? seedingStartedAt.getTime()
              : (seedingStartedAt as any).seconds * 1000;

            if (seedingStartTime < oneHourAgo) {
              console.warn(`[Seeding] ${tenant.businessName} has been seeding for over 1 hour - attempting recovery`);

              // Check if articles were created
              const existingArticlesSnap = await db
                .collection(`tenants/${tenant.id}/articles`)
                .limit(1)
                .get();

              if (!existingArticlesSnap.empty) {
                // Articles exist, mark as active
                console.log(`[Seeding] ${tenant.businessName} has articles - marking as active`);
                await db.collection('tenants').doc(tenant.id).update({
                  status: 'active',
                  seededAt: new Date(),
                });
              } else {
                // No articles, reset to provisioning to retry
                console.log(`[Seeding] ${tenant.businessName} has no articles - resetting to provisioning for retry`);
                await db.collection('tenants').doc(tenant.id).update({
                  status: 'provisioning',
                });
              }

              tenantResult.errors.push('Recovered from stuck seeding status');
              results.push(tenantResult);
              continue;
            }
          }

          console.log(`[Seeding] ${tenant.businessName} is currently being seeded - skipping`);
          tenantResult.errors.push('Seeding in progress');
          results.push(tenantResult);
          continue;
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
    const platformSecret = process.env.PLATFORM_SECRET || '';

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
        skipCredits: true,
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
  // Load seeding config from AI Configurator (admin-adjustable)
  const aiConfig = await getAIConfig();
  const ARTICLES_PER_CATEGORY = aiConfig.seeding.articlesPerCategory;
  const WEB_SEARCH_ARTICLES = aiConfig.seeding.webSearchArticles;
  let articlesCreated = 0;
  const errors: string[] = [];

  // CRITICAL FIX: Validate tenant configuration before seeding
  if (!tenant.categories || tenant.categories.length === 0) {
    errors.push('No categories configured - cannot seed articles');
    console.error(`[Seed] ${tenant.businessName} has no categories configured!`);
    return { articlesCreated: 0, errors };
  }

  if (!tenant.serviceArea?.city || !tenant.serviceArea?.state) {
    errors.push('Service area not configured - cannot generate location-specific content');
    console.error(`[Seed] ${tenant.businessName} missing service area configuration!`);
    return { articlesCreated: 0, errors };
  }

  // Validate all categories have required fields
  for (const category of tenant.categories) {
    if (!category.id || !category.name || !category.slug) {
      errors.push(`Category missing required fields: ${JSON.stringify(category)}`);
      console.error(`[Seed] Invalid category configuration:`, category);
      return { articlesCreated: 0, errors };
    }
  }

  const totalArticles = tenant.categories.length * ARTICLES_PER_CATEGORY;
  console.log(`[Seed] Validation passed for ${tenant.businessName}: ${tenant.categories.length} categories, ${totalArticles} articles to create`);

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const platformSecret = process.env.PLATFORM_SECRET || '';

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

  // PARALLEL SEEDING: Process all categories simultaneously for ~6x speedup
  // Each category generates its articles sequentially to avoid API rate limits,
  // but all categories run in parallel with each other.
  const categoryPromises = tenant.categories.map(async (category) => {
    let catArticlesCreated = 0;
    const catErrors: string[] = [];

    // Update status: starting this category
    categoryProgress[category.id].status = 'in_progress';
    await statusRef.set({
      categoryProgress,
      lastUpdatedAt: new Date(),
    }, { merge: true });

    console.log(`[Seed] ${tenant.businessName} - Starting category: ${category.name}`);

    // Track generated titles to avoid duplicates within this category
    const generatedTitles: string[] = [];

    // Topic angle prompts — each article gets a different angle to ensure variety
    const topicAngles = getSeedTopicAngles(category.name, tenant.serviceArea.city);

    for (let i = 0; i < ARTICLES_PER_CATEGORY; i++) {
      try {
        // If Gemini is configured, use real AI generation
        if (geminiApiKey) {
          // Build a unique topic angle for this article
          const anglePrompt = topicAngles[i] || `Write about a unique, specific aspect of ${category.name} that hasn't been covered yet.`;

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
              useWebSearch: i < WEB_SEARCH_ARTICLES, // Configurable: first N articles use web search; rest use local interest mode
              journalistName: `${category.name} Reporter`,
              generateSEO: true,
              skipCredits: true,
              articleSpecificPrompt: anglePrompt,
              existingTitles: generatedTitles.length > 0 ? generatedTitles : undefined,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              catArticlesCreated++;
              categoryProgress[category.id].generated++;
              articlesCreated++;
              // Track title for dedup
              if (result.article?.title) {
                generatedTitles.push(result.article.title);
              }

              // Update progress in real-time
              await statusRef.set({
                articlesGenerated: articlesCreated,
                categoryProgress,
                lastUpdatedAt: new Date(),
              }, { merge: true });

              console.log(`[Seed] ${tenant.businessName} - Created article ${articlesCreated}/${totalArticles} for ${category.name}`);
              continue;
            } else {
              console.error(`[Seed] ${tenant.businessName} - AI returned success=false for ${category.name} article ${i + 1}: ${result.error}`);
            }
          } else {
            const errorBody = await response.text();
            console.error(`[Seed] ${tenant.businessName} - AI API returned ${response.status} for ${category.name} article ${i + 1}: ${errorBody.substring(0, 200)}`);
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
        catArticlesCreated++;
        categoryProgress[category.id].generated++;
        articlesCreated++;

        // Update progress
        await statusRef.set({
          articlesGenerated: articlesCreated,
          categoryProgress,
          lastUpdatedAt: new Date(),
        }, { merge: true });

      } catch (error: any) {
        catErrors.push(`${category.name} article ${i + 1}: ${error.message}`);
        console.error(`[Seed] Error creating article for ${category.name}:`, error.message);
      }
    }

    // Mark category complete
    categoryProgress[category.id].status = 'complete';
    await statusRef.set({
      categoryProgress,
      lastUpdatedAt: new Date(),
    }, { merge: true });

    console.log(`[Seed] ${tenant.businessName} - Completed category: ${category.name} (${catArticlesCreated} articles)`);
    return { category: category.name, created: catArticlesCreated, errors: catErrors };
  });

  // Wait for ALL categories to finish (running in parallel)
  const categoryResults = await Promise.allSettled(categoryPromises);

  // Collect errors from all categories
  for (const result of categoryResults) {
    if (result.status === 'fulfilled' && result.value.errors.length > 0) {
      errors.push(...result.value.errors);
    } else if (result.status === 'rejected') {
      errors.push(`Category failed: ${result.reason}`);
    }
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

  console.log(`[Seed] ${tenant.businessName} - Seeding complete: ${articlesCreated} articles created (PARALLEL)`);

  return { articlesCreated, errors };
}

/**
 * Generate unique topic angles for seed articles to ensure variety.
 * Each of the 6 articles per category gets a different angle.
 */
function getSeedTopicAngles(categoryName: string, city: string): string[] {
  const catLower = categoryName.toLowerCase();
  const angles: Record<string, string[]> = {
    'local news': [
      `Write about a specific neighborhood or district in ${city} — its character, history, and what makes it special.`,
      `Write about a recent or upcoming community event, festival, or public gathering.`,
      `Write about local infrastructure — a road project, park renovation, library program, or public facility.`,
      `Write about a local tradition, annual event, or seasonal change that affects residents.`,
      `Write about an interesting local personality, community leader, or longtime resident.`,
      `Write about a recent development in local schools, public services, or city programs.`,
    ],
    'sports': [
      `Write about a specific local high school team and their current season — wins, losses, key players.`,
      `Write about youth sports leagues, registration, or recreational programs for kids.`,
      `Write about outdoor recreation opportunities — trails, parks, cycling, fishing, or running clubs.`,
      `Write about a local athlete's achievements, college commitments, or personal story.`,
      `Write about a community fitness event — a 5K race, charity walk, golf tournament, or sports camp.`,
      `Write about the local college or semi-pro sports scene — a team, coach, or rivalry.`,
    ],
    'business': [
      `Profile a SPECIFIC local restaurant, café, or food business — their story, what makes them unique.`,
      `Write about a new business opening, expansion, or renovation happening downtown or in a shopping area.`,
      `Write about local job market trends, a major employer, or workforce development programs.`,
      `Profile a family-owned business or long-standing local shop and their history.`,
      `Write about the local real estate or housing market — trends, new developments, affordability.`,
      `Write about a local entrepreneur, startup, or innovative company doing something different.`,
    ],
    'politics': [
      `Write about a specific city council decision, vote, or debate that affects residents.`,
      `Write about local zoning, development, or land use issues and community reactions.`,
      `Write about the local school board — budget decisions, policy changes, or parent concerns.`,
      `Write about local election information, candidates, or voter engagement efforts.`,
      `Write about a specific public policy issue — housing, transportation, taxes, or public safety.`,
      `Write about interactions between city and county government on a shared issue.`,
    ],
    'entertainment': [
      `Write about a specific upcoming concert, show, or performance at a local venue.`,
      `Profile a local artist, musician, or performer and their work.`,
      `Write about the local theater scene — a specific production, community theater group, or arts program.`,
      `Write about local museums, galleries, or cultural institutions and current exhibits.`,
      `Write about the local dining and nightlife scene — food festivals, wine tastings, or new bars.`,
      `Write about family-friendly entertainment — children's events, movie screenings, or game nights.`,
    ],
    'lifestyle': [
      `Write about local food culture — farmers markets, food trucks, farm-to-table dining, or cooking classes.`,
      `Write about outdoor living and nature activities specific to the area.`,
      `Write about wellness trends — yoga studios, gyms, meditation groups, or health food stores.`,
      `Write about local fashion, shopping districts, or boutique stores.`,
      `Write about home and garden — local gardening tips, home improvement trends, or real estate lifestyle.`,
      `Write about local pet culture — dog parks, pet-friendly businesses, or animal rescue stories.`,
    ],
    'tourism': [
      `Write about a specific hidden gem attraction that visitors often miss.`,
      `Write a day-trip itinerary for visitors or new residents exploring the area.`,
      `Write about the area's most iconic landmark and its history, visitors, and significance.`,
      `Write about seasonal tourism — what to do this time of year, festivals, or outdoor activities.`,
      `Write about local food and drink tourism — breweries, restaurants, food tours, or culinary traditions.`,
      `Write about outdoor adventure tourism — hiking, kayaking, cycling, or nature excursions.`,
    ],
    'health': [
      `Write about a local hospital, clinic, or healthcare provider's community programs.`,
      `Write about mental health resources and counseling services available in the area.`,
      `Write about local fitness trends — popular gyms, running groups, or outdoor workout spots.`,
      `Write about a community health fair, vaccination drive, or public health initiative.`,
      `Write about senior wellness programs, assisted living options, or elder care resources.`,
      `Write about local nutrition and diet trends — health food stores, nutritionists, or cooking classes.`,
    ],
    'community': [
      `Write about a specific local nonprofit organization and the impact they're making.`,
      `Write about volunteer opportunities and how residents can get involved.`,
      `Write about a local cultural celebration, heritage festival, or community tradition.`,
      `Write about neighborhood associations and their current projects or concerns.`,
      `Write about local churches, faith organizations, or interfaith community efforts.`,
      `Write about a local fundraiser, charity event, or giving campaign.`,
    ],
  };

  // Try exact match first, then partial match
  const directMatch = angles[catLower];
  if (directMatch) return directMatch;

  // Partial match
  for (const [key, value] of Object.entries(angles)) {
    if (catLower.includes(key) || key.includes(catLower)) return value;
  }

  // Generic fallback
  return [
    `Write about a SPECIFIC place, person, or event related to ${categoryName} — not a generic overview.`,
    `Write a profile piece about a local figure or organization involved in ${categoryName}.`,
    `Write about an upcoming event or seasonal activity related to ${categoryName}.`,
    `Write about a historical or cultural aspect of ${categoryName} in the area.`,
    `Write about community involvement and volunteer opportunities related to ${categoryName}.`,
    `Write about trends or changes happening in ${categoryName} that affect local residents.`,
  ];
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
