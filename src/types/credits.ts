/**
 * Credit System Types for Newsroom AIOS
 *
 * Credit-based billing for AI features:
 * - Article generation
 * - Image generation
 * - Fact-checking
 * - SEO optimization
 */

export interface CreditPlan {
  id: string;
  name: string;                    // "Starter", "Professional", "Enterprise"
  monthlyCredits: number;          // Credits included per month
  pricePerMonth: number;           // USD
  pricePerCredit: number;          // For overage charges
  features: string[];              // Plan features for display
  maxAIJournalists: number;        // Concurrent AI journalists allowed
  maxArticlesPerDay: number;       // Daily limit
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
}

export interface CreditUsage {
  id: string;
  tenantId: string;
  action: 'article_generation' | 'image_generation' | 'fact_check' | 'seo_optimization' | 'web_search';
  creditsUsed: number;
  description: string;             // "Generated article: Local Events..."
  articleId?: string;              // Reference to generated article
  timestamp: Date;
  metadata?: {
    model?: string;                // "gemini-2.0-flash"
    tokensUsed?: number;
    sourceType?: string;           // "rss", "web-search"
  };
}

export interface TenantCredits {
  id: string;                      // Same as tenantId
  tenantId: string;
  planId: string;                  // Reference to CreditPlan

  // Current billing cycle
  cycleStartDate: Date;
  cycleEndDate: Date;

  // Credit balance
  monthlyAllocation: number;       // Credits from plan
  creditsUsed: number;             // Used this cycle
  creditsRemaining: number;        // monthlyAllocation - creditsUsed
  overageCredits: number;          // Credits used beyond allocation

  // Limits
  hardLimit: number;               // Stop all AI at this limit (0 = no limit)
  softLimit: number;               // Send warning at this limit
  softLimitWarned: boolean;        // Whether warning was sent

  // Status
  status: 'active' | 'warning' | 'suspended' | 'exhausted';
  lastUsageAt?: Date;

  // Billing
  stripeSubscriptionId?: string;
  nextBillingDate?: Date;
}

export interface CreditTransaction {
  id: string;
  tenantId: string;
  type: 'allocation' | 'usage' | 'adjustment' | 'rollover' | 'purchase';
  amount: number;                  // Positive = add, negative = deduct
  balance: number;                 // Balance after transaction
  description: string;
  createdAt: Date;
  createdBy?: string;              // Admin UID for adjustments
  reference?: string;              // External reference (Stripe charge ID, etc.)
}

// Credit costs for different operations
export const CREDIT_COSTS = {
  article_generation: 10,          // Per article
  image_generation: 5,             // Per image
  fact_check: 2,                   // Per fact check
  seo_optimization: 3,             // Per SEO pass
  web_search: 1,                   // Per search query
} as const;

// Default plans
export const DEFAULT_PLANS: CreditPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyCredits: 500,
    pricePerMonth: 49,
    pricePerCredit: 0.15,
    features: [
      '500 AI credits/month',
      '2 AI journalists',
      '10 articles/day',
      'Community support',
      'Basic analytics',
    ],
    maxAIJournalists: 2,
    maxArticlesPerDay: 10,
    supportLevel: 'community',
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyCredits: 2000,
    pricePerMonth: 149,
    pricePerCredit: 0.10,
    features: [
      '2,000 AI credits/month',
      '5 AI journalists',
      '50 articles/day',
      'Email support',
      'Advanced analytics',
      'Custom branding',
    ],
    maxAIJournalists: 5,
    maxArticlesPerDay: 50,
    supportLevel: 'email',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyCredits: 10000,
    pricePerMonth: 499,
    pricePerCredit: 0.05,
    features: [
      '10,000 AI credits/month',
      'Unlimited AI journalists',
      'Unlimited articles/day',
      'Priority support',
      'Full analytics suite',
      'Custom integrations',
      'Dedicated account manager',
    ],
    maxAIJournalists: -1, // Unlimited
    maxArticlesPerDay: -1, // Unlimited
    supportLevel: 'dedicated',
  },
];
