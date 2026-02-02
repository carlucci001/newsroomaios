import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { generateContent, NEWS_SYSTEM_INSTRUCTION } from '@/lib/gemini';
import { buildArticlePrompt, validateSourceMaterial } from '@/lib/promptBuilder';
import { parseArticleResponse, generateSlug } from '@/lib/articleParser';
import { generateArticleImage } from '@/lib/imageGeneration';
import { GenerateArticleRequest, GenerateArticleResponse, PromptContext } from '@/types/generation';
import { Tenant, NewsCategory } from '@/types/tenant';
import { CREDIT_COSTS } from '@/types/credits';

// Platform secret for internal calls
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'paper-partner-2024';

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
        { status: 401 }
      );
    }

    const tenant = authResult.tenant!;
    const body: GenerateArticleRequest = await request.json();

    // Validate required fields
    if (!body.categoryId) {
      return NextResponse.json(
        { success: false, error: 'categoryId is required' },
        { status: 400 }
      );
    }

    if (!body.sourceContent && !body.useWebSearch) {
      return NextResponse.json(
        { success: false, error: 'Either sourceContent or useWebSearch must be provided' },
        { status: 400 }
      );
    }

    // Find the category
    const category = tenant.categories.find((c) => c.id === body.categoryId);
    if (!category) {
      return NextResponse.json(
        { success: false, error: `Category not found: ${body.categoryId}` },
        { status: 400 }
      );
    }

    // Validate source material if provided
    if (body.sourceContent) {
      const validation = validateSourceMaterial(body.sourceContent);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.reason },
          { status: 400 }
        );
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
        { status: 402 }
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
      sourceContent: body.sourceContent,
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
    const db = getDb();
    const articleData = {
      tenantId: tenant.id,
      title: parsedArticle.title,
      content: parsedArticle.content,
      excerpt: parsedArticle.excerpt,
      slug: parsedArticle.slug,
      tags: parsedArticle.tags,
      category: category.name,  // For template compatibility
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug || category.id,
      journalistId: body.journalistId || null,
      journalistName: body.journalistName || 'AI Reporter',
      author: body.journalistName || 'AI Reporter',
      status: 'published',
      publishedAt: new Date(),
      isAIGenerated: true,
      sourceUrl: body.sourceContent?.url || null,
      sourceTitle: body.sourceContent?.title || null,
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
        slug: parsedArticle.slug,
        imageUrl: imageResult.url || undefined,
        imageAttribution: imageResult.attribution,
      },
      creditsUsed: creditsNeeded,
      creditsRemaining: creditCheck.creditsRemaining - creditsNeeded,
      generationTimeMs,
      model: tenant.aiSettings?.defaultModel || 'gemini-2.0-flash',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Generate Article] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate article',
        generationTimeMs: Date.now() - startTime,
        model: 'unknown',
        creditsUsed: 0,
        creditsRemaining: 0,
      },
      { status: 500 }
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
