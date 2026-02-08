/**
 * Hybrid image generation: Stock photos first (Pexels), then AI fallback (Gemini)
 * Ported from WNCT-next
 */

export interface ImageResult {
  url: string;
  attribution?: string;
  method: 'pexels' | 'unsplash' | 'gemini' | 'none' | 'failed';
}

/**
 * Extract keywords from article for image search
 */
export function extractPhotoKeywords(
  title: string,
  content: string,
  category?: string
): string {
  // Clean and extract key terms from title
  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !['this', 'that', 'with', 'from', 'have', 'been', 'will', 'what', 'when', 'where', 'breaking', 'update', 'local', 'news'].includes(w));

  // Add category context
  const categoryKeyword = category?.toLowerCase().replace(/[^a-z]/g, '') || '';

  // Build search query
  const keywords = [...new Set([...titleWords.slice(0, 3), categoryKeyword])]
    .filter(Boolean)
    .join(' ');

  return keywords || category || 'news';
}

/**
 * Search Pexels for stock photos
 */
async function searchPexels(
  query: string,
  apiKey: string
): Promise<ImageResult | null> {
  try {
    // Randomize page (1-5) so different articles in same category get different result sets
    const page = Math.floor(Math.random() * 5) + 1;
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&page=${page}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('[Pexels] API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return null;
    }

    // Pick a random photo from all results for maximum variety
    const photo = data.photos[Math.floor(Math.random() * data.photos.length)];

    return {
      url: photo.src.large2x || photo.src.large,
      attribution: `Photo by ${photo.photographer} on Pexels`,
      method: 'pexels',
    };
  } catch (error) {
    console.error('[Pexels] Search failed:', error);
    return null;
  }
}

/**
 * Generate image with Gemini AI
 */
async function generateWithGemini(
  title: string,
  category: string,
  apiKey: string
): Promise<ImageResult | null> {
  try {
    console.log('[Image] Generating with Gemini...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Create a professional news photograph for this headline: "${title}"

Requirements:
- Photorealistic editorial photography style
- High resolution, sharp focus, natural lighting
- Clean composition suitable for newspaper front page
- No text overlays, watermarks, or logos
- No recognizable human faces
- Professional photojournalism quality
- Category context: ${category}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Image] Gemini API error:', errorData.error?.message || response.statusText);
      return null;
    }

    const data = await response.json();

    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) =>
        p.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData?.data) {
      console.error('[Image] Gemini returned no image data');
      return null;
    }

    // Return as data URL (would need to be uploaded to storage in production)
    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return {
      url: dataUrl,
      attribution: 'AI-generated image',
      method: 'gemini',
    };
  } catch (error) {
    console.error('[Image] Gemini generation failed:', error);
    return null;
  }
}

/**
 * Generate article image using hybrid strategy
 * 1. Try Pexels stock photos first
 * 2. Fall back to Gemini AI generation
 *
 * @param title - Article title for context
 * @param content - Article content for keyword extraction
 * @param category - Article category
 * @param forceAI - Skip stock photos and go directly to AI
 */
export async function generateArticleImage(
  title: string,
  content: string,
  category: string,
  forceAI: boolean = false
): Promise<ImageResult> {
  const pexelsApiKey = process.env.PEXELS_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Step 1: Try Pexels (unless forceAI)
  if (!forceAI && pexelsApiKey) {
    const keywords = extractPhotoKeywords(title, content, category);
    console.log(`[Image] Searching Pexels for: "${keywords}"`);

    const pexelsResult = await searchPexels(keywords, pexelsApiKey);
    if (pexelsResult) {
      console.log(`[Image] ✓ Found Pexels photo`);
      return pexelsResult;
    }

    console.log('[Image] No Pexels results, trying AI...');
  }

  // Step 2: Fall back to Gemini AI
  if (geminiApiKey) {
    const geminiResult = await generateWithGemini(title, category, geminiApiKey);
    if (geminiResult) {
      console.log('[Image] ✓ Generated with Gemini');
      return geminiResult;
    }
  }

  // No image available
  console.log('[Image] No image generated');
  return { url: '', method: 'none' };
}

/**
 * Build a detailed prompt for AI image generation
 */
export function buildDetailedImagePrompt(
  title: string,
  excerpt?: string,
  category?: string
): string {
  const categoryContext: Record<string, string> = {
    'local-news': 'local community scene, town hall, neighborhood',
    'sports': 'athletic action, sports field, competition',
    'business': 'professional setting, office, commerce',
    'politics': 'government building, civic setting',
    'weather': 'weather phenomenon, sky, atmospheric',
    'education': 'school setting, learning environment',
    'health': 'medical or wellness setting',
    'arts-entertainment': 'cultural venue, performance, art',
    'community': 'community gathering, local event',
    'real-estate': 'property, architecture, homes',
  };

  const context = category ? categoryContext[category.toLowerCase()] || 'news scene' : 'news scene';

  return `Professional editorial photograph for news article.
Title: "${title}"
${excerpt ? `Context: ${excerpt}` : ''}
Visual theme: ${context}

Style requirements:
- Photojournalistic quality
- Natural lighting
- Sharp focus
- No text or watermarks
- No identifiable faces
- Horizontal/landscape orientation
- Clean, uncluttered composition`;
}
