/**
 * Types for AI article generation API
 */

export interface SourceContent {
  title: string;
  description: string;
  fullContent?: string;
  url?: string;
  sourceName?: string;
}

export interface GenerateArticleRequest {
  // Authentication (validated via headers)
  tenantId: string;

  // Source Material (at least one required)
  sourceContent?: SourceContent;

  // OR use web search mode
  useWebSearch?: boolean;
  searchQuery?: string;

  // Prompt Configuration
  categoryId: string;
  articleSpecificPrompt?: string;

  // AI Journalist Identity
  journalistId?: string;
  journalistName?: string;

  // Output Options
  generateImage?: boolean;
  generateSEO?: boolean;
  targetWordCount?: number;
  writingStyle?: 'formal' | 'conversational' | 'investigative';

  // Platform-only: skip credit check/deduct during initial seeding
  skipCredits?: boolean;

  // Skip the editing pass (e.g. during bulk seeding for speed)
  skipEditingPass?: boolean;

  // Existing titles to avoid duplicating (passed during seeding)
  existingTitles?: string[];
}

export interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  slug: string;

  // SEO (if requested)
  metaDescription?: string;
  keywords?: string[];
  hashtags?: string[];

  // Image (if requested)
  imageUrl?: string;
  imageAttribution?: string;
}

export interface GenerateArticleResponse {
  success: boolean;
  article?: GeneratedArticle;

  // Credit usage
  creditsUsed: number;
  creditsRemaining: number;

  // Metadata
  generationTimeMs: number;
  model: string;

  error?: string;
}

export interface PromptContext {
  tenantId: string;
  businessName: string;
  serviceArea: {
    city: string;
    state: string;
    region?: string;
  };
  editorInChiefDirective?: string;
  categoryName: string;
  categoryDirective: string;
  articleSpecificPrompt?: string;
  journalistName?: string;
  journalistPersona?: string;
  sourceContent?: SourceContent;
  targetWordCount?: number;
  writingStyle?: string;
  aggressiveness?: 'aggressive' | 'neutral' | 'conservative';
  articleLengthConfig?: {
    richSourceWords?: string;
    moderateSourceWords?: string;
    adequateSourceWords?: string;
    limitedSourceWords?: string;
  };
  existingTitles?: string[];
}
