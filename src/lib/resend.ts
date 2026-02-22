/**
 * Resend Email Service
 *
 * Handles all outbound transactional emails for the platform.
 * Every email uses the branded template from emailTemplates.ts
 * with Farrington Development footer branding.
 */

import {
  buildWelcomeEmail,
  buildCreditWarningEmail,
  buildPaymentConfirmationEmail,
  buildPaymentFailedEmail,
  buildNewLeadEmail,
  buildPlanChangeEmail,
} from './emailTemplates';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Newsroom AIOS <hello@newsroomaios.com>';
const ADMIN_EMAIL = 'carlfaring@gmail.com';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  bcc?: string;
  replyTo?: string;
}

interface ResendResponse {
  id?: string;
  error?: {
    message: string;
    name: string;
  };
}

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!RESEND_API_KEY;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!isResendConfigured()) {
    console.warn('[Resend] API key not configured, skipping email');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        bcc: options.bcc,
        reply_to: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = await response.json() as ResendResponse;

    if (!response.ok || data.error) {
      console.error('[Resend] Failed to send email:', data.error?.message || response.status);
      return { success: false, error: data.error?.message || `HTTP ${response.status}` };
    }

    console.log(`[Resend] Email sent successfully: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Resend] Error sending email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ─── Pre-built Email Senders ────────────────────────────────────────────────

/**
 * Send welcome email when a new newspaper is created
 */
export async function sendWelcomeEmail(options: {
  to: string;
  newspaperName: string;
  newspaperUrl: string;
  adminEmail: string;
  temporaryPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const { html, text } = buildWelcomeEmail({
    newspaperName: options.newspaperName,
    newspaperUrl: options.newspaperUrl,
    adminEmail: options.adminEmail,
    temporaryPassword: options.temporaryPassword,
  });

  return sendEmail({
    to: options.to,
    bcc: ADMIN_EMAIL,
    subject: `Welcome to ${options.newspaperName} — Your newspaper is live!`,
    html,
    text,
  });
}

/**
 * Send credit limit warning to newspaper owner
 */
export async function sendCreditWarningEmail(options: {
  to: string;
  ownerName: string;
  newspaperName: string;
  creditsUsed: number;
  creditsTotal: number;
  percentUsed: number;
  daysRemaining: number;
  accountUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const { html, text } = buildCreditWarningEmail({
    ownerName: options.ownerName,
    newspaperName: options.newspaperName,
    creditsUsed: options.creditsUsed,
    creditsTotal: options.creditsTotal,
    percentUsed: options.percentUsed,
    daysRemaining: options.daysRemaining,
    accountUrl: options.accountUrl,
  });

  return sendEmail({
    to: options.to,
    subject: `Credit alert: ${options.newspaperName} has used ${options.percentUsed}% of monthly credits`,
    html,
    text,
  });
}

/**
 * Send payment confirmation after successful charge
 */
export async function sendPaymentConfirmationEmail(options: {
  to: string;
  ownerName: string;
  newspaperName: string;
  planName: string;
  amount: string;
  nextBillingDate: string;
  invoiceUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { html, text } = buildPaymentConfirmationEmail({
    ownerName: options.ownerName,
    newspaperName: options.newspaperName,
    planName: options.planName,
    amount: options.amount,
    nextBillingDate: options.nextBillingDate,
    invoiceUrl: options.invoiceUrl,
  });

  return sendEmail({
    to: options.to,
    subject: `Payment received for ${options.newspaperName}`,
    html,
    text,
  });
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(options: {
  to: string;
  ownerName: string;
  newspaperName: string;
  amount: string;
  retryDate: string;
  billingUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const { html, text } = buildPaymentFailedEmail({
    ownerName: options.ownerName,
    newspaperName: options.newspaperName,
    amount: options.amount,
    retryDate: options.retryDate,
    billingUrl: options.billingUrl,
  });

  return sendEmail({
    to: options.to,
    subject: `Action needed: Payment failed for ${options.newspaperName}`,
    html,
    text,
  });
}

/**
 * Send new lead notification to platform admin (Carl)
 */
export async function sendNewLeadEmail(options: {
  leadName: string;
  email: string;
  phone?: string;
  newspaperName: string;
  city: string;
  state: string;
  county?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { html, text } = buildNewLeadEmail(options);

  return sendEmail({
    to: ADMIN_EMAIL,
    replyTo: options.email,
    subject: `New Lead: ${options.leadName} — ${options.newspaperName} (${options.city}, ${options.state})`,
    html,
    text,
  });
}

/**
 * Send plan change confirmation
 */
export async function sendPlanChangeEmail(options: {
  to: string;
  ownerName: string;
  newspaperName: string;
  oldPlan: string;
  newPlan: string;
  newCredits: number;
  effectiveDate: string;
}): Promise<{ success: boolean; error?: string }> {
  const { html, text } = buildPlanChangeEmail({
    ownerName: options.ownerName,
    newspaperName: options.newspaperName,
    oldPlan: options.oldPlan,
    newPlan: options.newPlan,
    newCredits: options.newCredits,
    effectiveDate: options.effectiveDate,
  });

  return sendEmail({
    to: options.to,
    bcc: ADMIN_EMAIL,
    subject: `Plan updated: ${options.newspaperName} is now on ${options.newPlan}`,
    html,
    text,
  });
}
