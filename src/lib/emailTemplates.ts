/**
 * Branded Email Templates for Newsroom AIOS
 *
 * All outbound emails use a consistent, professional layout:
 * - Newsroom AIOS header with logo-style wordmark
 * - Clean content area
 * - Farrington Development branding footer on every email
 *
 * Mail-merge: Every template function accepts a variables object.
 * The master wrapper handles common variables (year, platform name).
 */

const CURRENT_YEAR = new Date().getFullYear();

// ─── Master Email Wrapper ───────────────────────────────────────────────────

export function wrapInBrandedTemplate(content: string, options?: { preheader?: string }): string {
  const preheader = options?.preheader || '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Newsroom AIOS</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f3f4f6;">${preheader}</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px 20px 40px; text-align: center; border-bottom: 3px solid #2563eb;">
              <img src="https://www.newsroomaios.com/newsroom-logo.png" alt="Newsroom AIOS" width="240" style="display: block; margin: 0 auto; max-width: 240px; height: auto;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; color: #1f2937; font-size: 15px; line-height: 1.7;">
              ${content}
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 24px;">
                <tr>
                  <td style="padding: 0 0 24px 0;">
                    <p style="margin: 0 0 2px 0; color: #1e3a5f; font-size: 15px; font-weight: 700;">Carl Farrington</p>
                    <p style="margin: 0 0 12px 0; color: #2563eb; font-size: 13px; font-weight: 500;">Founder &amp; CEO</p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 16px; border-right: 2px solid #e5e7eb;">
                          <img src="https://www.newsroomaios.com/newsroom-logo-transparent.png" alt="Newsroom AIOS" width="120" style="display: block; max-width: 120px; height: auto;" />
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="margin: 0 0 3px 0; color: #6b7280; font-size: 12px;">
                            <a href="mailto:hello@newsroomaios.com" style="color: #2563eb; text-decoration: none;">hello@newsroomaios.com</a>
                          </p>
                          <p style="margin: 0 0 3px 0; color: #6b7280; font-size: 12px;">
                            <a href="https://www.newsroomaios.com" style="color: #2563eb; text-decoration: none;">newsroomaios.com</a>
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 11px; font-style: italic;">
                            AI-Powered Local News
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 16px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px; font-weight: 500;">
                Newsroom AIOS
              </p>
              <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 12px;">
                A service of <strong style="color: #6b7280;">Farrington Development</strong>
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://www.newsroomaios.com" style="color: #2563eb; font-size: 12px; text-decoration: none;">newsroomaios.com</a>
                  </td>
                  <td style="color: #d1d5db; font-size: 12px;">|</td>
                  <td style="padding: 0 8px;">
                    <a href="mailto:hello@newsroomaios.com" style="color: #2563eb; font-size: 12px; text-decoration: none;">hello@newsroomaios.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Copyright -->
          <tr>
            <td style="padding: 0 40px 24px 40px; text-align: center;">
              <p style="margin: 0; color: #c0c4cc; font-size: 11px;">
                &copy; ${CURRENT_YEAR} Farrington Development. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Reusable Components ────────────────────────────────────────────────────

function infoBox(title: string, bodyHtml: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 15px; font-weight: 600;">${title}</h3>
          ${bodyHtml}
        </td>
      </tr>
    </table>`;
}

function warningBox(title: string, bodyHtml: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 15px; font-weight: 600;">${title}</h3>
          ${bodyHtml}
        </td>
      </tr>
    </table>`;
}

function successBox(title: string, bodyHtml: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 15px; font-weight: 600;">${title}</h3>
          ${bodyHtml}
        </td>
      </tr>
    </table>`;
}

function alertBox(title: string, bodyHtml: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #991b1b; font-size: 15px; font-weight: 600;">${title}</h3>
          ${bodyHtml}
        </td>
      </tr>
    </table>`;
}

function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background: #2563eb; border-radius: 8px;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 36px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; letter-spacing: 0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

function greeting(name: string): string {
  return `<p style="margin: 0 0 20px 0; font-size: 15px;">Hi ${name},</p>`;
}

// ─── 1. Welcome Email ───────────────────────────────────────────────────────

export function buildWelcomeEmail(vars: {
  newspaperName: string;
  newspaperUrl: string;
  adminEmail: string;
  temporaryPassword: string;
}): { html: string; text: string } {
  const content = `
    <h2 style="margin: 0 0 8px 0; color: #1e3a5f; font-size: 22px; font-weight: 700;">
      Welcome to ${vars.newspaperName}!
    </h2>
    <p style="margin: 0 0 20px 0; color: #4b5563;">
      Congratulations! Your AI-powered newspaper has been created and is now live.
    </p>

    ${infoBox('Your Newspaper', `
      <p style="margin: 0; font-size: 14px;">
        <strong>URL:</strong> <a href="${vars.newspaperUrl}" style="color: #2563eb; text-decoration: none;">${vars.newspaperUrl}</a>
      </p>
    `)}

    ${warningBox('Admin Login Credentials', `
      <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Admin Panel:</strong> <a href="${vars.newspaperUrl}/backend" style="color: #2563eb; text-decoration: none;">${vars.newspaperUrl}/backend</a></p>
      <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Email:</strong> ${vars.adminEmail}</p>
      <p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Password:</strong> <code style="background: #fff; padding: 2px 8px; border-radius: 4px; font-size: 16px; font-weight: bold;">${vars.temporaryPassword}</code></p>
      <p style="margin: 0; color: #dc2626; font-weight: 600; font-size: 13px;">Please change your password immediately after logging in.</p>
    `)}

    <h3 style="margin: 28px 0 12px 0; color: #1e3a5f; font-size: 16px; font-weight: 600;">What's Next?</h3>
    <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
      <li><strong>Log into your admin panel</strong> at <a href="${vars.newspaperUrl}/backend" style="color: #2563eb;">${vars.newspaperUrl}/backend</a></li>
      <li><strong>Change your password</strong> for security</li>
      <li><strong>Customize your newspaper</strong> with your branding and categories</li>
      <li><strong>Watch your AI journalists</strong> start generating local content!</li>
    </ol>

    ${ctaButton('Open Your Admin Panel', `${vars.newspaperUrl}/backend`)}

    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      If you have any questions, simply reply to this email. We're here to help.
    </p>
  `;

  const text = `Welcome to ${vars.newspaperName}!

Congratulations! Your AI-powered newspaper has been created and is now live.

YOUR NEWSPAPER
URL: ${vars.newspaperUrl}

ADMIN LOGIN CREDENTIALS
Admin Panel: ${vars.newspaperUrl}/backend
Email: ${vars.adminEmail}
Password: ${vars.temporaryPassword}

IMPORTANT: Please change your password immediately after logging in!

WHAT'S NEXT?
1. Log into your admin panel at ${vars.newspaperUrl}/backend
2. Change your password for security
3. Customize your newspaper with your branding and categories
4. Watch your AI journalists start generating local content!

If you have any questions, reply to this email. We're here to help.

--
Newsroom AIOS - A service of Farrington Development
https://www.newsroomaios.com | hello@newsroomaios.com
(c) ${CURRENT_YEAR} Farrington Development. All rights reserved.`;

  return {
    html: wrapInBrandedTemplate(content, { preheader: `Your newspaper ${vars.newspaperName} is live!` }),
    text,
  };
}

// ─── 2. Credit Limit Warning Email ──────────────────────────────────────────

export function buildCreditWarningEmail(vars: {
  ownerName: string;
  newspaperName: string;
  creditsUsed: number;
  creditsTotal: number;
  percentUsed: number;
  daysRemaining: number;
  accountUrl: string;
}): { html: string; text: string } {
  const content = `
    ${greeting(vars.ownerName)}

    <p style="margin: 0 0 20px 0;">
      Your newspaper <strong>${vars.newspaperName}</strong> has used <strong>${vars.percentUsed}%</strong> of its monthly credits.
    </p>

    ${warningBox('Credit Usage Summary', `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Credits Used</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #92400e;">${vars.creditsUsed} of ${vars.creditsTotal}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Percent Used</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #92400e;">${vars.percentUsed}%</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Days Until Reset</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">${vars.daysRemaining}</td>
        </tr>
      </table>
    `)}

    <p style="margin: 0 0 16px 0; color: #374151; font-size: 14px;">
      To ensure uninterrupted AI content generation, you can upgrade your plan for additional monthly credits or purchase a credit top-off from your account dashboard.
    </p>

    ${ctaButton('Manage Your Account', vars.accountUrl)}
  `;

  const text = `Hi ${vars.ownerName},

Your newspaper ${vars.newspaperName} has used ${vars.percentUsed}% of its monthly credits.

CREDIT USAGE SUMMARY
Credits Used: ${vars.creditsUsed} of ${vars.creditsTotal}
Percent Used: ${vars.percentUsed}%
Days Until Reset: ${vars.daysRemaining}

To ensure uninterrupted AI content generation, you can upgrade your plan or purchase a credit top-off from your account dashboard.

Manage your account: ${vars.accountUrl}

--
Newsroom AIOS - A service of Farrington Development
https://www.newsroomaios.com | hello@newsroomaios.com
(c) ${CURRENT_YEAR} Farrington Development. All rights reserved.`;

  return {
    html: wrapInBrandedTemplate(content, { preheader: `${vars.newspaperName} has used ${vars.percentUsed}% of monthly credits` }),
    text,
  };
}

// ─── 3. Payment Confirmation Email ──────────────────────────────────────────

export function buildPaymentConfirmationEmail(vars: {
  ownerName: string;
  newspaperName: string;
  planName: string;
  amount: string;
  nextBillingDate: string;
  invoiceUrl?: string;
}): { html: string; text: string } {
  const content = `
    ${greeting(vars.ownerName)}

    <p style="margin: 0 0 20px 0;">
      We've received your payment. Thank you for keeping <strong>${vars.newspaperName}</strong> running!
    </p>

    ${successBox('Payment Received', `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Plan</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">${vars.planName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Amount Charged</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #166534;">${vars.amount}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Next Charge Date</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">${vars.nextBillingDate}</td>
        </tr>
      </table>
    `)}

    <p style="margin: 0 0 16px 0; color: #374151; font-size: 14px;">
      Your credits have been refreshed and your AI journalists are ready to keep producing great local content.
    </p>

    ${vars.invoiceUrl ? ctaButton('View Invoice', vars.invoiceUrl) : ''}
  `;

  const text = `Hi ${vars.ownerName},

We've received your payment. Thank you for keeping ${vars.newspaperName} running!

PAYMENT RECEIVED
Plan: ${vars.planName}
Amount Charged: ${vars.amount}
Next Charge Date: ${vars.nextBillingDate}

Your credits have been refreshed and your AI journalists are ready to keep producing great local content.
${vars.invoiceUrl ? `\nView invoice: ${vars.invoiceUrl}` : ''}

--
Newsroom AIOS - A service of Farrington Development
https://www.newsroomaios.com | hello@newsroomaios.com
(c) ${CURRENT_YEAR} Farrington Development. All rights reserved.`;

  return {
    html: wrapInBrandedTemplate(content, { preheader: `Payment confirmed for ${vars.newspaperName} - ${vars.planName}` }),
    text,
  };
}

// ─── 4. Payment Failed Email ────────────────────────────────────────────────

export function buildPaymentFailedEmail(vars: {
  ownerName: string;
  newspaperName: string;
  amount: string;
  retryDate: string;
  billingUrl: string;
}): { html: string; text: string } {
  const content = `
    ${greeting(vars.ownerName)}

    <p style="margin: 0 0 20px 0;">
      We were unable to process the payment for <strong>${vars.newspaperName}</strong>. Please update your payment method to avoid any disruption to your service.
    </p>

    ${alertBox('Payment Failed', `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Amount</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">${vars.amount}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Next Retry</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">${vars.retryDate}</td>
        </tr>
      </table>
    `)}

    <p style="margin: 0 0 16px 0; color: #374151; font-size: 14px;">
      We'll automatically retry the payment on ${vars.retryDate}. To prevent any issues, please update your payment information.
    </p>

    ${ctaButton('Update Payment Method', vars.billingUrl)}
  `;

  const text = `Hi ${vars.ownerName},

We were unable to process the payment for ${vars.newspaperName}. Please update your payment method to avoid any disruption to your service.

PAYMENT FAILED
Amount: ${vars.amount}
Next Retry: ${vars.retryDate}

We'll automatically retry the payment on ${vars.retryDate}. To prevent any issues, please update your payment information.

Update payment method: ${vars.billingUrl}

--
Newsroom AIOS - A service of Farrington Development
https://www.newsroomaios.com | hello@newsroomaios.com
(c) ${CURRENT_YEAR} Farrington Development. All rights reserved.`;

  return {
    html: wrapInBrandedTemplate(content, { preheader: `Action needed: payment failed for ${vars.newspaperName}` }),
    text,
  };
}

// ─── 5. New Lead Notification (to Carl) ─────────────────────────────────────

export function buildNewLeadEmail(vars: {
  leadName: string;
  email: string;
  phone?: string;
  newspaperName: string;
  city: string;
  state: string;
  county?: string;
  notes?: string;
}): { html: string; text: string } {
  const content = `
    <h2 style="margin: 0 0 8px 0; color: #1e3a5f; font-size: 22px; font-weight: 700;">
      New Lead Submitted
    </h2>
    <p style="margin: 0 0 20px 0; color: #4b5563;">
      Someone just reserved a spot on the Newsroom AIOS growth map.
    </p>

    ${infoBox('Lead Details', `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280; width: 120px;">Name</td>
          <td style="padding: 4px 0; font-weight: 600;">${vars.leadName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Email</td>
          <td style="padding: 4px 0;"><a href="mailto:${vars.email}" style="color: #2563eb; text-decoration: none;">${vars.email}</a></td>
        </tr>
        ${vars.phone ? `<tr>
          <td style="padding: 4px 0; color: #6b7280;">Phone</td>
          <td style="padding: 4px 0;">${vars.phone}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Newspaper</td>
          <td style="padding: 4px 0; font-weight: 600;">${vars.newspaperName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Location</td>
          <td style="padding: 4px 0;">${vars.city}, ${vars.state}${vars.county ? ` (${vars.county} County)` : ''}</td>
        </tr>
        ${vars.notes ? `<tr>
          <td style="padding: 4px 0; color: #6b7280; vertical-align: top;">Notes</td>
          <td style="padding: 4px 0; font-style: italic;">${vars.notes}</td>
        </tr>` : ''}
      </table>
    `)}

    ${ctaButton('View Growth Map', 'https://www.newsroomaios.com/admin/growth-map')}
  `;

  const text = `NEW LEAD SUBMITTED

Someone just reserved a spot on the Newsroom AIOS growth map.

LEAD DETAILS
Name: ${vars.leadName}
Email: ${vars.email}
${vars.phone ? `Phone: ${vars.phone}\n` : ''}Newspaper: ${vars.newspaperName}
Location: ${vars.city}, ${vars.state}${vars.county ? ` (${vars.county} County)` : ''}
${vars.notes ? `Notes: ${vars.notes}\n` : ''}

View Growth Map: https://www.newsroomaios.com/admin/growth-map

--
Newsroom AIOS - A service of Farrington Development
https://www.newsroomaios.com | hello@newsroomaios.com
(c) ${CURRENT_YEAR} Farrington Development. All rights reserved.`;

  return {
    html: wrapInBrandedTemplate(content, { preheader: `New lead: ${vars.leadName} wants to launch ${vars.newspaperName} in ${vars.city}, ${vars.state}` }),
    text,
  };
}

// ─── 6. Newsletter Wrapper (for tenant sites) ──────────────────────────────

export function buildNewsletterEmail(vars: {
  newspaperName: string;
  subject: string;
  contentHtml: string;
  unsubscribeUrl: string;
}): { html: string; text: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1e3a5f; font-size: 22px; font-weight: 700;">
      ${vars.subject}
    </h2>

    <div style="font-size: 15px; line-height: 1.7; color: #1f2937;">
      ${vars.contentHtml}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0 0;">
      <tr>
        <td style="padding: 16px 0; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 12px;">
            You received this email because you subscribed to <strong>${vars.newspaperName}</strong>.
          </p>
          <a href="${vars.unsubscribeUrl}" style="color: #6b7280; font-size: 12px; text-decoration: underline;">
            Unsubscribe
          </a>
        </td>
      </tr>
    </table>
  `;

  // Strip HTML tags for plain text version
  const plainContent = vars.contentHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const text = `${vars.subject}

${plainContent}

---
You received this email because you subscribed to ${vars.newspaperName}.
Unsubscribe: ${vars.unsubscribeUrl}

--
Newsroom AIOS - A service of Farrington Development
https://www.newsroomaios.com | hello@newsroomaios.com
(c) ${CURRENT_YEAR} Farrington Development. All rights reserved.`;

  return {
    html: wrapInBrandedTemplate(content, { preheader: `${vars.newspaperName}: ${vars.subject}` }),
    text,
  };
}

// ─── 7. Plan Upgrade Confirmation ───────────────────────────────────────────

export function buildPlanChangeEmail(vars: {
  ownerName: string;
  newspaperName: string;
  oldPlan: string;
  newPlan: string;
  newCredits: number;
  effectiveDate: string;
}): { html: string; text: string } {
  const content = `
    ${greeting(vars.ownerName)}

    <p style="margin: 0 0 20px 0;">
      Your plan for <strong>${vars.newspaperName}</strong> has been updated.
    </p>

    ${successBox('Plan Updated', `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Previous Plan</td>
          <td style="padding: 4px 0; text-align: right;">${vars.oldPlan}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">New Plan</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #166534;">${vars.newPlan}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Monthly Credits</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600;">${vars.newCredits.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Effective</td>
          <td style="padding: 4px 0; text-align: right;">${vars.effectiveDate}</td>
        </tr>
      </table>
    `)}

    <p style="margin: 0; color: #374151; font-size: 14px;">
      Your updated credit allocation is available immediately. If you have any questions about your new plan, just reply to this email.
    </p>
  `;

  const text = `Hi ${vars.ownerName},

Your plan for ${vars.newspaperName} has been updated.

PLAN UPDATED
Previous Plan: ${vars.oldPlan}
New Plan: ${vars.newPlan}
Monthly Credits: ${vars.newCredits.toLocaleString()}
Effective: ${vars.effectiveDate}

Your updated credit allocation is available immediately. If you have any questions, reply to this email.

--
Newsroom AIOS - A service of Farrington Development
https://www.newsroomaios.com | hello@newsroomaios.com
(c) ${CURRENT_YEAR} Farrington Development. All rights reserved.`;

  return {
    html: wrapInBrandedTemplate(content, { preheader: `Plan updated to ${vars.newPlan} for ${vars.newspaperName}` }),
    text,
  };
}
