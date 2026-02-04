export interface ServiceArea {
  city: string;
  state: string;
  region?: string;  // County or region name
  zipCode?: string;
}

export interface NewsCategory {
  id: string;
  name: string;         // "Local News", "Sports", etc.
  slug: string;         // "local-news"
  directive: string;    // AI guidance for article generation
  enabled: boolean;
}

export interface OnboardingProgress {
  id: string;
  resumeToken: string;         // Unique token for resume link
  currentStep: number;         // 1-6

  // Step 1: Domain Selection
  domainOption?: 'have' | 'check' | 'help';
  domain?: string;

  // Step 2: Service Area
  serviceArea?: ServiceArea;

  // Step 3: Categories
  selectedCategories?: string[];  // Array of 6 category IDs

  // Step 4-6: Will be added in future phases

  // Metadata
  ownerEmail: string;
  newspaperName: string;
  status: 'in_progress' | 'seeding' | 'complete';
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;                    // Firestore doc ID
  businessName: string;          // "Mountain View Times"
  slug: string;                  // "mountain-view-times"
  domain: string;                // "mountainviewtimes.com"
  ownerEmail: string;
  ownerId?: string;              // Firebase Auth UID (after signup)

  // API Access
  apiKey: string;                // For credit API authentication

  // Service Area
  serviceArea: ServiceArea;

  // Categories
  categories: NewsCategory[];

  // Status
  status: 'provisioning' | 'seeding' | 'deploying' | 'active' | 'suspended' | 'deployment_failed';
  licensingStatus: 'trial' | 'active' | 'past_due' | 'canceled';

  // Billing
  plan?: 'starter' | 'growth' | 'professional' | 'enterprise';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  billingStatus?: 'current' | 'past_due' | 'cancelled';

  // Deployment Management (Vercel)
  vercelProjectId?: string;
  vercelDeploymentId?: string;
  siteUrl?: string;              // e.g., "https://the42.newsroomaios.com"
  subdomain?: string;            // e.g., "the42.newsroomaios.com"
  customDomain?: string;         // e.g., "the42news.com" (tenant's own domain)
  currentVersion?: string;       // Template version, e.g., "v1.0.1"
  deployedAt?: Date;
  deploymentError?: string;

  // Timestamps
  createdAt: Date;
  trialEndsAt?: Date;
  lastUpdatedAt?: Date;

  // Branding (optional)
  settings?: {
    primaryColor?: string;
    logo?: string;
    tagline?: string;
  };

  // Platform connection
  platformUrl?: string;          // e.g., "https://newsroomaios.com"

  // AI Configuration
  editorInChiefDirective?: string;  // Global editorial voice/style guide
  aiSettings?: {
    defaultModel?: string;          // e.g., 'gemini-2.0-flash'
    defaultTemperature?: number;    // 0.1 - 1.0
    enableWebSearch?: boolean;      // Use Perplexity for research
  };
}
