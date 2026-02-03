import { NewsCategory } from '@/types/tenant';

export const PREDEFINED_CATEGORIES: NewsCategory[] = [
  // Core News Categories
  {
    id: 'local-news',
    name: 'Local News',
    slug: 'local-news',
    directive: 'Cover local community events, city council meetings, local business openings, neighborhood developments, and stories that directly impact residents in the service area.',
    enabled: true,
  },
  {
    id: 'breaking-news',
    name: 'Breaking News',
    slug: 'breaking-news',
    directive: 'Cover urgent breaking news, emergency situations, major announcements, and time-sensitive stories affecting the local community.',
    enabled: true,
  },
  {
    id: 'politics',
    name: 'Politics & Government',
    slug: 'politics',
    directive: 'Cover local government, elections, policy decisions, town halls, county board meetings, and political issues affecting the local community.',
    enabled: true,
  },
  {
    id: 'crime',
    name: 'Crime & Public Safety',
    slug: 'crime',
    directive: 'Cover local crime reports, police activity, court proceedings, public safety initiatives, and law enforcement news in the service area.',
    enabled: true,
  },

  // Business & Economy
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    directive: 'Cover local business news, new store openings, economic development, entrepreneurship, local job market, and business success stories in the service area.',
    enabled: true,
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    slug: 'real-estate',
    directive: 'Cover local housing market trends, new developments, property sales, real estate advice, and housing news affecting the service area.',
    enabled: true,
  },
  {
    id: 'jobs',
    name: 'Jobs & Employment',
    slug: 'jobs',
    directive: 'Cover local job market, employment opportunities, workforce development, career advice, and major employer news in the service area.',
    enabled: true,
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Farming',
    slug: 'agriculture',
    directive: 'Cover local farming news, agricultural markets, crop reports, livestock updates, and rural community stories in the service area.',
    enabled: true,
  },

  // Sports & Recreation
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    directive: 'Cover high school sports, local recreational leagues, community athletics, youth sports achievements, and local athletes making news.',
    enabled: true,
  },
  {
    id: 'high-school-sports',
    name: 'High School Sports',
    slug: 'high-school-sports',
    directive: 'Cover high school football, basketball, baseball, soccer, and all varsity sports. Include game recaps, player spotlights, and championship coverage.',
    enabled: true,
  },
  {
    id: 'college-sports',
    name: 'College Sports',
    slug: 'college-sports',
    directive: 'Cover local college and university athletics, game coverage, recruiting news, and student athlete achievements.',
    enabled: true,
  },
  {
    id: 'outdoors',
    name: 'Outdoors & Recreation',
    slug: 'outdoors',
    directive: 'Cover hunting, fishing, hiking, camping, parks, trails, and outdoor recreation opportunities in the service area.',
    enabled: true,
  },

  // Lifestyle & Culture
  {
    id: 'entertainment',
    name: 'Arts & Entertainment',
    slug: 'entertainment',
    directive: 'Cover local arts scene, theater productions, music events, cultural festivals, gallery openings, and entertainment options in the service area.',
    enabled: true,
  },
  {
    id: 'food-dining',
    name: 'Food & Dining',
    slug: 'food-dining',
    directive: 'Cover local restaurants, food trends, new eateries, chef spotlights, food events, and dining reviews in the service area.',
    enabled: true,
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    slug: 'lifestyle',
    directive: 'Cover lifestyle trends, home and garden, fashion, personal finance tips, and quality of life stories for local residents.',
    enabled: true,
  },
  {
    id: 'faith',
    name: 'Faith & Religion',
    slug: 'faith',
    directive: 'Cover local churches, religious events, faith community news, charitable works, and spiritual interest stories.',
    enabled: true,
  },
  {
    id: 'pets-animals',
    name: 'Pets & Animals',
    slug: 'pets-animals',
    directive: 'Cover local animal shelters, pet adoptions, veterinary news, wildlife stories, and pet-related events in the community.',
    enabled: true,
  },

  // Community & People
  {
    id: 'community',
    name: 'Community',
    slug: 'community',
    directive: 'Cover volunteer efforts, charity events, community organizations, local heroes, neighborhood stories, and human interest pieces that unite the community.',
    enabled: true,
  },
  {
    id: 'obituaries',
    name: 'Obituaries',
    slug: 'obituaries',
    directive: 'Publish obituaries, death notices, and memorial tributes honoring community members who have passed away.',
    enabled: true,
  },
  {
    id: 'events',
    name: 'Events & Calendar',
    slug: 'events',
    directive: 'Cover upcoming local events, festivals, fairs, concerts, community gatherings, and things to do in the service area.',
    enabled: true,
  },
  {
    id: 'seniors',
    name: 'Senior Living',
    slug: 'seniors',
    directive: 'Cover news and resources for seniors, retirement living, Medicare updates, senior center activities, and aging-related topics.',
    enabled: true,
  },
  {
    id: 'veterans',
    name: 'Veterans & Military',
    slug: 'veterans',
    directive: 'Cover veteran affairs, military news, VA updates, veteran spotlights, and military family support in the community.',
    enabled: true,
  },

  // Education & Youth
  {
    id: 'education',
    name: 'Education',
    slug: 'education',
    directive: 'Cover local schools, student achievements, school board meetings, education policy, teacher spotlights, and educational programs in the service area.',
    enabled: true,
  },
  {
    id: 'youth',
    name: 'Youth & Teens',
    slug: 'youth',
    directive: 'Cover youth activities, teen achievements, youth organizations, summer programs, and stories featuring young people in the community.',
    enabled: true,
  },

  // Health & Environment
  {
    id: 'health',
    name: 'Health & Wellness',
    slug: 'health',
    directive: 'Cover local healthcare news, wellness programs, health initiatives, hospital updates, fitness trends, and health resources available in the community.',
    enabled: true,
  },
  {
    id: 'environment',
    name: 'Environment',
    slug: 'environment',
    directive: 'Cover local environmental issues, conservation efforts, sustainability initiatives, recycling programs, and green living in the service area.',
    enabled: true,
  },
  {
    id: 'weather',
    name: 'Weather',
    slug: 'weather',
    directive: 'Cover local weather forecasts, seasonal changes, severe weather alerts, climate impacts on the community, and weather-related local stories.',
    enabled: true,
  },

  // Transportation & Infrastructure
  {
    id: 'transportation',
    name: 'Transportation',
    slug: 'transportation',
    directive: 'Cover road construction, traffic updates, public transit, transportation projects, and commuting news in the service area.',
    enabled: true,
  },
  {
    id: 'development',
    name: 'Development & Growth',
    slug: 'development',
    directive: 'Cover new construction projects, zoning changes, urban development, infrastructure improvements, and growth planning in the community.',
    enabled: true,
  },

  // Special Interest
  {
    id: 'technology',
    name: 'Technology',
    slug: 'technology',
    directive: 'Cover local tech companies, innovation news, digital trends, cybersecurity awareness, and technology impacts on the community.',
    enabled: true,
  },
  {
    id: 'tourism',
    name: 'Tourism & Travel',
    slug: 'tourism',
    directive: 'Cover local tourism, travel destinations, visitor attractions, hotel news, and tourism industry updates in the service area.',
    enabled: true,
  },
  {
    id: 'history',
    name: 'Local History',
    slug: 'history',
    directive: 'Cover local history, historical landmarks, heritage preservation, nostalgic stories, and historical anniversaries in the community.',
    enabled: true,
  },

  // Opinion & Editorial
  {
    id: 'opinion',
    name: 'Opinion',
    slug: 'opinion',
    directive: 'Publish editorial opinions, guest columns, letters to the editor, and commentary on local issues affecting the community.',
    enabled: true,
  },
  {
    id: 'letters',
    name: 'Letters to Editor',
    slug: 'letters',
    directive: 'Publish reader-submitted letters addressing local issues, community concerns, and responses to news coverage.',
    enabled: true,
  },
];
