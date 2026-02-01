import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { Tenant } from '@/types/tenant';
import { AIJournalist } from '@/types/aiJournalist';
import { CREDIT_COSTS } from '@/types/credits';

export const dynamic = 'force-dynamic';

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
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/scheduled/run-all-tenants", "schedule": "0/15 * * * *" }]
 * }
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
    const db = getDb();

    // Get all active tenants
    const tenantsQuery = query(
      collection(db, 'tenants'),
      where('status', 'in', ['active', 'provisioning'])
    );
    const tenantsSnap = await getDocs(tenantsQuery);

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
      };

      try {
        // Get AI journalists for this tenant
        const journalistsQuery = query(
          collection(db, 'aiJournalists'),
          where('tenantId', '==', tenant.id),
          where('status', '==', 'active')
        );
        const journalistsSnap = await getDocs(journalistsQuery);

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
            const creditsQuery = query(
              collection(db, 'tenantCredits'),
              where('tenantId', '==', tenant.id)
            );
            const creditsSnap = await getDocs(creditsQuery);

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

            // Generate article (placeholder - actual implementation would call AI)
            const article = await generateArticleForTenant(
              tenant,
              journalist,
              db
            );

            if (article) {
              tenantResult.articlesGenerated++;
              tenantResult.creditsUsed += articleCost;

              // Deduct credits
              const newCreditsUsed = (credits.creditsUsed || 0) + articleCost;
              const newCreditsRemaining = credits.monthlyAllocation - newCreditsUsed;

              await updateDoc(doc(db, 'tenantCredits', creditDoc.id), {
                creditsUsed: newCreditsUsed,
                creditsRemaining: Math.max(0, newCreditsRemaining),
                lastUsageAt: new Date(),
                status: newCreditsRemaining <= 0 ? 'exhausted' : credits.status,
              });

              // Log the usage
              await addDoc(collection(db, 'creditUsage'), {
                tenantId: tenant.id,
                action: 'article_generation',
                creditsUsed: articleCost,
                description: article.title,
                articleId: article.id,
                timestamp: new Date(),
              });

              // Update journalist's last run
              await updateDoc(doc(db, 'aiJournalists', journalist.id), {
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
 * (Placeholder implementation - actual AI generation would be more complex)
 */
async function generateArticleForTenant(
  tenant: Tenant,
  journalist: AIJournalist,
  db: ReturnType<typeof getDb>
): Promise<{ id: string; title: string } | null> {
  try {
    // Find the category for this journalist
    const category = tenant.categories.find((c) => c.id === journalist.categoryId);
    if (!category) {
      console.warn(`[${tenant.businessName}] No category found for journalist ${journalist.name}`);
      return null;
    }

    // Generate article title based on category and location
    const title = generatePlaceholderTitle(
      category.name,
      tenant.serviceArea.city,
      tenant.serviceArea.state
    );

    // Create article document
    const articleData = {
      tenantId: tenant.id,
      title,
      slug: slugify(title),
      excerpt: `AI-generated article about ${category.name.toLowerCase()} in ${tenant.serviceArea.city}.`,
      content: `<p>This is a placeholder article generated by ${journalist.name} for ${tenant.businessName}.</p><p>In a real implementation, this would contain AI-generated content about ${category.name.toLowerCase()} news in ${tenant.serviceArea.city}, ${tenant.serviceArea.state}.</p>`,
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
    };

    const articleRef = await addDoc(
      collection(db, `tenants/${tenant.id}/articles`),
      articleData
    );

    console.log(`[${tenant.businessName}] Generated article: ${title}`);

    return { id: articleRef.id, title };
  } catch (error) {
    console.error(`[${tenant.businessName}] Article generation failed:`, error);
    return null;
  }
}

/**
 * Generate a placeholder news title
 */
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

/**
 * Convert title to URL slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
