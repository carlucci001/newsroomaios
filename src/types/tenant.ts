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

  // Service Area
  serviceArea: ServiceArea;

  // Categories
  categories: NewsCategory[];

  // Status
  status: 'provisioning' | 'seeding' | 'active' | 'suspended';
  licensingStatus: 'trial' | 'active' | 'past_due' | 'canceled';

  // Timestamps
  createdAt: Date;
  trialEndsAt?: Date;

  // Branding (optional)
  settings?: {
    primaryColor?: string;
    logo?: string;
    tagline?: string;
  };
}
