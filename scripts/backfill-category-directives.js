/**
 * Backfill Enhanced Category Directives
 *
 * Updates all existing tenant categories in Firestore with the new
 * enhanced editorial directives from PREDEFINED_CATEGORIES.
 *
 * Only updates the `directive` (or `editorialDirective`) field.
 * Does NOT change category names, colors, enabled status, or article counts.
 *
 * Usage: node scripts/backfill-category-directives.js [--dry-run]
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : undefined;

  admin.initializeApp(
    serviceAccount
      ? { credential: admin.credential.cert(serviceAccount) }
      : { projectId: 'newsroomasios' }
  );
}

const db = admin.firestore();
const isDryRun = process.argv.includes('--dry-run');

// Enhanced directives — must match src/data/categories.ts
const ENHANCED_DIRECTIVES = {
  'news': 'Lead with the direct impact on local residents — what changed, who is affected, and what happens next. Prioritize official sources: city council actions, police reports, school board decisions, and government agency statements. Provide context for policy decisions by explaining what prompted them and what they mean practically. When covering emergencies or crime, include safety information and community resources.',
  'breaking-news': 'Prioritize speed without sacrificing accuracy — confirm key facts before publishing. Lead with what readers need to know right now: what happened, where, and whether they are affected. Include emergency contact numbers, road closures, shelter locations, or safety instructions when relevant. Update the story as new information becomes available rather than waiting for a complete picture.',
  'politics': 'Explain what government decisions mean for everyday residents — not just what was voted on, but how it affects taxes, services, and daily life. Cover both sides of contested issues without false equivalence. Include vote tallies, who voted which way, and the reasoning behind dissenting opinions. Make city council and county board actions accessible by translating bureaucratic language into plain English.',
  'crime': 'Report facts from official sources — police reports, court records, and agency statements — without sensationalizing. Include suspect descriptions only when relevant to public safety. Provide context: is this part of a trend, an isolated incident, or connected to a larger investigation? Always include community safety resources and follow up on outcomes — arrests, charges filed, and court rulings — not just the initial incident.',
  'business': 'Highlight the people behind the businesses — founder stories, motivations, and what they bring to the community. Include practical details readers care about: location, hours, what they offer, and opening dates. Connect individual business stories to broader local economic trends like downtown revitalization, job growth, or industry shifts. Explain how new developments affect specific neighborhoods and residents.',
  'real-estate': 'Translate market data into stories residents can relate to — what do rising prices mean for first-time buyers, what neighborhoods are changing, and why. Cover new developments by explaining what is being built, how many units, price ranges, and timeline. Include the human angle: families finding homes, developers explaining their vision, and long-time residents adapting to neighborhood change. Reference specific streets and areas readers recognize.',
  'jobs': 'Focus on specific hiring announcements with actionable details: who is hiring, how many positions, pay ranges, and how to apply. Cover major employer expansions or layoffs with context about the ripple effect on the local economy. Highlight workforce training programs, job fairs, and career resources available to residents. Connect employment stories to broader trends like remote work, automation, or industry shifts affecting the area.',
  'agriculture': 'Tell the stories of local farmers and ranchers — what they grow, the challenges they face, and how weather and markets affect their livelihood. Include seasonal planting and harvest updates with practical information for agricultural readers. Cover farm-to-table connections, farmers markets, and agritourism. Explain how agricultural policy, trade decisions, and climate patterns impact the local farming economy in concrete terms.',
  'sports': 'Tell the story of the game, not just the score — describe key plays, momentum shifts, and the atmosphere. Spotlight individual athletes and their journeys, especially underdog and comeback stories. Cover high school, recreational, and youth sports with equal enthusiasm. Connect athletic achievements to community pride and school spirit. Include standings and schedules when relevant, but lead with narrative.',
  'high-school-sports': 'Write game recaps that capture the drama — the turning point, the clutch play, the defensive stand that sealed the win. Name the players who made the difference and describe what they did. Cover all varsity sports, not just football and basketball — wrestling, swimming, track, soccer, and volleyball deserve the same energy. Include conference standings, playoff implications, and upcoming matchups. Profile student-athletes balancing academics, sports, and community involvement.',
  'college-sports': 'Cover the local college programs that connect to community identity — game results, coaching changes, recruiting classes, and conference realignment. Profile student-athletes from the area who are competing at the next level. Explain how athletic department decisions — stadium expansions, NIL deals, conference moves — affect the university and surrounding community economically. Include fan perspective and gameday atmosphere.',
  'outdoors': 'Include seasonal timing, current conditions, and practical tips so readers can plan their outings. Feature lesser-known trails, fishing spots, and parks alongside popular destinations. Connect outdoor stories to conservation efforts, wildlife updates, and land management decisions. Provide family-friendly recommendations with difficulty levels and accessibility notes. Write with the enthusiasm of someone who has been there.',
  'entertainment': 'Always include the practical details readers need: event dates, ticket prices, venue location, and how to participate. Profile the artists and performers — who they are, their local connections, and what makes this event special. Preview upcoming seasons and festivals with enough detail to build anticipation. Connect cultural events to community identity and what makes the area unique.',
  'food-dining': 'Tell the story behind the menu — who is cooking, where they learned, and what makes their food worth the trip. Include the details diners need: location, hours, price range, reservations, and standout dishes. Cover new openings with enough specificity that readers can picture the space and the experience. Highlight food trucks, pop-ups, farmers market vendors, and home-grown food traditions alongside established restaurants.',
  'lifestyle': 'Focus on stories that could only happen in this community — the "only here" angle. Profile long-time residents, community pillars, and unsung heroes. Cover local traditions, seasonal rituals, and the small moments that define neighborhood life. Highlight volunteer efforts, civic engagement, and acts of generosity. Write with warmth and specificity — use names, places, and details that make the story feel intimate and real.',
  'faith': 'Cover faith communities with respect for all traditions — churches, mosques, synagogues, temples, and interfaith groups. Focus on what congregations are doing in the community: food drives, disaster relief, mentoring programs, and outreach. Profile faith leaders and their impact beyond the pulpit. Cover milestone events like church anniversaries, building dedications, and community partnerships. Avoid proselytizing — report on faith as a community force, not a platform for any single doctrine.',
  'pets-animals': 'Lead with adoptable animals — names, personalities, and where to meet them. Cover shelter capacity, fostering needs, and spay/neuter programs with urgency when appropriate. Profile local veterinarians, rescue organizations, and wildlife rehabilitators. Include practical advice: seasonal pet safety, lost pet resources, and local dog parks or pet-friendly businesses. Connect wildlife stories to conservation and habitat changes in the area.',
  'community': 'Spotlight the people who hold the community together — volunteers, nonprofit leaders, coaches, neighbors helping neighbors. Tell stories that make residents proud of where they live. Cover fundraisers and charity events with both the cause and the impact: how much was raised, who it helps, and how readers can still contribute. Highlight cross-generational connections, mentorship programs, and grassroots efforts that don\'t make headlines elsewhere.',
  'obituaries': 'Honor each life with dignity and specificity — mention what the person was known for, who they loved, and how they contributed to the community. Include service details: date, time, location, and where to send condolences or memorial donations. When covering the passing of a public figure or long-time community member, write a fuller tribute that captures their legacy and impact. Treat every obituary as the last story that will be written about someone — make it count.',
  'events': 'Write event previews that make people want to go — describe what attendees will experience, not just the logistics. Include every detail needed to attend: date, time, location, cost, parking, and whether it is family-friendly or 21+. For recurring events like weekly farmers markets or monthly art walks, refresh the angle each time with new vendors, performers, or seasonal highlights. After major events, write a recap with highlights and attendance for the community record.',
  'seniors': 'Cover the issues that matter most to older residents: Medicare and Social Security changes, property tax relief programs, transportation options, and scam prevention. Profile active seniors doing remarkable things — volunteering, starting businesses, competing in sports, or mentoring youth. Include practical resources: senior center schedules, meal delivery programs, caregiver support groups, and health screening events. Write with respect, never condescension — seniors are readers, not a demographic to talk about.',
  'veterans': 'Profile local veterans and their service with specificity — branch, unit, deployments, and what they do now. Cover VA healthcare access, benefits changes, and claims processing issues that affect local veterans directly. Highlight veteran-owned businesses, veteran service organizations, and transition programs. Include Memorial Day, Veterans Day, and military appreciation events with the stories behind them, not just ceremony details. Cover military family support networks and the challenges of deployment on local families.',
  'education': 'Make school board decisions understandable to parents — explain budget changes, curriculum updates, and zoning decisions in terms of how they affect students and families. Celebrate student achievements with specifics: science fair winners, scholarship recipients, debate champions, and students overcoming obstacles. Profile teachers and administrators who go above and beyond. Cover school safety, mental health resources, and special education programs. Include registration deadlines, school calendars, and practical parent resources.',
  'youth': 'Amplify young voices — let teens and kids tell their own stories when possible. Cover youth achievements beyond academics: Eagle Scouts, community service projects, entrepreneurial ventures, and creative accomplishments. Highlight programs that give young people opportunities: summer camps, internships, leadership academies, and mentorship programs. Include practical information parents need: registration deadlines, costs, and age requirements. Write about young people as emerging community members, not just future adults.',
  'health': 'Translate health news into actionable local information — where can residents get vaccinated, screened, or treated, and what does it cost. Cover hospital expansions, clinic openings, and provider shortages with specifics about how they affect patient access. Profile local healthcare workers and the challenges they face. Include mental health resources, substance abuse recovery programs, and support groups. When reporting on health trends or studies, always localize: what does this mean for our community specifically.',
  'environment': 'Connect environmental issues to daily life — how water quality affects drinking water, how air quality affects outdoor activities, how development affects green spaces. Cover conservation wins and setbacks with equal honesty. Profile local environmental advocates, park rangers, and conservation groups doing hands-on work. Include practical information: recycling schedule changes, hazardous waste collection days, and community cleanup events. Explain regulatory decisions in terms of real consequences for the area\'s rivers, forests, and wildlife.',
  'weather': 'Lead severe weather coverage with what residents should do right now — take shelter, avoid roads, prepare supplies. Include specific geographic impact: which neighborhoods, highways, and school districts are affected. For routine weather, connect forecasts to local activities: weekend plans, outdoor events, farming conditions, and seasonal tourism. Explain weather patterns in plain language and include historical context when records are broken or trends are notable.',
  'transportation': 'Lead with what drivers and commuters need to know today — lane closures, detour routes, project timelines, and completion dates. Explain why construction is happening and what the finished project will improve. Cover public transit changes, ride-share developments, and bike/pedestrian infrastructure with the same attention as road projects. Include maps or route descriptions when possible. Connect transportation investments to economic development and quality of life.',
  'development': 'Explain what is being built, where, and what it will look like when finished — readers want to picture their changing community. Cover zoning hearings and planning commission decisions by explaining who benefits, who is concerned, and what the tradeoffs are. Include timelines, developer names, and project costs from public records. Follow up on previously announced projects: are they on schedule, over budget, or stalled? Connect individual developments to the bigger story of how the community is growing and changing.',
  'technology': 'Cover how technology affects local residents practically — broadband expansion in rural areas, smart city initiatives, school technology programs, and digital literacy resources. Profile local tech companies, startups, and entrepreneurs building things in the community. Explain cybersecurity threats in terms residents can act on: scam alerts, data breach notifications, and protection tips. Connect national tech trends to local impact: how automation affects local employers, how AI changes local industries.',
  'tourism': 'Write for both visitors discovering the area and residents rediscovering what is in their backyard. Cover new attractions, hotel openings, and tourism campaigns with the economic impact: jobs created, tax revenue generated, and small businesses that benefit from tourist traffic. Include seasonal guides with specific recommendations, hidden gems, and insider tips. Profile the people who make tourism work — innkeepers, tour guides, festival organizers, and shop owners in tourist districts.',
  'history': 'Bring local history to life by connecting past events to present-day landmarks, families, and traditions readers recognize. Cover historical anniversaries with fresh research and perspectives — interview descendants, find archival photos, and explain what has changed since. Profile preservation efforts, historic building restorations, and the people fighting to save community landmarks. Use "on this day" stories and before-and-after comparisons to make history tangible and relevant to younger readers.',
  'opinion': 'Present well-reasoned editorial positions grounded in facts and local context — not national talking points applied to local issues. Clearly label all opinion content to distinguish it from news reporting. Invite diverse perspectives and guest columns from community leaders, subject matter experts, and engaged residents. When taking an editorial position, acknowledge counterarguments fairly and explain the reasoning. Focus on solutions and constructive criticism rather than simply identifying problems.',
  'letters': 'Publish reader voices that contribute to community dialogue — agree or disagree, passionate or measured, as long as they are civil and substantive. Verify letter authors are real residents. Edit only for length and clarity, never to change the author\'s meaning or position. Prioritize letters that respond to recent coverage, raise new local issues, or offer firsthand perspectives on community decisions. Include the author\'s name and neighborhood to ground each letter in the community.',
};

async function backfillDirectives() {
  console.log(isDryRun ? '\n=== DRY RUN ===' : '\n=== BACKFILLING CATEGORY DIRECTIVES ===');
  console.log(`Enhanced directives for ${Object.keys(ENHANCED_DIRECTIVES).length} categories\n`);

  // Get all active tenants
  const tenantsSnap = await db.collection('tenants').where('status', '==', 'active').get();
  console.log(`Found ${tenantsSnap.size} active tenants\n`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const tenantDoc of tenantsSnap.docs) {
    const tenant = tenantDoc.data();
    const tenantId = tenantDoc.id;
    const tenantName = tenant.businessName || tenant.subdomain || tenantId;

    // Check categories subcollection
    const categoriesSnap = await db.collection(`tenants/${tenantId}/categories`).get();

    if (categoriesSnap.empty) {
      console.log(`  ${tenantName}: No categories subcollection — skipping`);
      totalSkipped++;
      continue;
    }

    let updated = 0;
    const batch = db.batch();

    for (const catDoc of categoriesSnap.docs) {
      const cat = catDoc.data();
      const slug = cat.slug || catDoc.id;
      const newDirective = ENHANCED_DIRECTIVES[slug];

      if (!newDirective) {
        continue; // Custom category not in our predefined list
      }

      // Check both field names — tenant template uses editorialDirective, platform uses directive
      const currentDirective = cat.editorialDirective || cat.directive || '';

      if (currentDirective === newDirective) {
        continue; // Already up to date
      }

      if (!isDryRun) {
        // Update both field names for compatibility
        const updateData = {
          directive: newDirective,
          editorialDirective: newDirective,
          updatedAt: new Date().toISOString(),
        };
        batch.update(catDoc.ref, updateData);
      }
      updated++;
    }

    if (updated > 0) {
      if (!isDryRun) {
        await batch.commit();
      }
      console.log(`  ${tenantName}: ${updated} categories ${isDryRun ? 'would be' : ''} updated`);
      totalUpdated += updated;
    } else {
      console.log(`  ${tenantName}: All categories already current`);
    }

    // Also update the categories array in the tenant doc itself (if it has one)
    if (tenant.categories && Array.isArray(tenant.categories)) {
      let tenantCatsUpdated = 0;
      const updatedCategories = tenant.categories.map(cat => {
        const slug = cat.slug || cat.id;
        const newDirective = ENHANCED_DIRECTIVES[slug];
        if (newDirective && cat.directive !== newDirective) {
          tenantCatsUpdated++;
          return { ...cat, directive: newDirective };
        }
        return cat;
      });

      if (tenantCatsUpdated > 0 && !isDryRun) {
        await tenantDoc.ref.update({ categories: updatedCategories });
        console.log(`    └─ Also updated ${tenantCatsUpdated} categories in tenant doc`);
      }
    }
  }

  // Also handle WNC Times with its special database
  try {
    const wnctDb = admin.firestore();
    // WNC Times uses named database 'gwnct' on project gen-lang-client-0242565142
    // We can't access that from the platform's Firebase admin — skip with note
    console.log(`\n  NOTE: WNC Times uses a separate Firebase database (gwnct).`);
    console.log(`  Its categories must be updated via the tenant admin or a separate script.`);
  } catch (e) {
    // Expected — can't access WNC Times' separate Firebase from here
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Tenants processed: ${tenantsSnap.size}`);
  console.log(`Categories updated: ${totalUpdated}`);
  console.log(`Tenants skipped: ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);
  if (isDryRun) console.log(`\nThis was a dry run. Run without --dry-run to apply changes.`);
}

backfillDirectives()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
