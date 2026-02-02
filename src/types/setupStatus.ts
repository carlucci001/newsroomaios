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
  currentStep: SetupStep;
  completedSteps: SetupStep[];
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

export function getStepIndex(step: SetupStep): number {
  return STEP_ORDER.indexOf(step);
}

export function isStepComplete(currentStep: SetupStep, checkStep: SetupStep): boolean {
  return getStepIndex(currentStep) > getStepIndex(checkStep);
}

export function getProgressPercentage(progress: SetupProgress): number {
  const stepWeight = 0.3; // Steps account for 30%
  const articleWeight = 0.7; // Articles account for 70%

  const stepProgress = (getStepIndex(progress.currentStep) / (STEP_ORDER.length - 1)) * stepWeight;
  const articleProgress = progress.totalArticles > 0
    ? (progress.articlesGenerated / progress.totalArticles) * articleWeight
    : 0;

  return Math.min(100, Math.round((stepProgress + articleProgress) * 100));
}
