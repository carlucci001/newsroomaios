/**
 * AI-powered support responses for tickets and autopilot mode.
 * Uses Gemini to generate helpful, context-aware responses.
 *
 * The AI has a detailed knowledge base of the platform, known issues,
 * common non-issues, and how-to guidance — so it can actually resolve
 * tickets instead of just acknowledging them.
 */

import { generateContent } from './gemini';

// ─── Platform Knowledge Base ────────────────────────────────────────────────
// This is what makes the AI actually useful instead of a polite placeholder.

const PLATFORM_KNOWLEDGE = `
## Platform Overview
NewsroomAIOS is a SaaS platform that provides AI-powered local newspaper websites.
Each tenant (newspaper) gets their own website with AI content generation, fact-checking,
business directories, events, advertising, community features, and more.

## Architecture
- Each tenant has their own Vercel deployment and subdomain (e.g., atlanta.newsroomaios.com)
- All tenants share one Firebase/Firestore backend (except WNC Times which has its own)
- API keys are centrally managed by the platform — tenants never see or manage API keys
- Tenants pay a monthly subscription (Starter $99, Growth $199, Professional $299)
- Credits: article=5, image=2, fact-check=2, SEO=3, web-search=1

## Common Feature Questions

### Article Generation
- AI agents generate articles based on RSS feeds and web research
- Agents can be scheduled (hourly, daily, weekly, monthly) or run manually
- Each agent covers a beat (category) and has a persona with writing style
- Articles go through: generation → optional fact-check → publish or draft
- If articles look repetitive: check the agent's content sources, add more RSS feeds
- If articles aren't generating: check if the agent's schedule is enabled and credits are available

### Content Management
- Articles tab shows all articles with status filters (published, draft, archived)
- Rich text editor supports images, embeds, pull quotes, and formatting
- Categories are assigned during onboarding (6 categories per paper)
- Articles can be featured (shown prominently) or marked as breaking news

### AI Journalists / The Newsroom
- Found under "The Newsroom" in the sidebar (formerly "AI Workforce")
- Each journalist has a persona (name, photo, bio, writing style)
- Personas can be regenerated with AI — click the refresh button
- Schedule settings: enable/disable, frequency, time, timezone
- Task settings: auto-publish vs draft, max articles per run, category

### Billing & Credits
- Credits refresh each billing cycle based on the subscription plan
- View credit balance in the admin header or the Credits tab
- If credits are low, the platform admin can top off credits
- Credit warnings appear at 80% usage, hard block at 100%
- "Credits not updating" — the header may cache; refresh the page or check the Credits tab

### Site Configuration
- Site name, logo, colors, and layout are in the Site Config tab
- Custom domains are configured through the platform admin
- Google Analytics: add your GA Measurement ID in Site Config > SEO section
- Social media links go in Site Config

### Business Directory
- Tenants can list local businesses with categories, hours, contact info
- Google Places integration pulls business data automatically
- Businesses can be featured (promoted placement)

### Events
- Community events calendar with AI-assisted event creation
- Events support location, date/time, categories, and ticket links

### Advertising
- Ad placement zones: header banner, sidebar, in-article, footer
- Advertisers can self-serve or be managed by the paper's admin
- Ad performance tracking with impressions and clicks

### Menus (Restaurant Module)
- Papers can add restaurant menus with items, prices, photos
- AI can parse menu images or PDFs

### User Management
- Paper admins can invite editors, writers, and contributors
- Role-based access: admin, editor, writer, contributor
- Password reset: use the "Forgot Password" link on the login page

## Known Issues & Fixes (Current Release v1.6.0)

### "Bucket name not specified" Error
STATUS: FIXED in v1.6.0 (deploying to all tenants)
If a user sees "Failed: Bucket name not specified or invalid" when uploading images,
this was a Firebase storage bucket initialization bug. It's been fixed. If they're
still seeing it, their site may need the latest deployment — escalate to engineering.

### Suspended Tenant Sites Still Accessible
STATUS: KNOWN LIMITATION
Setting a tenant to "suspended" currently only updates the database label.
The live site continues to work. A middleware enforcement is planned.
Tell the user: "We're aware of this and the enforcement is scheduled for the next release."

### Credit Display Shows Wrong Values
STATUS: KNOWN ISSUE
The credit display in the tenant admin header may not match actual balances.
Workaround: check the Credits tab for accurate numbers. A fix is in progress.

### Plan Changes Not Reflecting Immediately
STATUS: FIXED in v1.6.0
After upgrading/downgrading plans, the credit allocation and plan name now sync correctly.

### Fact-Check Scores Vary Between Runs
STATUS: FIXED in v1.6.0
Fact-check temperature was set too high, causing inconsistent scores. Now set to 0.0
for deterministic results.

## Common Non-Issues (User Confusion)

### "My articles aren't publishing"
Usually: the agent's schedule is disabled, or it's set to save as draft (not auto-publish).
Guide them to: The Newsroom > click the agent > Schedule tab > check "Enable Schedule"
and Task Settings > check "Auto-publish."

### "I see articles by journalists I didn't create"
These are the AI personas that were seeded during paper setup. Each paper starts with
6 AI journalists covering the 6 selected categories. They can rename, replace, or
disable any of them.

### "The AI is writing about the wrong topics"
Check: content sources (RSS feeds) and the agent's beat assignment.
The agent writes about whatever its RSS feeds provide. Wrong content = wrong feeds.

### "I can't log in to my paper"
This is almost always a password issue. Guide them to use "Forgot Password" on the
login page. If they say the email doesn't work — they may be using a different email
than what was set up. Check with the platform admin.

### "My site looks different after an update"
Platform updates roll out via deployment. UI changes are intentional. If something
looks broken (missing elements, layout errors), that's a real bug — escalate.

### "Where is [feature name]?"
Common ones:
- AI agents: "The Newsroom" in sidebar
- Site settings: "Site Config" in sidebar
- Billing: "Credits" in sidebar
- User management: "Users" in sidebar
- Help: "Help & Support" section at bottom of sidebar, including User Guide
`;

const TRIAGE_SYSTEM_INSTRUCTION = `You are an expert support engineer for NewsroomAIOS.
Your job is to CLASSIFY incoming support tickets and determine:
1. Whether this is a known issue, a non-issue, or a new/real bug
2. The appropriate confidence level of your assessment

You must respond in valid JSON with this exact structure:
{
  "classification": "known_issue" | "non_issue" | "how_to" | "real_bug" | "unclear",
  "confidence": "high" | "medium" | "low",
  "matchedKnowledge": "Brief description of which known issue or FAQ this matches, or null",
  "suggestedResponse": "The helpful response to send to the user (2-6 sentences)",
  "suggestedStatus": "waiting" | "open" | "in-progress",
  "suggestedPriority": "low" | "medium" | "high" | "urgent",
  "escalate": false | true
}

Classification guide:
- "known_issue": matches a known bug/limitation listed in the knowledge base
- "non_issue": user confusion or misunderstanding of how the platform works
- "how_to": user asking how to do something the platform supports
- "real_bug": sounds like a genuine bug NOT in the known issues list
- "unclear": not enough info to classify

Confidence guide:
- "high": you're very confident in your classification (85%+)
- "medium": fairly confident but could go either way (50-85%)
- "low": guessing, need more info (<50%)

Status guide:
- "waiting": you've answered the question, waiting for user to confirm resolution
- "open": needs human review (real bugs, unclear issues)
- "in-progress": escalated to engineering

Priority guide:
- "low": feature requests, minor cosmetic issues
- "medium": functionality questions, known issues with workarounds
- "high": broken functionality blocking the user's work
- "urgent": site down, data loss, or security issue

IMPORTANT: For "how_to" and "non_issue" with high confidence, provide a COMPLETE answer
that resolves the issue. Don't just say "we'll look into it" — actually help them.
For "real_bug", acknowledge it honestly and escalate.
For "known_issue", explain the status and any workaround.`;

const AUTOPILOT_SYSTEM_INSTRUCTION = `You are an AI support engineer for NewsroomAIOS.
You handle live chat when the human support team is unavailable. You have deep knowledge
of the platform and can resolve most issues directly.

Rules:
- If you can answer definitively from the knowledge base, DO IT. Don't punt to humans.
- If you genuinely don't know, say so and assure them the team will follow up.
- Keep responses to 2-5 sentences. Conversational and friendly, not robotic.
- Never make up technical answers. If unsure, say "I want to make sure I give you
  the right answer — let me flag this for the team."
- For known bugs, share the current status and any workaround.
- For how-to questions, give step-by-step guidance.`;

// ─── Triage: Classify + Respond ─────────────────────────────────────────────

export interface TriageResult {
  classification: 'known_issue' | 'non_issue' | 'how_to' | 'real_bug' | 'unclear';
  confidence: 'high' | 'medium' | 'low';
  matchedKnowledge: string | null;
  suggestedResponse: string;
  suggestedStatus: 'waiting' | 'open' | 'in-progress';
  suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
  escalate: boolean;
}

/**
 * Triage a new ticket: classify it and generate an intelligent response.
 * Returns both the triage result and a user-facing response.
 */
export async function triageTicket(
  subject: string,
  description: string,
  category: string,
  tenantName: string,
  diagnostics?: { url?: string; browser?: string; consoleErrors?: string[]; errorMessage?: string }
): Promise<TriageResult | null> {
  try {
    const diagnosticsContext = diagnostics
      ? `\n\nDiagnostics captured:
- Page URL: ${diagnostics.url || 'N/A'}
- Browser: ${diagnostics.browser || 'N/A'}
- Console errors: ${diagnostics.consoleErrors?.join('; ') || 'None'}
- Error message: ${diagnostics.errorMessage || 'None'}`
      : '';

    const prompt = `Classify this support ticket and generate a response.

PLATFORM KNOWLEDGE BASE:
${PLATFORM_KNOWLEDGE}

TICKET:
Tenant: "${tenantName}"
Subject: ${subject}
Category: ${category}
Description: ${description}${diagnosticsContext}

Respond with valid JSON only. No markdown code fences, no explanation outside the JSON.`;

    const response = await generateContent(
      prompt,
      { temperature: 0.1, maxTokens: 800 },
      TRIAGE_SYSTEM_INSTRUCTION
    );

    // Strip code fences if present
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleaned) as TriageResult;

    // Validate required fields
    if (!result.classification || !result.suggestedResponse) {
      console.error('[SupportAI] Triage response missing required fields');
      return null;
    }

    return result;
  } catch (error) {
    console.error('[SupportAI] Failed to triage ticket:', error);
    return null;
  }
}

/**
 * Generate an AI first response for a new support ticket.
 * Now uses triage for intelligent classification + response.
 * Falls back to basic response if triage fails.
 */
export async function generateFirstResponse(
  subject: string,
  description: string,
  category: string,
  tenantName: string,
  diagnostics?: { url?: string; browser?: string; consoleErrors?: string[]; errorMessage?: string }
): Promise<{ response: string; triage: TriageResult | null }> {
  // Try smart triage first
  const triage = await triageTicket(subject, description, category, tenantName, diagnostics);

  if (triage) {
    return { response: triage.suggestedResponse, triage };
  }

  // Fallback: basic response if triage fails
  try {
    const fallbackPrompt = `A newspaper owner from "${tenantName}" submitted a support ticket.

Subject: ${subject}
Category: ${category}
Description: ${description}

${PLATFORM_KNOWLEDGE}

Write a helpful response (2-4 sentences). If you can answer from the knowledge base, do so.
If not, acknowledge their issue and let them know the support team will review it.`;

    const response = await generateContent(
      fallbackPrompt,
      { temperature: 0.3, maxTokens: 400 },
      'You are a knowledgeable support engineer for NewsroomAIOS. Be helpful and specific.'
    );

    return { response: response.trim(), triage: null };
  } catch (error) {
    console.error('[SupportAI] Fallback response also failed:', error);
    return { response: '', triage: null };
  }
}

/**
 * Generate an AI autopilot response for follow-up messages.
 * Now includes platform knowledge for better answers.
 */
export async function generateAutopilotResponse(
  tenantName: string,
  subject: string,
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  adminBusy: boolean
): Promise<string | null> {
  try {
    const recentHistory = conversationHistory.slice(-6).map(m =>
      `${m.role === 'user' ? 'Customer' : m.role === 'ai' ? 'AI Assistant' : 'Support Team'}: ${m.content}`
    ).join('\n');

    const busyContext = adminBusy
      ? 'The support team is currently helping another paper partner and will join shortly.'
      : 'The support team is currently away but will review this conversation when they return.';

    const prompt = `You are handling live chat for "${tenantName}".
${busyContext}

PLATFORM KNOWLEDGE BASE:
${PLATFORM_KNOWLEDGE}

Original topic: ${subject}

Recent conversation:
${recentHistory}

Latest message from customer: ${userMessage}

Respond helpfully in 2-5 sentences. Use the knowledge base to give real answers.
If you can resolve their issue, do it. If you genuinely can't, acknowledge and
assure them the team will follow up.`;

    const response = await generateContent(
      prompt,
      { temperature: 0.3, maxTokens: 400 },
      AUTOPILOT_SYSTEM_INSTRUCTION
    );

    return response.trim();
  } catch (error) {
    console.error('[SupportAI] Failed to generate autopilot response:', error);
    return null;
  }
}
