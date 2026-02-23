/**
 * AI Journalist Types for Newsroom AIOS
 *
 * AI journalists are automated content generators that write articles
 * for specific categories based on schedules.
 */

export interface JournalistSchedule {
  enabled?: boolean;       // Legacy field — use isEnabled
  isEnabled?: boolean;     // Current field name in Firestore
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;           // "09:00" for daily, unused for hourly
  daysOfWeek?: number[];   // 0=Sun, 1=Mon, etc. for weekly
  timezone?: string;       // IANA timezone (e.g., "America/New_York")
  lastRunAt?: string;      // ISO string of last run
  nextRunAt?: string;      // ISO string of next scheduled run
}

export interface AIJournalist {
  id: string;
  tenantId: string;

  // Identity
  name: string; // "Local News Reporter"
  slug: string; // "local-news-reporter"

  // Assignment
  categoryId: string; // References NewsCategory
  categoryName?: string; // Denormalized for display

  // Persona & Style
  persona: string; // "Experienced local journalist covering..."
  writingStyle?: 'formal' | 'casual' | 'investigative' | 'feature';
  targetWordCount?: number; // Default: 400-600

  // Schedule
  schedule: JournalistSchedule;
  articlesPerRun: number; // How many articles per scheduled run

  // Status
  status: 'active' | 'paused' | 'disabled';
  isActive?: boolean;
  lastRunAt?: Date | string;
  nextRunAt?: Date | string;
  articlesGenerated: number; // Total articles generated

  // Metrics (populated by updateAgentAfterRun)
  metrics?: {
    totalArticlesGenerated: number;
    totalPostsCreated: number;
    successfulRuns: number;
    failedRuns: number;
    averageGenerationTime?: number;
    lastSuccessfulRun?: string;
  };

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Calculate the initial nextRunAt for a newly created journalist.
 * Finds the next occurrence of the given time in the given timezone.
 */
function calculateInitialNextRunAt(time: string, timezone: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();

  // Get today's date parts in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

  const currentHour = parseInt(getPart('hour'), 10);
  const currentMinute = parseInt(getPart('minute'), 10);

  // If the scheduled time is still ahead today, use today; otherwise tomorrow
  const isToday = currentHour < hour || (currentHour === hour && currentMinute < minute);

  // Build a date string in the target timezone
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const targetDay = isToday
    ? parseInt(day, 10)
    : parseInt(day, 10) + 1;

  // Create a date object — use a simple approach: set today/tomorrow at the target time
  const dateStr = `${year}-${month}-${String(targetDay).padStart(2, '0')}T${time}:00`;

  // Parse in the target timezone by using a known offset technique
  const target = new Date(dateStr + 'Z'); // Treat as UTC first
  // Calculate the timezone offset
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const offsetMs = utcDate.getTime() - tzDate.getTime();
  target.setTime(target.getTime() + offsetMs);

  return target.toISOString();
}

// Default schedules staggered throughout the day
export function createDefaultJournalists(
  tenantId: string,
  businessName: string,
  categories: Array<{ id: string; name: string; slug: string; directive: string }>
): Omit<AIJournalist, 'id'>[] {
  const baseHour = 6; // Start at 6 AM

  const timezone = 'America/New_York';

  return categories.map((category, idx) => {
    const time = `${String(baseHour + idx).padStart(2, '0')}:00`;
    // Calculate initial nextRunAt so the cron can match on first run
    const nextRunAt = calculateInitialNextRunAt(time, timezone);

    return {
      tenantId,
      name: `${category.name} Reporter`,
      slug: `${category.slug}-reporter`,
      categoryId: category.id,
      categoryName: category.name,
      persona: `Experienced local journalist covering ${category.name.toLowerCase()} for ${businessName}. ${category.directive}`,
      writingStyle: 'formal' as const,
      targetWordCount: 500,
      schedule: {
        isEnabled: true,
        frequency: 'daily' as const,
        time,
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        timezone,
      },
      articlesPerRun: 1,
      status: 'active' as const,
      isActive: true,
      articlesGenerated: 0,
      nextRunAt,
      createdAt: new Date(),
    };
  });
}

// Default content sources based on location
export interface ContentSource {
  id: string;
  tenantId: string;
  name: string;
  type: 'rss' | 'website' | 'api';
  url: string;
  categoryId?: string;
  enabled: boolean;
  lastFetchedAt?: Date;
  createdAt: Date;
}

export function createDefaultContentSources(
  tenantId: string,
  city: string,
  state: string
): Omit<ContentSource, 'id'>[] {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateSlug = state.toLowerCase();

  return [
    {
      tenantId,
      name: `${city} Local News (Google)`,
      type: 'rss' as const,
      url: `https://news.google.com/rss/search?q=${encodeURIComponent(city + ' ' + state)}&hl=en-US`,
      enabled: true,
      createdAt: new Date(),
    },
    {
      tenantId,
      name: `${state} State News`,
      type: 'rss' as const,
      url: `https://news.google.com/rss/search?q=${encodeURIComponent(state + ' news')}&hl=en-US`,
      enabled: true,
      createdAt: new Date(),
    },
  ];
}
