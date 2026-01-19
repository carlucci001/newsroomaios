import { NewsCategory } from '@/types/tenant';

export const PREDEFINED_CATEGORIES: NewsCategory[] = [
  {
    id: 'local-news',
    name: 'Local News',
    slug: 'local-news',
    directive: 'Cover local community events, city council meetings, local business openings, neighborhood developments, and stories that directly impact residents in the service area.',
    enabled: true,
  },
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    directive: 'Cover high school sports, local recreational leagues, community athletics, youth sports achievements, and local athletes making news.',
    enabled: true,
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    directive: 'Cover local business news, new store openings, economic development, entrepreneurship, local job market, and business success stories in the service area.',
    enabled: true,
  },
  {
    id: 'politics',
    name: 'Politics',
    slug: 'politics',
    directive: 'Cover local government, elections, policy decisions, town halls, county board meetings, and political issues affecting the local community.',
    enabled: true,
  },
  {
    id: 'entertainment',
    name: 'Arts & Entertainment',
    slug: 'entertainment',
    directive: 'Cover local arts scene, theater productions, music events, cultural festivals, gallery openings, and entertainment options in the service area.',
    enabled: true,
  },
  {
    id: 'weather',
    name: 'Weather',
    slug: 'weather',
    directive: 'Cover local weather forecasts, seasonal changes, severe weather alerts, climate impacts on the community, and weather-related local stories.',
    enabled: true,
  },
  {
    id: 'education',
    name: 'Education',
    slug: 'education',
    directive: 'Cover local schools, student achievements, school board meetings, education policy, teacher spotlights, and educational programs in the service area.',
    enabled: true,
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    slug: 'health',
    directive: 'Cover local healthcare news, wellness programs, health initiatives, hospital updates, fitness trends, and health resources available in the community.',
    enabled: true,
  },
  {
    id: 'community',
    name: 'Community',
    slug: 'community',
    directive: 'Cover volunteer efforts, charity events, community organizations, local heroes, neighborhood stories, and human interest pieces that unite the community.',
    enabled: true,
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    slug: 'real-estate',
    directive: 'Cover local housing market trends, new developments, property sales, real estate advice, and housing news affecting the service area.',
    enabled: true,
  },
];