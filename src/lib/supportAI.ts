/**
 * AI-powered first response for support tickets.
 * Uses Gemini to generate a helpful initial response based on the ticket description.
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
