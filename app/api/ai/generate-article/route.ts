import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { generateContent, NEWS_SYSTEM_INSTRUCTION } from '@/lib/gemini';
import { buildArticlePrompt, validateSourceMaterial } from '@/lib/promptBuilder';
import { parseArticleResponse, generateSlug } from '@/lib/articleParser';
import { generateArticleImage } from '@/lib/imageGeneration';
import { searchNews, generateSearchQuery } from '@/lib/webSearch';
import { GenerateArticleRequest, GenerateArticleResponse, PromptContext, SourceContent } from '@/types/generation';
import { Tenant, NewsCategory } from '@/types/tenant';
import { CREDIT_COSTS } from '@/types/credits';

// Platform secret for internal calls
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Allow all tenant domains
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * OPTIONS /api/ai/generate-article
 *
 * Handle CORS preflight requests from tenant domains
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * POST /api/ai/generate-article
 *
 * Central API for AI article generation.
 * Called by tenant sites or internal cron jobs.
 *
 * Authentication:
 *   - X-Platform-Secret: for internal/cron calls
 *   - X-Tenant-ID + X-API-Key: for external tenant calls
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const tenant = authResult.tenant!;
    const body: GenerateArticleRequest = await request.json();

    // Validate required fields
    if (!body.categoryId) {
      return NextResponse.json(
        { success: false, error: 'categoryId is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!body.sourceContent && !body.useWebSearch) {
      return NextResponse.json(
        { success: false, error: 'Either sourceContent or useWebSearch must be provided' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Find the category
    const category = tenant.categories.find((c) => c.id === body.categoryId);
    if (!category) {
      return NextResponse.json(
        { success: false, error: `Category not found: ${body.categoryId}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // If web search is requested, fetch source content from the web
    let sourceContent: SourceContent | undefined = body.sourceContent;
    if (body.useWebSearch && !sourceContent) {
      console.log(`[Generate] Searching news for: ${category.name} in ${tenant.serviceArea.city}`);
      const searchQuery = generateSearchQuery(
        category.id,
        tenant.serviceArea.city,
        tenant.serviceArea.state,
        tenant.serviceArea.region
      );
      const searchResult = await searchNews(searchQuery, {
        focusArea: category.name,
      });
      if (searchResult) {
        sourceContent = searchResult;
        console.log(`[Generate] ✓ Found source: ${sourceContent.title}`);
      } else {
        console.warn(`[Generate] No news found for ${category.name}, using minimal content`);
      }
    }

    // Validate source material if provided
    if (sourceContent) {
      const validation = validateSourceMaterial(sourceContent);
      if (!validation.valid) {
        // For web search, don't fail - just log and continue with minimal content
        if (body.useWebSearch) {
          console.warn(`[Generate] Weak source material: ${validation.reason}`);
        } else {
          return NextResponse.json(
            { success: false, error: validation.reason },
            { status: 400, headers: CORS_HEADERS }
          );
        }
      }
    }

    // Calculate credits needed
    let creditsNeeded = CREDIT_COSTS.article_generation;
    if (body.generateSEO) creditsNeeded += CREDIT_COSTS.seo_optimization;
    if (body.useWebSearch) creditsNeeded += CREDIT_COSTS.web_search;

    // Check credits
    const creditCheck = await checkCredits(tenant.id, creditsNeeded);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: creditCheck.message || 'Insufficient credits',
          creditsRequired: creditsNeeded,
          creditsRemaining: creditCheck.creditsRemaining,
        },
        { status: 402, headers: CORS_HEADERS }
      );
    }

    // Build prompt context
    const promptContext: PromptContext = {
      tenantId: tenant.id,
      businessName: tenant.businessName,
      serviceArea: tenant.serviceArea,
      editorInChiefDirective: tenant.editorInChiefDirective,
      categoryName: category.name,
      categoryDirective: category.directive,
      articleSpecificPrompt: body.articleSpecificPrompt,
      journalistName: body.journalistName,
      sourceContent, // Use fetched source content (from web search or provided)
      targetWordCount: body.targetWordCount,
      writingStyle: body.writingStyle,
    };

    // Build the prompt
    const prompt = buildArticlePrompt(promptContext);

    // Generate article with Gemini
    const aiResponse = await generateContent(
      prompt,
      {
        model: tenant.aiSettings?.defaultModel || 'gemini-2.0-flash',
        temperature: tenant.aiSettings?.defaultTemperature || 0.1,
        maxTokens: 2800,
      },
      NEWS_SYSTEM_INSTRUCTION
    );

    // Parse the response
    const parsedArticle = parseArticleResponse(aiResponse, body.sourceContent);

    // Get database reference for slug uniqueness check
    const db = getAdminDb();
    if (!db) {
      throw new Error('Database not configured');
    }

    // CRITICAL FIX: Ensure slug uniqueness by checking database
    let finalSlug = parsedArticle.slug;
    let slugAttempt = 0;
    const maxSlugAttempts = 5;

    while (slugAttempt < maxSlugAttempts) {
      const existingArticleSnap = await db
        .collection(`tenants/${tenant.id}/articles`)
        .where('slug', '==', finalSlug)
        .limit(1)
        .get();

      if (existingArticleSnap.empty) {
        // Slug is unique, we're good
        break;
      }

      // Slug collision detected, add entropy
      slugAttempt++;
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      finalSlug = `${parsedArticle.slug}-${randomSuffix}`;
      console.log(`[Generate] Slug collision detected, trying: ${finalSlug}`);
    }

    if (slugAttempt >= maxSlugAttempts) {
      throw new Error('Failed to generate unique slug after multiple attempts');
    }

    // Generate featured image (Pexels first, then Gemini AI fallback)
    let imageResult: { url: string; attribution?: string; method: 'pexels' | 'unsplash' | 'gemini' | 'none' | 'failed' } = { url: '', method: 'none' };
    if (body.generateImage !== false) {
      console.log(`[Generate] Creating image for: ${parsedArticle.title}`);
      imageResult = await generateArticleImage(
        parsedArticle.title,
        parsedArticle.content,
        category.name,
        false // Don't force AI, try stock first
      );

      // Add image generation cost if AI was used
      if (imageResult.method === 'gemini') {
        creditsNeeded += CREDIT_COSTS.image_generation;
      }
    }

    // Store the generated article in Firestore
    const articleData = {
      tenantId: tenant.id,
      title: parsedArticle.title,
      content: parsedArticle.content,
      excerpt: parsedArticle.excerpt,
      slug: finalSlug,
      tags: parsedArticle.tags,
      category: category.slug || category.id,  // Use slug for URL compatibility
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug || category.id,
      journalistId: body.journalistId || null,
      journalistName: body.journalistName || 'AI Reporter',
      author: body.journalistName || 'AI Reporter',
      status: 'published',
      publishedAt: new Date(),
      isAIGenerated: true,
      sourceUrl: sourceContent?.url || null,
      sourceTitle: sourceContent?.title || null,
      // Image
      featuredImage: imageResult.url || null,
      imageUrl: imageResult.url || null,
      imageAttribution: imageResult.attribution || null,
      imageMethod: imageResult.method,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Prompt tracking for auditing
      promptsUsed: {
        editorInChief: tenant.editorInChiefDirective || null,
        category: category.directive,
        articleSpecific: body.articleSpecificPrompt || null,
      },
      generationMetadata: {
        model: tenant.aiSettings?.defaultModel || 'gemini-2.0-flash',
        generationTimeMs: Date.now() - startTime,
        usedWebSearch: body.useWebSearch || false,
        imageMethod: imageResult.method,
      },
    };

    const articleRef = await addDoc(
      collection(db, `tenants/${tenant.id}/articles`),
      articleData
    );

    // Deduct credits
    await deductCredits(tenant.id, creditsNeeded, parsedArticle.title, articleRef.id);

    const generationTimeMs = Date.now() - startTime;

    const response: GenerateArticleResponse = {
      success: true,
      article: {
        title: parsedArticle.title,
        content: parsedArticle.content,
        excerpt: parsedArticle.excerpt,
        tags: parsedArticle.tags,
        slug: finalSlug,
        imageUrl: imageResult.url || undefined,
        imageAttribution: imageResult.attribution,
      },
      creditsUsed: creditsNeeded,
      creditsRemaining: creditCheck.creditsRemaining - creditsNeeded,
      generationTimeMs,
      model: tenant.aiSettings?.defaultModel || 'gemini-2.0-flash',
    };

    // Add CORS headers to success response
    return NextResponse.json(response, {
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('[Generate Article] Error:', error);
    // Add CORS headers to error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate article',
        generationTimeMs: Date.now() - startTime,
        model: 'unknown',
        creditsUsed: 0,
        creditsRemaining: 0,
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

/**
 * Authenticate the request
 */
async function authenticateRequest(request: NextRequest): Promise<{
  valid: boolean;
  tenant?: Tenant;
  error?: string;
}> {
  const platformSecret = request.headers.get('X-Platform-Secret');
  const tenantId = request.headers.get('X-Tenant-ID');
  const apiKey = request.headers.get('X-API-Key');

  // Check platform secret first (internal calls)
  if (platformSecret === PLATFORM_SECRET && tenantId) {
    const tenant = await getTenant(tenantId);
    if (tenant) {
      return { valid: true, tenant };
    }
    return { valid: false, error: 'Tenant not found' };
  }

  // Check tenant API key (external calls)
  if (tenantId && apiKey) {
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return { valid: false, error: 'Tenant not found' };
    }
    if (tenant.apiKey !== apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }
    if (tenant.status === 'suspended') {
      return { valid: false, error: 'Tenant account suspended' };
    }
    return { valid: true, tenant };
  }

  return { valid: false, error: 'Missing authentication headers' };
}

/**
 * Get tenant by ID
 */
async function getTenant(tenantId: string): Promise<Tenant | null> {
  try {
    const db = getDb();
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));

    if (!tenantDoc.exists()) {
      return null;
    }

    return { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
  } catch (error) {
    console.error('[Get Tenant] Error:', error);
    return null;
  }
}

/**
 * Check if tenant has sufficient credits
 */
async function checkCredits(
  tenantId: string,
  creditsNeeded: number
): Promise<{ allowed: boolean; creditsRemaining: number; message?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/credits/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Secret': PLATFORM_SECRET,
      },
      body: JSON.stringify({
        tenantId,
        action: 'article_generation',
        quantity: Math.ceil(creditsNeeded / CREDIT_COSTS.article_generation),
      }),
    });

    const result = await response.json();
    return {
      allowed: result.allowed,
      creditsRemaining: result.creditsRemaining,
      message: result.message,
    };
  } catch (error) {
    console.error('[Check Credits] Error:', error);
    // On error, allow operation
    return { allowed: true, creditsRemaining: -1 };
  }
}

/**
 * Deduct credits after successful generation
 */
async function deductCredits(
  tenantId: string,
  credits: number,
  articleTitle: string,
  articleId: string
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/credits/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Secret': PLATFORM_SECRET,
      },
      body: JSON.stringify({
        tenantId,
        action: 'article_generation',
        quantity: Math.ceil(credits / CREDIT_COSTS.article_generation),
        description: `Generated article: ${articleTitle}`,
        articleId,
        metadata: {
          model: 'gemini-2.0-flash',
        },
      }),
    });
  } catch (error) {
    console.error('[Deduct Credits] Error:', error);
  }
}
