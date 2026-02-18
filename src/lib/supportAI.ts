/**
 * AI-powered support responses for tickets and autopilot mode.
 * Uses Gemini to generate helpful responses based on ticket context.
 */

import { generateContent } from './gemini';

const SUPPORT_SYSTEM_INSTRUCTION =
  'You are a helpful support assistant for NewsroomAIOS, a SaaS platform that provides ' +
  'AI-powered local newspaper websites. Tenants are newspaper owners who use the platform ' +
  'to run their local news sites. Common issues include: article generation, content editing, ' +
  'image management, user account access, billing/credits, site configuration, domain setup, ' +
  'advertising module, directory listings, events, and community features. ' +
  'Be concise, friendly, and professional. If the issue is clearly a bug, acknowledge it and ' +
  'assure them the engineering team will investigate. If it sounds like a how-to question, ' +
  'provide brief guidance. Always end by letting them know a human will follow up if needed.';

const AUTOPILOT_SYSTEM_INSTRUCTION =
  'You are an AI receptionist for NewsroomAIOS platform support. You handle initial conversations ' +
  'when the support team is busy or away. Be warm, professional, and helpful. ' +
  'You can answer common questions about the platform: article generation, content editing, ' +
  'image management, billing/credits, site configuration, advertising, directory listings, events. ' +
  'If someone asks something you cannot answer definitively, say you will make sure the support ' +
  'team sees their question. Never make up specific technical answers — be honest about what ' +
  'you know. Keep responses to 2-4 sentences. Use a conversational, friendly tone.';

/**
 * Generate an AI first response for a new support ticket.
 * Returns null if generation fails (non-blocking).
 */
export async function generateFirstResponse(
  subject: string,
  description: string,
  category: string,
  tenantName: string
): Promise<string | null> {
  try {
    const prompt = `A newspaper owner from "${tenantName}" submitted a support ticket.

Subject: ${subject}
Category: ${category}
Description: ${description}

Write a brief, helpful first response (2-4 sentences). Acknowledge their issue specifically,
provide any immediate guidance if applicable, and let them know the support team will review
their ticket. Do NOT make up solutions if the issue is unclear — just acknowledge and reassure.`;

    const response = await generateContent(
      prompt,
      { temperature: 0.3, maxTokens: 300 },
      SUPPORT_SYSTEM_INSTRUCTION
    );

    return response.trim();
  } catch (error) {
    console.error('[SupportAI] Failed to generate first response:', error);
    return null;
  }
}

/**
 * Generate an AI autopilot response for follow-up messages when admin is unavailable.
 * Context-aware: knows if admin is busy with another tenant or simply away.
 */
export async function generateAutopilotResponse(
  tenantName: string,
  subject: string,
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  adminBusy: boolean
): Promise<string | null> {
  try {
    // Build conversation context (last 6 messages max)
    const recentHistory = conversationHistory.slice(-6).map(m =>
      `${m.role === 'user' ? 'Customer' : m.role === 'ai' ? 'AI Assistant' : 'Support Team'}: ${m.content}`
    ).join('\n');

    const busyContext = adminBusy
      ? 'The support team is currently assisting another paper partner and will join this conversation shortly. '
      : 'The support team is currently away but will review this conversation as soon as they return. ';

    const prompt = `You are handling a live chat for "${tenantName}" while the support team is unavailable.
${busyContext}

Original topic: ${subject}

Recent conversation:
${recentHistory}

Latest message from customer: ${userMessage}

Respond helpfully in 2-4 sentences. If you can answer their question, do so. If not, acknowledge
their message, let them know the support team will see it, and ask if there's anything else you
can help with in the meantime. Be warm and conversational — this is a live chat, not a formal ticket.`;

    const response = await generateContent(
      prompt,
      { temperature: 0.4, maxTokens: 300 },
      AUTOPILOT_SYSTEM_INSTRUCTION
    );

    return response.trim();
  } catch (error) {
    console.error('[SupportAI] Failed to generate autopilot response:', error);
    return null;
  }
}
