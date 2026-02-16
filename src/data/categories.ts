import { NewsCategory } from '@/types/tenant';

export const PREDEFINED_CATEGORIES: NewsCategory[] = [
  // Core News Categories
  {
    id: 'news',
    name: 'News',
    slug: 'news',
    directive: 'Lead with the direct impact on local residents — what changed, who is affected, and what happens next. Prioritize official sources: city council actions, police reports, school board decisions, and government agency statements. Provide context for policy decisions by explaining what prompted them and what they mean practically. When covering emergencies or crime, include safety information and community resources.',
    enabled: true,
  },
  {
    id: 'breaking-news',
    name: 'Breaking News',
    slug: 'breaking-news',
    directive: 'Prioritize speed without sacrificing accuracy — confirm key facts before publishing. Lead with what readers need to know right now: what happened, where, and whether they are affected. Include emergency contact numbers, road closures, shelter locations, or safety instructions when relevant. Update the story as new information becomes available rather than waiting for a complete picture.',
    enabled: true,
  },
  {
    id: 'politics',
    name: 'Politics',
    slug: 'politics',
    directive: 'Explain what government decisions mean for everyday residents — not just what was voted on, but how it affects taxes, services, and daily life. Cover both sides of contested issues without false equivalence. Include vote tallies, who voted which way, and the reasoning behind dissenting opinions. Make city council and county board actions accessible by translating bureaucratic language into plain English.',
    enabled: true,
  },
  {
    id: 'crime',
    name: 'Crime',
    slug: 'crime',
    directive: 'Report facts from official sources — police reports, court records, and agency statements — without sensationalizing. Include suspect descriptions only when relevant to public safety. Provide context: is this part of a trend, an isolated incident, or connected to a larger investigation? Always include community safety resources and follow up on outcomes — arrests, charges filed, and court rulings — not just the initial incident.',
    enabled: true,
  },

  // Business & Economy
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    directive: 'Highlight the people behind the businesses — founder stories, motivations, and what they bring to the community. Include practical details readers care about: location, hours, what they offer, and opening dates. Connect individual business stories to broader local economic trends like downtown revitalization, job growth, or industry shifts. Explain how new developments affect specific neighborhoods and residents.',
    enabled: true,
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    slug: 'real-estate',
    directive: 'Translate market data into stories residents can relate to — what do rising prices mean for first-time buyers, what neighborhoods are changing, and why. Cover new developments by explaining what is being built, how many units, price ranges, and timeline. Include the human angle: families finding homes, developers explaining their vision, and long-time residents adapting to neighborhood change. Reference specific streets and areas readers recognize.',
    enabled: true,
  },
  {
    id: 'jobs',
    name: 'Jobs',
    slug: 'jobs',
    directive: 'Focus on specific hiring announcements with actionable details: who is hiring, how many positions, pay ranges, and how to apply. Cover major employer expansions or layoffs with context about the ripple effect on the local economy. Highlight workforce training programs, job fairs, and career resources available to residents. Connect employment stories to broader trends like remote work, automation, or industry shifts affecting the area.',
    enabled: true,
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    slug: 'agriculture',
    directive: 'Tell the stories of local farmers and ranchers — what they grow, the challenges they face, and how weather and markets affect their livelihood. Include seasonal planting and harvest updates with practical information for agricultural readers. Cover farm-to-table connections, farmers markets, and agritourism. Explain how agricultural policy, trade decisions, and climate patterns impact the local farming economy in concrete terms.',
    enabled: true,
  },

  // Sports & Recreation
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    directive: 'Tell the story of the game, not just the score — describe key plays, momentum shifts, and the atmosphere. Spotlight individual athletes and their journeys, especially underdog and comeback stories. Cover high school, recreational, and youth sports with equal enthusiasm. Connect athletic achievements to community pride and school spirit. Include standings and schedules when relevant, but lead with narrative.',
    enabled: true,
  },
  {
    id: 'high-school-sports',
    name: 'High School Sports',
    slug: 'high-school-sports',
    directive: 'Write game recaps that capture the drama — the turning point, the clutch play, the defensive stand that sealed the win. Name the players who made the difference and describe what they did. Cover all varsity sports, not just football and basketball — wrestling, swimming, track, soccer, and volleyball deserve the same energy. Include conference standings, playoff implications, and upcoming matchups. Profile student-athletes balancing academics, sports, and community involvement.',
    enabled: true,
  },
  {
    id: 'college-sports',
    name: 'College Sports',
    slug: 'college-sports',
    directive: 'Cover the local college programs that connect to community identity — game results, coaching changes, recruiting classes, and conference realignment. Profile student-athletes from the area who are competing at the next level. Explain how athletic department decisions — stadium expansions, NIL deals, conference moves — affect the university and surrounding community economically. Include fan perspective and gameday atmosphere.',
    enabled: true,
  },
  {
    id: 'outdoors',
    name: 'Outdoors',
    slug: 'outdoors',
    directive: 'Include seasonal timing, current conditions, and practical tips so readers can plan their outings. Feature lesser-known trails, fishing spots, and parks alongside popular destinations. Connect outdoor stories to conservation efforts, wildlife updates, and land management decisions. Provide family-friendly recommendations with difficulty levels and accessibility notes. Write with the enthusiasm of someone who has been there.',
    enabled: true,
  },

  // Lifestyle & Culture
  {
    id: 'entertainment',
    name: 'Entertainment',
    slug: 'entertainment',
    directive: 'Always include the practical details readers need: event dates, ticket prices, venue location, and how to participate. Profile the artists and performers — who they are, their local connections, and what makes this event special. Preview upcoming seasons and festivals with enough detail to build anticipation. Connect cultural events to community identity and what makes the area unique.',
    enabled: true,
  },
  {
    id: 'food-dining',
    name: 'Food',
    slug: 'food-dining',
    directive: 'Tell the story behind the menu — who is cooking, where they learned, and what makes their food worth the trip. Include the details diners need: location, hours, price range, reservations, and standout dishes. Cover new openings with enough specificity that readers can picture the space and the experience. Highlight food trucks, pop-ups, farmers market vendors, and home-grown food traditions alongside established restaurants.',
    enabled: true,
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    slug: 'lifestyle',
    directive: 'Focus on stories that could only happen in this community — the "only here" angle. Profile long-time residents, community pillars, and unsung heroes. Cover local traditions, seasonal rituals, and the small moments that define neighborhood life. Highlight volunteer efforts, civic engagement, and acts of generosity. Write with warmth and specificity — use names, places, and details that make the story feel intimate and real.',
    enabled: true,
  },
  {
    id: 'faith',
    name: 'Faith',
    slug: 'faith',
    directive: 'Cover faith communities with respect for all traditions — churches, mosques, synagogues, temples, and interfaith groups. Focus on what congregations are doing in the community: food drives, disaster relief, mentoring programs, and outreach. Profile faith leaders and their impact beyond the pulpit. Cover milestone events like church anniversaries, building dedications, and community partnerships. Avoid proselytizing — report on faith as a community force, not a platform for any single doctrine.',
    enabled: true,
  },
  {
    id: 'pets-animals',
    name: 'Pets',
    slug: 'pets-animals',
    directive: 'Lead with adoptable animals — names, personalities, and where to meet them. Cover shelter capacity, fostering needs, and spay/neuter programs with urgency when appropriate. Profile local veterinarians, rescue organizations, and wildlife rehabilitators. Include practical advice: seasonal pet safety, lost pet resources, and local dog parks or pet-friendly businesses. Connect wildlife stories to conservation and habitat changes in the area.',
    enabled: true,
  },

  // Community & People
  {
    id: 'community',
    name: 'Community',
    slug: 'community',
    directive: 'Spotlight the people who hold the community together — volunteers, nonprofit leaders, coaches, neighbors helping neighbors. Tell stories that make residents proud of where they live. Cover fundraisers and charity events with both the cause and the impact: how much was raised, who it helps, and how readers can still contribute. Highlight cross-generational connections, mentorship programs, and grassroots efforts that don\'t make headlines elsewhere.',
    enabled: true,
  },
  {
    id: 'obituaries',
    name: 'Obituaries',
    slug: 'obituaries',
    directive: 'Honor each life with dignity and specificity — mention what the person was known for, who they loved, and how they contributed to the community. Include service details: date, time, location, and where to send condolences or memorial donations. When covering the passing of a public figure or long-time community member, write a fuller tribute that captures their legacy and impact. Treat every obituary as the last story that will be written about someone — make it count.',
    enabled: true,
  },
  {
    id: 'events',
    name: 'Events',
    slug: 'events',
    directive: 'Write event previews that make people want to go — describe what attendees will experience, not just the logistics. Include every detail needed to attend: date, time, location, cost, parking, and whether it is family-friendly or 21+. For recurring events like weekly farmers markets or monthly art walks, refresh the angle each time with new vendors, performers, or seasonal highlights. After major events, write a recap with highlights and attendance for the community record.',
    enabled: true,
  },
  {
    id: 'seniors',
    name: 'Seniors',
    slug: 'seniors',
    directive: 'Cover the issues that matter most to older residents: Medicare and Social Security changes, property tax relief programs, transportation options, and scam prevention. Profile active seniors doing remarkable things — volunteering, starting businesses, competing in sports, or mentoring youth. Include practical resources: senior center schedules, meal delivery programs, caregiver support groups, and health screening events. Write with respect, never condescension — seniors are readers, not a demographic to talk about.',
    enabled: true,
  },
  {
    id: 'veterans',
    name: 'Veterans',
    slug: 'veterans',
    directive: 'Profile local veterans and their service with specificity — branch, unit, deployments, and what they do now. Cover VA healthcare access, benefits changes, and claims processing issues that affect local veterans directly. Highlight veteran-owned businesses, veteran service organizations, and transition programs. Include Memorial Day, Veterans Day, and military appreciation events with the stories behind them, not just ceremony details. Cover military family support networks and the challenges of deployment on local families.',
    enabled: true,
  },

  // Education & Youth
  {
    id: 'education',
    name: 'Education',
    slug: 'education',
    directive: 'Make school board decisions understandable to parents — explain budget changes, curriculum updates, and zoning decisions in terms of how they affect students and families. Celebrate student achievements with specifics: science fair winners, scholarship recipients, debate champions, and students overcoming obstacles. Profile teachers and administrators who go above and beyond. Cover school safety, mental health resources, and special education programs. Include registration deadlines, school calendars, and practical parent resources.',
    enabled: true,
  },
  {
    id: 'youth',
    name: 'Youth',
    slug: 'youth',
    directive: 'Amplify young voices — let teens and kids tell their own stories when possible. Cover youth achievements beyond academics: Eagle Scouts, community service projects, entrepreneurial ventures, and creative accomplishments. Highlight programs that give young people opportunities: summer camps, internships, leadership academies, and mentorship programs. Include practical information parents need: registration deadlines, costs, and age requirements. Write about young people as emerging community members, not just future adults.',
    enabled: true,
  },

  // Health & Environment
  {
    id: 'health',
    name: 'Health',
    slug: 'health',
    directive: 'Translate health news into actionable local information — where can residents get vaccinated, screened, or treated, and what does it cost. Cover hospital expansions, clinic openings, and provider shortages with specifics about how they affect patient access. Profile local healthcare workers and the challenges they face. Include mental health resources, substance abuse recovery programs, and support groups. When reporting on health trends or studies, always localize: what does this mean for our community specifically.',
    enabled: true,
  },
  {
    id: 'environment',
    name: 'Environment',
    slug: 'environment',
    directive: 'Connect environmental issues to daily life — how water quality affects drinking water, how air quality affects outdoor activities, how development affects green spaces. Cover conservation wins and setbacks with equal honesty. Profile local environmental advocates, park rangers, and conservation groups doing hands-on work. Include practical information: recycling schedule changes, hazardous waste collection days, and community cleanup events. Explain regulatory decisions in terms of real consequences for the area\'s rivers, forests, and wildlife.',
    enabled: true,
  },
  {
    id: 'weather',
    name: 'Weather',
    slug: 'weather',
    directive: 'Lead severe weather coverage with what residents should do right now — take shelter, avoid roads, prepare supplies. Include specific geographic impact: which neighborhoods, highways, and school districts are affected. For routine weather, connect forecasts to local activities: weekend plans, outdoor events, farming conditions, and seasonal tourism. Explain weather patterns in plain language and include historical context when records are broken or trends are notable.',
    enabled: true,
  },

  // Transportation & Infrastructure
  {
    id: 'transportation',
    name: 'Transportation',
    slug: 'transportation',
    directive: 'Lead with what drivers and commuters need to know today — lane closures, detour routes, project timelines, and completion dates. Explain why construction is happening and what the finished project will improve. Cover public transit changes, ride-share developments, and bike/pedestrian infrastructure with the same attention as road projects. Include maps or route descriptions when possible. Connect transportation investments to economic development and quality of life.',
    enabled: true,
  },
  {
    id: 'development',
    name: 'Development',
    slug: 'development',
    directive: 'Explain what is being built, where, and what it will look like when finished — readers want to picture their changing community. Cover zoning hearings and planning commission decisions by explaining who benefits, who is concerned, and what the tradeoffs are. Include timelines, developer names, and project costs from public records. Follow up on previously announced projects: are they on schedule, over budget, or stalled? Connect individual developments to the bigger story of how the community is growing and changing.',
    enabled: true,
  },

  // Special Interest
  {
    id: 'technology',
    name: 'Technology',
    slug: 'technology',
    directive: 'Cover how technology affects local residents practically — broadband expansion in rural areas, smart city initiatives, school technology programs, and digital literacy resources. Profile local tech companies, startups, and entrepreneurs building things in the community. Explain cybersecurity threats in terms residents can act on: scam alerts, data breach notifications, and protection tips. Connect national tech trends to local impact: how automation affects local employers, how AI changes local industries.',
    enabled: true,
  },
  {
    id: 'tourism',
    name: 'Tourism',
    slug: 'tourism',
    directive: 'Write for both visitors discovering the area and residents rediscovering what is in their backyard. Cover new attractions, hotel openings, and tourism campaigns with the economic impact: jobs created, tax revenue generated, and small businesses that benefit from tourist traffic. Include seasonal guides with specific recommendations, hidden gems, and insider tips. Profile the people who make tourism work — innkeepers, tour guides, festival organizers, and shop owners in tourist districts.',
    enabled: true,
  },
  {
    id: 'history',
    name: 'History',
    slug: 'history',
    directive: 'Bring local history to life by connecting past events to present-day landmarks, families, and traditions readers recognize. Cover historical anniversaries with fresh research and perspectives — interview descendants, find archival photos, and explain what has changed since. Profile preservation efforts, historic building restorations, and the people fighting to save community landmarks. Use "on this day" stories and before-and-after comparisons to make history tangible and relevant to younger readers.',
    enabled: true,
  },

  // Opinion & Editorial
  {
    id: 'opinion',
    name: 'Opinion',
    slug: 'opinion',
    directive: 'Present well-reasoned editorial positions grounded in facts and local context — not national talking points applied to local issues. Clearly label all opinion content to distinguish it from news reporting. Invite diverse perspectives and guest columns from community leaders, subject matter experts, and engaged residents. When taking an editorial position, acknowledge counterarguments fairly and explain the reasoning. Focus on solutions and constructive criticism rather than simply identifying problems.',
    enabled: true,
  },
  {
    id: 'letters',
    name: 'Letters',
    slug: 'letters',
    directive: 'Publish reader voices that contribute to community dialogue — agree or disagree, passionate or measured, as long as they are civil and substantive. Verify letter authors are real residents. Edit only for length and clarity, never to change the author\'s meaning or position. Prioritize letters that respond to recent coverage, raise new local issues, or offer firsthand perspectives on community decisions. Include the author\'s name and neighborhood to ground each letter in the community.',
    enabled: true,
  },
];
