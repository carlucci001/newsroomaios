/**
 * Resend Email Service
 *
 * Handles transactional emails for the platform:
 * - Welcome emails when a newspaper is created
 * - Password reset emails
 * - Subscription notifications
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Newsroom AIOS <hello@newsroomaios.com>';
const ADMIN_EMAIL = 'carlfaring@gmail.com'; // Get notified of all new signups

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  bcc?: string;
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
  const { to, newspaperName, newspaperUrl, adminEmail, temporaryPassword } = options;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">Newsroom AIOS</h1>
  </div>

  <h2 style="color: #1e40af;">Welcome to ${newspaperName}!</h2>

  <p>Congratulations! Your AI-powered newspaper has been created and is now live.</p>

  <div style="background: #f0f9ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1e40af;">Your Newspaper</h3>
    <p style="margin: 0;">
      <strong>URL:</strong> <a href="${newspaperUrl}" style="color: #2563eb;">${newspaperUrl}</a>
    </p>
  </div>

  <div style="background: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #92400e;">Admin Login Credentials</h3>
    <p style="margin: 5px 0;"><strong>Admin Panel:</strong> <a href="${newspaperUrl}/backend" style="color: #2563eb;">${newspaperUrl}/backend</a></p>
    <p style="margin: 5px 0;"><strong>Email:</strong> ${adminEmail}</p>
    <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #fff; padding: 2px 8px; border-radius: 4px; font-size: 18px; font-weight: bold;">${temporaryPassword}</code></p>
    <p style="color: #dc2626; font-weight: bold; margin-top: 15px; margin-bottom: 0;">
      ⚠️ Please change your password immediately after logging in!
    </p>
  </div>

  <h3 style="color: #1e40af;">What's Next?</h3>
  <ol>
    <li><strong>Log into your admin panel</strong> at <a href="${newspaperUrl}/backend" style="color: #2563eb;">${newspaperUrl}/backend</a></li>
    <li><strong>Change your password</strong> for security</li>
    <li><strong>Customize your newspaper</strong> with your branding and categories</li>
    <li><strong>Watch your AI journalists</strong> start generating content!</li>
  </ol>

  <p>If you have any questions, reply to this email or contact our support team.</p>

  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    Best regards,<br>
    The Newsroom AIOS Team
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    © ${new Date().getFullYear()} Newsroom AIOS. All rights reserved.
  </p>
</body>
</html>
`;

  const text = `
Welcome to ${newspaperName}!

Congratulations! Your AI-powered newspaper has been created and is now live.

YOUR NEWSPAPER
URL: ${newspaperUrl}

ADMIN LOGIN CREDENTIALS
Admin Panel: ${newspaperUrl}/backend
Email: ${adminEmail}
Password: ${temporaryPassword}

⚠️ IMPORTANT: Please change your password immediately after logging in!

WHAT'S NEXT?
1. Log into your admin panel at ${newspaperUrl}/backend
2. Change your password for security
3. Customize your newspaper with your branding and categories
4. Watch your AI journalists start generating content!

If you have any questions, reply to this email or contact our support team.

Best regards,
The Newsroom AIOS Team
`;

  return sendEmail({
    to,
    bcc: ADMIN_EMAIL, // Notify admin of new signups
    subject: `🎉 Welcome to ${newspaperName} - Your newspaper is live!`,
    html,
    text,
  });
}
