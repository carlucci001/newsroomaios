/**
 * Gemini AI SDK wrapper for article generation
 * Ported from WNCT-next
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client lazily
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface GenerationConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

const DEFAULT_CONFIG: GenerationConfig = {
  model: 'gemini-2.0-flash',
  maxTokens: 2800,
  temperature: 0.1,
  topP: 0.8,
  topK: 20,
};

/**
 * Generate content using Gemini AI
 */
export async function generateContent(
  prompt: string,
  config: GenerationConfig = {},
  systemInstruction?: string
): Promise<string> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const ai = getGenAI();

  const model = ai.getGenerativeModel({
    model: mergedConfig.model!,
    systemInstruction: systemInstruction || undefined,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: mergedConfig.maxTokens,
      temperature: mergedConfig.temperature,
      topP: mergedConfig.topP,
      topK: mergedConfig.topK,
    },
  });

  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('No response from Gemini API');
  }

  return text;
}

/**
 * System instruction for factual news writing
 */
export const NEWS_SYSTEM_INSTRUCTION =
  "You are a factual news writing assistant. You NEVER fabricate information. " +
  "You ONLY write about facts explicitly stated in provided sources. " +
  "You MUST attribute every claim to sources. If information is missing, " +
  "you acknowledge gaps rather than inventing details. Accuracy is more important " +
  "than article length. You follow AP style guidelines strictly.";

/**
 * Rate an article for quality using Gemini
 * Returns a score from 1-10
 */
export async function rateArticleQuality(
  title: string,
  description: string,
  sourceName: string,
  beat: string,
  editorialDirective?: string
): Promise<number> {
  const prompt = `You are a news editor evaluating articles for a ${beat} journalist.

ARTICLE TO RATE:
Title: ${title}
Description: ${description || 'No description'}
Source: ${sourceName || 'Unknown'}

EVALUATION CRITERIA:
1. Relevance to ${beat} beat (40 points)
2. Quality and depth of content (30 points)
3. Newsworthiness and timeliness (20 points)
4. Editorial fit: ${editorialDirective || 'General interest local news'} (10 points)

Rate this article from 1-10 where:
- 9-10: Excellent fit, high quality, very newsworthy
- 7-8: Good fit, solid quality
- 5-6: Moderate fit, acceptable quality
- 3-4: Weak fit or quality issues
- 1-2: Poor fit or low quality

Respond ONLY with a single number from 1-10. No explanation needed.`;

  try {
    const response = await generateContent(prompt, {
      temperature: 0.2,
      maxTokens: 10,
    });

    const score = parseInt(response.trim(), 10);

    if (isNaN(score) || score < 1 || score > 10) {
      console.warn(`Invalid score "${response}" for article, defaulting to 5`);
      return 5;
    }

    return score;
  } catch (error) {
    console.error('Error rating article:', error);
    return 5;
  }
}
