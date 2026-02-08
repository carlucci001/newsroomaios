/**
 * Prompt builder for AI article generation
 * Implements 3-level prompt hierarchy:
 * 1. Editor-in-Chief Directive (tenant-wide)
 * 2. Category Directive (per category)
 * 3. Article-Specific Prompt (per article)
 *
 * Ported from WNCT-next with anti-hallucination protocols
 */

import { PromptContext, SourceContent } from '@/types/generation';

/**
 * Assess source material quality for dynamic article length targeting
 */
export function assessSourceQuality(sourceContent?: SourceContent): {
  wordCount: number;
  richness: 'rich' | 'moderate' | 'adequate' | 'limited';
} {
  if (!sourceContent) {
    return { wordCount: 0, richness: 'limited' };
  }

  const fullText = [
    sourceContent.title || '',
    sourceContent.description || '',
    sourceContent.fullContent || '',
  ].join(' ');

  const wordCount = fullText.trim().split(/\s+/).filter(w => w.length > 0).length;

  const richness =
    wordCount > 1500 ? 'rich' :
    wordCount > 800 ? 'moderate' :
    wordCount > 300 ? 'adequate' : 'limited';

  return { wordCount, richness };
}

/**
 * Validate that source material is sufficient for article generation
 */
export function validateSourceMaterial(
  sourceContent?: SourceContent
): { valid: boolean; reason?: string; wordCount: number } {
  if (!sourceContent) {
    return { valid: false, reason: 'No source content provided', wordCount: 0 };
  }

  const { wordCount } = assessSourceQuality(sourceContent);

  if (wordCount < 100) {
    return {
      valid: false,
      reason: `Insufficient source material (${wordCount} words, need 100+ minimum)`,
      wordCount,
    };
  }

  return { valid: true, wordCount };
}

/**
 * Build the complete article generation prompt
 * Implements 3-level hierarchy with anti-hallucination protocols
 */
export function buildArticlePrompt(context: PromptContext): string {
  const {
    businessName,
    serviceArea,
    editorInChiefDirective,
    categoryName,
    categoryDirective,
    articleSpecificPrompt,
    journalistName,
    journalistPersona,
    sourceContent,
    targetWordCount,
    writingStyle,
    aggressiveness,
    articleLengthConfig,
    existingTitles,
  } = context;

  const sourceQuality = assessSourceQuality(sourceContent);
  const lengthRich = articleLengthConfig?.richSourceWords || '800-1200';
  const lengthModerate = articleLengthConfig?.moderateSourceWords || '600-900';
  const lengthAdequate = articleLengthConfig?.adequateSourceWords || '500-750';
  const lengthLimited = articleLengthConfig?.limitedSourceWords || '400-600';
  const sourceName = sourceContent?.sourceName || 'News Reports';
  const isWebSearch = sourceName === 'News Reports';

  let prompt = '';

  // --- LEVEL 1: Editor-in-Chief Directive (tenant-wide) ---
  if (editorInChiefDirective) {
    prompt += `EDITORIAL STANDARDS:\n${editorInChiefDirective}\n\n`;
  }

  // Publication context
  prompt += `PUBLICATION: ${businessName}\n`;
  prompt += `SERVICE AREA: ${serviceArea.city}, ${serviceArea.state}`;
  if (serviceArea.region) {
    prompt += ` (${serviceArea.region})`;
  }
  prompt += '\n\n';

  // --- LEVEL 2: Category Directive ---
  if (categoryDirective) {
    prompt += `EDITORIAL DIRECTIVE for ${categoryName} articles:\n${categoryDirective}\n\n`;
  }

  // Journalist persona
  if (journalistName) {
    prompt += `You are ${journalistName}`;
    if (journalistPersona) {
      prompt += `, ${journalistPersona}`;
    }
    prompt += `.\n\n`;
  }

  // --- SOURCE MATERIAL ---
  const isLimitedSource = sourceQuality.richness === 'limited';

  if (sourceContent && !isLimitedSource) {
    prompt += `SOURCE MATERIAL:\n`;
    prompt += `Title: ${sourceContent.title}\n`;
    if (sourceName) {
      prompt += `Source: ${sourceName}\n`;
    }
    if (sourceContent.description) {
      prompt += `Summary: ${sourceContent.description}\n`;
    }
    if (sourceContent.fullContent) {
      prompt += `\nFull Article Content:\n${sourceContent.fullContent.substring(0, 3000)}\n`;
    }
    if (sourceContent.url) {
      prompt += `\nSource URL: ${sourceContent.url}\n`;
    }
    prompt += '\n';
  }

  // --- LEVEL 3: Article-Specific Prompt ---
  if (articleSpecificPrompt) {
    prompt += `SPECIFIC INSTRUCTIONS FOR THIS ARTICLE:\n${articleSpecificPrompt}\n\n`;
  }

  // When source material is limited/empty, switch to local interest mode
  if (isLimitedSource) {
    const regionName = serviceArea.region ? ` (${serviceArea.region})` : '';
    prompt += `
LOCAL INTEREST ARTICLE MODE:

Write an original, engaging local-interest article about ${categoryName} in ${serviceArea.city}${regionName}, ${serviceArea.state}.

GUIDELINES:
- Use your knowledge of ${serviceArea.city} and the surrounding area
- Write about REAL, SPECIFIC places, people, events, landmarks, or topics
- Write as a genuine local newspaper article — not a generic tourism blurb
- The article should read like it was written by a local journalist who knows the community
- Do NOT mention that no news was found or that sources were unavailable
- Do NOT write about news being unavailable — write a REAL article
- Target: 5-7 paragraphs (${lengthModerate} words)
${targetWordCount ? `- Target word count: ${targetWordCount}` : ''}

CRITICAL TITLE RULES:
- Do NOT put the city name in every title — most real newspapers don't
- Write titles that focus on the SUBJECT, not the location
- GOOD: "Garden of the Gods Trail Expansion Opens This Spring"
- GOOD: "Local Chef Brings Farm-to-Table Dining to Downtown"
- GOOD: "Youth Soccer League Registration Opens for Spring Season"
- BAD: "Colorado Springs News Update" ❌
- BAD: "Colorado Springs Business Report" ❌
- BAD: "What's Happening in Colorado Springs" ❌

TOPIC DIVERSITY — pick a SPECIFIC, UNIQUE angle:
- Local News: a specific neighborhood, a local tradition, a seasonal event, a historical anniversary, infrastructure project, library program, park renovation
- Sports: a specific team's season, a coaching milestone, youth league spotlight, a local athlete's journey, recreational league, upcoming tournament
- Business: a specific restaurant or shop, a new opening, a family business story, downtown revitalization, a local entrepreneur, market trends
- Politics: a specific policy debate, zoning issue, budget allocation, school board decision, community planning meeting
- Entertainment: a specific venue, upcoming show, local artist profile, museum exhibit, music scene, comedy night, book club
- Lifestyle: a specific neighborhood's character, food scene, outdoor activity guide, seasonal living tips, local wellness trend
- Tourism: a hidden gem attraction, day trip itinerary, seasonal festival, outdoor adventure, historical walking tour
- Health: a local clinic initiative, community health fair, fitness trend, mental health resources, senior wellness program
- Community: a specific nonprofit, volunteer spotlight, fundraiser, neighborhood association, cultural celebration

${writingStyle ? `WRITING STYLE: ${writingStyle}\n` : ''}
${aggressiveness && aggressiveness !== 'neutral' ? `EDITORIAL TONE: ${
  aggressiveness === 'aggressive'
    ? 'Write with strong, assertive language.'
    : 'Write with measured, careful language.'
}\n` : ''}
TASK: Write an engaging, original local-interest article about ${categoryName} in ${serviceArea.city}. Choose a SPECIFIC, UNIQUE topic — not a generic overview.`;
  } else {
    // --- ANTI-HALLUCINATION PROTOCOL (for articles with real sources) ---
    prompt += `
MANDATORY ANTI-FABRICATION PROTOCOL:

You MUST follow these HARD CONSTRAINTS (violations will block publication):

1. SOURCE-ONLY FACTS:
   - You can ONLY state facts that appear in the source material above
   - If a detail is not explicitly in the source, you CANNOT mention it
   - Do not expand, infer, or assume anything beyond what's written
   - EVERY sentence must be traceable to source material

2. ATTRIBUTION REQUIREMENTS:
   ${isWebSearch
     ? `- Write in professional journalistic style WITHOUT forced attribution phrases
   - DO NOT write "According to sources" or "sources say" - write directly and naturally
   - Present facts as reported news, using active voice and clear statements
   - Attribution is IMPLIED through professional news writing style`
     : `- EVERY paragraph must include source attribution
   - Use: "According to ${sourceName}..."
   - Or: "As reported by ${sourceName}..."
   - Or: "${sourceName} reports that..."
   - Minimum: One clear attribution per paragraph`}

3. STRICTLY PROHIBITED:
   - ❌ Adding names not in source
   - ❌ Adding job titles/positions not in source
   - ❌ Creating or paraphrasing quotes not in source
   - ❌ Inventing statistics, numbers, or data
   - ❌ Making predictions or speculation
   - ❌ Adding background information not in source
   - ❌ Assuming current events or context not mentioned in source

4. EDITORIAL TECHNIQUES FOR RICHNESS (without fabricating):
   While staying strictly within source material, you CAN and SHOULD:
   - ✅ Explain significance: Why does this matter to ${serviceArea.city} residents?
   - ✅ Provide context: Explain technical terms, acronyms, or unfamiliar concepts mentioned in source
   - ✅ Draw connections: Relate different facts mentioned in the source to show relationships
   - ✅ Quote directly: Use exact quotes from sources when available
   - ✅ Ask reader-focused questions: Rhetorical questions that the source material answers
   - ✅ Elaborate on impacts: If source mentions effects, explain what they mean practically
   - ✅ Organize logically: Present source facts in the most coherent, engaging order

5. LENGTH CONSTRAINT:
   - Write ONLY what the source supports
   ${sourceQuality.richness === 'rich'
     ? `- Target: 8-10 paragraphs (${lengthRich} words) - you have rich source material
   - Develop each key point thoroughly with all available details`
     : sourceQuality.richness === 'moderate'
     ? `- Target: 5-8 paragraphs (${lengthModerate} words) - you have moderate source material
   - Cover main points with supporting details`
     : `- Target: 4-7 paragraphs (${lengthAdequate} words) - you have adequate source material
   - Cover essential points concisely`}
   ${targetWordCount ? `- Target word count: ${targetWordCount}` : ''}
   - DO NOT pad with filler or unsupported background

6. WHEN INFORMATION IS MISSING:
   - If source lacks critical details (who, what, when, where), ACKNOWLEDGE IT
   - Use: "Details about [X] were not provided in the report"
   - Use: "Further information was not available"
   - It is BETTER to admit gaps than to fabricate

${writingStyle ? `7. WRITING STYLE: ${writingStyle}\n` : ''}
${aggressiveness && aggressiveness !== 'neutral' ? `8. EDITORIAL TONE: ${
  aggressiveness === 'aggressive'
    ? 'Write with strong, assertive language. Use punchy, attention-grabbing headlines. Lead with the most impactful angle. Be direct and bold in your statements.'
    : 'Write with measured, careful language. Avoid sensationalism. Prefer hedged statements over bold claims. Use qualifying language where appropriate.'
}\n` : ''}
TASK: Write a factual news article based STRICTLY on the source material above.`;
  }

  prompt += `

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

TITLE: [Write a SPECIFIC news headline that answers "What happened?" - NOT generic phrases]

HEADLINE REQUIREMENTS - MANDATORY:
✅ DO: Write a SPECIFIC, compelling headline about the actual subject
✅ DO: Use active voice and concrete details
✅ DO: Make it answer "What happened?" or "What is this about?" in under 12 words
✅ DO: Focus on the SUBJECT of the story, not the location

❌ DON'T: Put the city or county name in EVERY title — real newspapers don't do this
❌ DON'T: Use generic words like "Breaking", "News", "Update", "Alert", "Report"
❌ DON'T: Use patterns like "[City] [Category] News" or "[County] [Category] Update"
❌ DON'T: Write titles that sound like search queries or database entries
❌ DON'T: Start with the city/county name unless it's essential to the story

GOOD EXAMPLES (notice most don't lead with location):
- "Winter Storm Warning Issued Through Thursday"
- "New Farm-to-Table Restaurant Opens on Main Street"
- "City Council Approves $2M Budget for Road Repairs"
- "Eagles Take Regional Championship in Overtime Thriller"
- "Downtown Farmers Market Expands to Year-Round Schedule"
- "Tech Startup Brings 200 Jobs to Former Mill Building"

BAD EXAMPLES (NEVER DO THIS):
- "${serviceArea.city} News Update" ❌
- "${serviceArea.city} Business Report" ❌
- "${serviceArea.city} Sports News" ❌
- "What's Happening in ${serviceArea.city}" ❌
- "${serviceArea.city}'s Economy Thrives" ❌ (generic, no specifics)
${existingTitles && existingTitles.length > 0 ? `
EXISTING TITLES TO AVOID DUPLICATING:
${existingTitles.map(t => `- "${t}"`).join('\n')}
Your article MUST cover a DIFFERENT topic and angle than all of the above.
` : ''}

CONTENT:
${isWebSearch
  ? `[First paragraph - Strong lead with the most important facts, written in active voice]

[Second paragraph - Supporting details and context from source material]

[Additional paragraphs ONLY if source material supports them]`
  : `[First paragraph - MUST start with "According to ${sourceName}..." or similar attribution]

[Second paragraph - continue with source attribution]

[Additional paragraphs ONLY if source material supports them - each with attribution]`}

TAGS: [keywords extracted from source only]

Article Requirements:
- 6-10 paragraphs — write a FULL, substantive article, not a brief summary
- Professional journalistic tone appropriate for local news
- Include subheadings (## format) for longer articles to improve readability
- Include relevant local context ONLY if mentioned in sources
${isWebSearch
  ? `- Write in active, engaging news style WITHOUT repetitive attribution phrases
- Present facts directly and confidently as verified reporting
- Use varied sentence structures and natural transitions`
  : `- Attribute ALL facts to sources (mandatory in every paragraph)
- Cite the original source for all claims`}
- Use direct quotes ONLY if they appear verbatim in source material
- When in doubt, stick to what's verifiable - accuracy over length`;

  return prompt;
}

/**
 * Build a search query for web search based on category and location
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
    'news': `latest breaking news in ${location} today ${today}`,
    'local': `local ${location} news and community stories ${today}`,
    'local-news': `local ${location} news and community stories ${today}`,
    'sports': `${location} sports news and high school athletics ${today}`,
    'business': `${location} business news, economic development, and local commerce ${today}`,
    'politics': `${location} politics, government decisions, and policy news ${today}`,
    'education': `${location} schools, colleges, and education news ${today}`,
    'weather': `${location} weather forecast, severe weather alerts ${today}`,
    'arts': `${location} arts, culture, and entertainment events ${today}`,
    'arts-entertainment': `${location} arts, culture, and entertainment events ${today}`,
    'health': `${location} health care, medical news, and wellness ${today}`,
    'health-wellness': `${location} health care, medical news, and wellness ${today}`,
    'environment': `${location} environmental news, conservation, outdoor recreation ${today}`,
    'community': `${location} community events and local happenings ${today}`,
    'real-estate': `${location} real estate news, housing market, property ${today}`,
  };

  return beatQueries[beat.toLowerCase()] || `${location} ${beat} news ${today}`;
}
