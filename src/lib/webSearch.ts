/**
 * Web Search Integration using Perplexity API
 *
 * Fetches real-time news content for AI article generation.
 * Falls back to Google News RSS if Perplexity is unavailable.
 */

import { SourceContent } from '@/types/generation';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Search for news using Perplexity's API
 */
export async function searchNews(
  query: string,
  options: {
    maxResults?: number;
    focusArea?: string;
  } = {}
): Promise<SourceContent | null> {
  const { maxResults = 5, focusArea } = options;

  if (!PERPLEXITY_API_KEY) {
    console.warn('[WebSearch] No Perplexity API key configured, using fallback');
    return fallbackSearch(query, focusArea);
  }

  try {
    const systemPrompt = `You are a news research assistant. Search for and summarize the most recent, relevant news articles about the given topic. Focus on FACTUAL information from credible sources.

Return your findings in this exact format:

HEADLINE: [Main story headline]
SOURCE: [Primary source name]
DATE: [Publication date if available]

SUMMARY:
[2-3 sentence summary of the main story]

KEY FACTS:
- [Fact 1]
- [Fact 2]
- [Fact 3]
- [Additional facts as available]

ADDITIONAL CONTEXT:
[Any relevant background or related developments]

SOURCES CONSULTED:
- [Source 1]
- [Source 2]

Important:
- Only report verified facts from actual news sources
- Include specific names, dates, numbers when available
- If no recent news is found, clearly state that`;

    const userPrompt = focusArea
      ? `Search for the latest news about: ${query}\n\nFocus specifically on: ${focusArea}`
      : `Search for the latest news about: ${query}`;

    const messages: PerplexityMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await fetch(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages,
        max_tokens: 1500,
        temperature: 0.1,
        search_domain_filter: ['news'],
        search_recency_filter: 'week',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WebSearch] Perplexity API error: ${response.status} - ${errorText}`);
      return fallbackSearch(query, focusArea);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.warn('[WebSearch] No content in Perplexity response');
      return fallbackSearch(query, focusArea);
    }

    // Parse the structured response
    const parsed = parsePerplexityResponse(content, query);

    if (!parsed) {
      console.warn('[WebSearch] Failed to parse Perplexity response');
      return fallbackSearch(query, focusArea);
    }

    console.log(`[WebSearch] ✓ Found news via Perplexity: ${parsed.title}`);
    return parsed;

  } catch (error) {
    console.error('[WebSearch] Perplexity search failed:', error);
    return fallbackSearch(query, focusArea);
  }
}

/**
 * Parse Perplexity's response into SourceContent format
 */
function parsePerplexityResponse(content: string, query: string): SourceContent | null {
  try {
    // Extract headline (using [\s\S] instead of /s flag for ES2017 compat)
    const headlineMatch = content.match(/HEADLINE:\s*([^\n]+)/);
    const title = headlineMatch?.[1]?.trim() || extractFirstLine(content);

    // Extract source
    const sourceMatch = content.match(/SOURCE:\s*([^\n]+)/);
    const sourceName = sourceMatch?.[1]?.trim() || 'News Reports';

    // Extract summary (everything between SUMMARY: and KEY FACTS:)
    const summaryMatch = content.match(/SUMMARY:\s*([\s\S]*?)(?=\n\n|KEY FACTS:)/);
    const description = summaryMatch?.[1]?.trim() || '';

    // Extract full content (everything after headline/source/date headers)
    const fullContent = content
      .replace(/HEADLINE:[^\n]*\n/, '')
      .replace(/SOURCE:[^\n]*\n/, '')
      .replace(/DATE:[^\n]*\n/, '')
      .trim();

    if (!title || fullContent.length < 100) {
      return null;
    }

    return {
      title,
      description,
      fullContent,
      sourceName,
      url: undefined, // Perplexity doesn't return URLs directly
    };
  } catch (error) {
    console.error('[WebSearch] Parse error:', error);
    return null;
  }
}

/**
 * Extract first meaningful line from content
 */
function extractFirstLine(content: string): string {
  const lines = content.split('\n').filter(line => line.trim().length > 10);
  return lines[0]?.trim() || 'Local News Update';
}

/**
 * Fallback search using Google News RSS
 */
async function fallbackSearch(query: string, focusArea?: string): Promise<SourceContent | null> {
  try {
    const searchQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
      },
    });

    if (!response.ok) {
      console.warn(`[WebSearch] Google News RSS failed: ${response.status}`);
      return generateFallbackContent(query, focusArea);
    }

    const xml = await response.text();
    const items = parseRSSItems(xml);

    if (items.length === 0) {
      console.warn('[WebSearch] No RSS items found');
      return generateFallbackContent(query, focusArea);
    }

    // Combine top items into source content
    const topItems = items.slice(0, 5);
    const title = topItems[0].title;
    const description = topItems[0].description;
    const fullContent = topItems
      .map((item, i) => `[${i + 1}] ${item.title}\n${item.description}\nSource: ${item.source}`)
      .join('\n\n');

    console.log(`[WebSearch] ✓ Found news via RSS: ${title}`);

    return {
      title,
      description,
      fullContent,
      sourceName: 'News Reports',
      url: topItems[0].link,
    };

  } catch (error) {
    console.error('[WebSearch] RSS fallback failed:', error);
    return generateFallbackContent(query, focusArea);
  }
}

/**
 * Parse RSS XML into items
 */
function parseRSSItems(xml: string): Array<{
  title: string;
  description: string;
  link: string;
  source: string;
}> {
  const items: Array<{ title: string; description: string; link: string; source: string }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)
      || itemXml.match(/<title>(.*?)<\/title>/);
    const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)
      || itemXml.match(/<description>(.*?)<\/description>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const sourceMatch = itemXml.match(/<source.*?>(.*?)<\/source>/);

    if (titleMatch) {
      items.push({
        title: decodeHTML(titleMatch[1]),
        description: descMatch ? decodeHTML(descMatch[1]) : '',
        link: linkMatch?.[1] || '',
        source: sourceMatch?.[1] || 'News',
      });
    }
  }

  return items;
}

/**
 * Decode HTML entities
 */
function decodeHTML(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, ''); // Strip HTML tags
}

/**
 * Generate minimal fallback content when all else fails
 */
function generateFallbackContent(query: string, focusArea?: string): SourceContent {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const topic = focusArea || query;

  return {
    title: `${topic} - Local Update`,
    description: `Coverage of ${topic.toLowerCase()} developments in the area.`,
    fullContent: `As of ${today}, there are ongoing developments regarding ${topic.toLowerCase()} in the local area. Community members are encouraged to stay informed about these matters through official channels and local news sources. For the most current information, residents should check with local authorities and community organizations.`,
    sourceName: 'Local Reports',
  };
}

/**
 * Generate a search query for a specific beat/category
 */
export function generateSearchQuery(
  beat: string,
  city: string,
  state: string,
  region?: string
): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const location = region || `${city}, ${state}`;

  const beatQueries: Record<string, string> = {
    'news': `latest breaking news ${location} today ${today}`,
    'local': `local ${location} news community stories ${today}`,
    'local-news': `local ${location} news community stories ${today}`,
    'breaking-news': `breaking news ${location} today ${today}`,
    'sports': `${location} sports news high school athletics ${today}`,
    'high-school-sports': `${location} high school sports athletics ${today}`,
    'college-sports': `${location} college sports university athletics ${today}`,
    'business': `${location} business news economic development ${today}`,
    'real-estate': `${location} real estate housing market property ${today}`,
    'jobs': `${location} jobs employment hiring news ${today}`,
    'agriculture': `${location} agriculture farming rural news ${today}`,
    'politics': `${location} politics government news ${today}`,
    'crime': `${location} crime public safety police news ${today}`,
    'education': `${location} schools education news ${today}`,
    'weather': `${location} weather forecast alerts ${today}`,
    'entertainment': `${location} arts entertainment events ${today}`,
    'food-dining': `${location} restaurants food dining news ${today}`,
    'lifestyle': `${location} lifestyle trends living ${today}`,
    'faith': `${location} churches faith religious community ${today}`,
    'pets-animals': `${location} pets animals shelters rescue ${today}`,
    'community': `${location} community events local happenings ${today}`,
    'obituaries': `${location} obituaries memorials ${today}`,
    'events': `${location} upcoming events calendar ${today}`,
    'seniors': `${location} senior citizens elderly services ${today}`,
    'veterans': `${location} veterans military services ${today}`,
    'youth': `${location} youth kids activities programs ${today}`,
    'health': `${location} health care medical news ${today}`,
    'environment': `${location} environment conservation outdoor ${today}`,
    'transportation': `${location} traffic roads transportation ${today}`,
    'development': `${location} development construction projects ${today}`,
    'technology': `${location} technology innovation tech news ${today}`,
    'tourism': `${location} tourism travel visitors attractions ${today}`,
    'history': `${location} history heritage historical ${today}`,
    'opinion': `${location} opinion editorial commentary ${today}`,
    'letters': `${location} letters editor community voices ${today}`,
    'outdoors': `${location} outdoors recreation hiking fishing ${today}`,
  };

  return beatQueries[beat.toLowerCase()] || `${location} ${beat} news ${today}`;
}
