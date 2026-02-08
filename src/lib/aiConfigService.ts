/**
 * AI Configuration Service
 * Loads platform-wide AI settings from Firestore with caching.
 * Used by API routes (server-side) to read centralized AI config.
 */

import { getAdminDb } from '@/lib/firebaseAdmin';

export interface AIConfig {
  gemini: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    topK: number;
  };
  webSearch: {
    model: string;
    maxTokens: number;
    temperature: number;
    searchDomainFilter: string[];
    searchRecencyFilter: string;
  };
  tone: {
    writingStyle: 'formal' | 'conversational' | 'investigative' | 'neutral';
    aggressiveness: 'aggressive' | 'neutral' | 'conservative';
    customSystemInstruction?: string;
  };
  articleLength: {
    targetWordCount?: number;
    richSourceWords: string;
    moderateSourceWords: string;
    adequateSourceWords: string;
    limitedSourceWords: string;
  };
  seeding: {
    articlesPerCategory: number;
    webSearchArticles: number;
  };
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  gemini: {
    model: 'gemini-2.0-flash',
    temperature: 0.1,
    maxTokens: 2800,
    topP: 0.8,
    topK: 20,
  },
  webSearch: {
    model: 'sonar',
    maxTokens: 1500,
    temperature: 0.1,
    searchDomainFilter: ['news'],
    searchRecencyFilter: 'week',
  },
  tone: {
    writingStyle: 'neutral',
    aggressiveness: 'neutral',
  },
  articleLength: {
    richSourceWords: '800-1200',
    moderateSourceWords: '600-900',
    adequateSourceWords: '500-750',
    limitedSourceWords: '400-600',
  },
  seeding: {
    articlesPerCategory: 6,
    webSearchArticles: 2,
  },
};

// In-memory cache with 5-minute TTL
let cachedConfig: AIConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Load AI configuration from Firestore, merging with defaults.
 * Caches for 5 minutes to avoid repeated Firestore reads.
 */
export async function getAIConfig(): Promise<AIConfig> {
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const db = getAdminDb();
    if (!db) return DEFAULT_AI_CONFIG;

    const docRef = db.collection('settings').doc('aiConfig');
    const snapshot = await docRef.get();

    if (!snapshot.exists) return DEFAULT_AI_CONFIG;

    const data = snapshot.data() || {};
    cachedConfig = {
      gemini: { ...DEFAULT_AI_CONFIG.gemini, ...data.gemini },
      webSearch: { ...DEFAULT_AI_CONFIG.webSearch, ...data.webSearch },
      tone: { ...DEFAULT_AI_CONFIG.tone, ...data.tone },
      articleLength: { ...DEFAULT_AI_CONFIG.articleLength, ...data.articleLength },
      seeding: { ...DEFAULT_AI_CONFIG.seeding, ...data.seeding },
    };
    cacheTimestamp = now;
    return cachedConfig;
  } catch (error) {
    console.error('[AIConfig] Failed to load:', error);
    return DEFAULT_AI_CONFIG;
  }
}

/** Clear the in-memory cache (call after saving new settings) */
export function clearAIConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}
