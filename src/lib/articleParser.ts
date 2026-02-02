/**
 * Article parser for Gemini AI responses
 * Extracts title, content, and tags from formatted AI output
 * Ported from WNCT-next
 */

import { SourceContent } from '@/types/generation';

export interface ParsedArticle {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  slug: string;
}

/**
 * Parse Gemini response to extract article components
 */
export function parseArticleResponse(
  response: string,
  sourceContent?: SourceContent
): ParsedArticle {
  let title = '';
  let content = '';
  let tags: string[] = [];

  // Extract title
  const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|CONTENT:)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  } else if (sourceContent?.title) {
    // Fallback: use source title with modification
    title = `Local Update: ${sourceContent.title}`;
  } else {
    title = 'Local News Update';
  }

  // Extract content (using [\s\S] for multiline matching)
  const contentMatch = response.match(/CONTENT:\s*([\s\S]+?)(?:TAGS:|$)/i);
  if (contentMatch) {
    content = contentMatch[1].trim();
    // Convert paragraphs to HTML
    content = content
      .split(/\n\n+/)
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('\n');
  } else {
    // Fallback: use the whole response as content
    content = `<p>${response
      .replace(/TITLE:.*\n/i, '')
      .replace(/TAGS:.*$/i, '')
      .trim()}</p>`;
  }

  // Extract tags
  const tagsMatch = response.match(/TAGS:\s*(.+?)$/im);
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length < 50);
  }

  // Generate excerpt from content
  const excerpt = generateExcerpt(content, 200);

  // Generate slug from title
  const slug = generateSlug(title);

  return { title, content, excerpt, tags, slug };
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 50);
  return `${slug}-${timestamp}`;
}

/**
 * Generate an excerpt from HTML content
 */
export function generateExcerpt(htmlContent: string, maxLength: number = 200): string {
  // Strip HTML tags
  const plainText = htmlContent.replace(/<[^>]+>/g, '').trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate at word boundary
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Format article content with proper HTML structure
 */
export function formatArticleContent(content: string): string {
  // If content already has paragraph tags, return as-is
  if (content.includes('<p>')) {
    return content;
  }

  // Split by double newlines and wrap in paragraph tags
  return content
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((p) => `<p>${p.trim()}</p>`)
    .join('\n');
}

/**
 * SEO Metadata interface
 */
export interface SEOMetadata {
  metaDescription: string;
  keywords: string[];
  hashtags: string[];
  localKeywords: string[];
  geoTags: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    topics: string[];
  };
  imageAltText: string;
  schema: string;
}

/**
 * Parse SEO metadata from Gemini response
 */
export function parseSEOResponse(
  responseText: string,
  fallbackTitle: string,
  fallbackCategory: string,
  authorName: string,
  publishedAt: string
): SEOMetadata {
  try {
    // Handle markdown code blocks
    let jsonText = responseText;

    if (jsonText.includes('```')) {
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      } else {
        jsonText = jsonText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
      }
    }

    // Try to find JSON object if there's other text
    if (!jsonText.startsWith('{')) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }

    const parsed = JSON.parse(jsonText);

    // Validate and sanitize the response
    return {
      metaDescription: (parsed.metaDescription || '').substring(0, 155),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.slice(0, 8).map((h: string) => (h.startsWith('#') ? h : `#${h}`))
        : [],
      localKeywords: Array.isArray(parsed.localKeywords) ? parsed.localKeywords : [],
      geoTags: Array.isArray(parsed.geoTags) ? parsed.geoTags : [],
      entities: {
        people: Array.isArray(parsed.entities?.people) ? parsed.entities.people : [],
        organizations: Array.isArray(parsed.entities?.organizations)
          ? parsed.entities.organizations
          : [],
        locations: Array.isArray(parsed.entities?.locations) ? parsed.entities.locations : [],
        topics: Array.isArray(parsed.entities?.topics) ? parsed.entities.topics : [],
      },
      imageAltText: (parsed.imageAltText || '').substring(0, 125),
      schema: typeof parsed.schema === 'object' ? JSON.stringify(parsed.schema) : '',
    };
  } catch {
    // Return default metadata on parse error
    return getDefaultSEOMetadata(fallbackTitle, fallbackCategory, authorName, publishedAt);
  }
}

/**
 * Returns default SEO metadata when generation fails
 */
export function getDefaultSEOMetadata(
  title: string,
  category: string,
  authorName: string,
  publishedAt: string
): SEOMetadata {
  const metaDescription = `${title} - Read the latest ${category} news.`.substring(0, 155);

  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const keywords = [...new Set([category.toLowerCase(), ...titleWords])].slice(0, 8);
  const hashtags = keywords.slice(0, 5).map((t) => `#${t.replace(/\s+/g, '')}`);

  return {
    metaDescription,
    keywords,
    hashtags: hashtags.length > 0 ? hashtags : [`#${category.replace(/\s+/g, '')}`, '#LocalNews'],
    localKeywords: [],
    geoTags: [],
    entities: {
      people: [],
      organizations: [],
      locations: [],
      topics: [category],
    },
    imageAltText: `${category} news`,
    schema: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: title,
      description: metaDescription,
      articleSection: category,
      author: { '@type': 'Person', name: authorName },
      datePublished: publishedAt,
      dateModified: publishedAt,
    }),
  };
}
