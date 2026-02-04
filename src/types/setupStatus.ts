/**
 * Setup status tracking for new tenant onboarding
 * Tracks progress through the paper creation process
 */

export type SetupStep =
  | 'account_created'
  | 'payment_received'
  | 'journalists_created'
  | 'generating_local_news'
  | 'generating_sports'
  | 'generating_business'
  | 'generating_weather'
  | 'generating_community'
  | 'generating_opinion'
  | 'deploying_site'
  | 'complete';

export interface SetupProgress {
  currentStep: SetupStep | string; // Can be dynamic like "generating_agriculture"
  completedSteps: (SetupStep | string)[];
  articlesGenerated: number;
  totalArticles: number;
  currentCategory?: string;
  categoryProgress: {
    [categoryId: string]: {
      name: string;
      generated: number;
      total: number;
      status: 'pending' | 'in_progress' | 'complete' | 'error';
    };
  };
  startedAt: Date;
  lastUpdatedAt: Date;
  estimatedCompletion?: Date;
  errors: string[];
  siteUrl?: string;
}

export const STEP_LABELS: Record<SetupStep, string> = {
  account_created: 'Account Created',
  payment_received: 'Payment Received',
  journalists_created: 'AI Journalists Assigned',
  generating_local_news: 'Generating Local News',
  generating_sports: 'Generating Sports',
  generating_business: 'Generating Business',
  generating_weather: 'Generating Weather',
  generating_community: 'Generating Community',
  generating_opinion: 'Generating Opinion',
  deploying_site: 'Deploying Your Site',
  complete: 'Complete!',
};

export const STEP_ORDER: SetupStep[] = [
  'account_created',
  'payment_received',
  'journalists_created',
  'generating_local_news',
  'generating_sports',
  'generating_business',
  'generating_weather',
  'generating_community',
  'generating_opinion',
  'deploying_site',
  'complete',
];

export function getStepIndex(step: SetupStep | string): number {
  // First check if it's in the standard STEP_ORDER
  const index = STEP_ORDER.indexOf(step as SetupStep);
  if (index !== -1) return index;

  // Handle dynamic step names like "generating_agriculture", "generating_crime"
  // These are all in the article generation phase (after journalists_created, before deploying_site)
  if (typeof step === 'string' && step.startsWith('generating_')) {
    // Return index equivalent to mid-generation phase (between journalists_created and deploying_site)
    const journalistsIndex = STEP_ORDER.indexOf('journalists_created');
    const deployingIndex = STEP_ORDER.indexOf('deploying_site');
    // Return a value in the middle of the generation range
    return Math.floor((journalistsIndex + deployingIndex) / 2);
  }

  // Unknown step - return 0 to avoid negative percentages
  return 0;
}

export function isStepComplete(currentStep: SetupStep | string, checkStep: SetupStep): boolean {
  return getStepIndex(currentStep) > getStepIndex(checkStep);
}

export function getProgressPercentage(progress: SetupProgress): number {
  const stepWeight = 0.3; // Steps account for 30%
  const articleWeight = 0.7; // Articles account for 70%

  // For article generation phase, step progress should reflect we're in the generation phase
  const stepIndex = getStepIndex(progress.currentStep);
  const maxStepIndex = STEP_ORDER.length - 1;

  // Ensure stepIndex is never negative
  const safeStepIndex = Math.max(0, stepIndex);
  const stepProgress = (safeStepIndex / maxStepIndex) * stepWeight;

  // Article progress is the main indicator during generation
  const articleProgress = progress.totalArticles > 0
    ? (progress.articlesGenerated / progress.totalArticles) * articleWeight
    : 0;

  return Math.min(100, Math.round((stepProgress + articleProgress) * 100));
}
