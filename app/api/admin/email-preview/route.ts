import { NextResponse } from 'next/server';
import {
  buildWelcomeEmail,
  buildCreditWarningEmail,
  buildPaymentConfirmationEmail,
  buildPaymentFailedEmail,
  buildNewLeadEmail,
  buildNewsletterEmail,
  buildPlanChangeEmail,
} from '@/lib/emailTemplates';
import { sendEmail, isResendConfigured } from '@/lib/resend';

const SAMPLE_DATA = {
  welcome: {
    newspaperName: 'Mountain View Times',
    newspaperUrl: 'https://mountainviewtimes.newsroomaios.com',
    adminEmail: 'editor@mountainviewtimes.com',
    temporaryPassword: 'demo-Temp2026!',
  },
  creditWarning: {
    ownerName: 'Sarah Johnson',
    newspaperName: 'Mountain View Times',
    creditsUsed: 425,
    creditsTotal: 575,
    percentUsed: 74,
    daysRemaining: 12,
    accountUrl: 'https://mountainviewtimes.newsroomaios.com/backend/settings',
  },
  paymentConfirmation: {
    ownerName: 'Sarah Johnson',
    newspaperName: 'Mountain View Times',
    planName: 'Growth',
    amount: '$199.00',
    nextBillingDate: 'April 1, 2026',
    invoiceUrl: 'https://pay.stripe.com/invoice/example',
  },
  paymentFailed: {
    ownerName: 'Sarah Johnson',
    newspaperName: 'Mountain View Times',
    amount: '$199.00',
    retryDate: 'March 8, 2026',
    billingUrl: 'https://mountainviewtimes.newsroomaios.com/backend/settings',
  },
  newLead: {
    leadName: 'Michael Torres',
    email: 'mtorres@example.com',
    phone: '(828) 555-0142',
    newspaperName: 'Brevard Daily Herald',
    city: 'Brevard',
    state: 'North Carolina',
    county: 'Transylvania',
    notes: 'Interested in launching a local paper for the county. Currently no daily coverage.',
  },
  newsletter: {
    newspaperName: 'Mountain View Times',
    subject: 'This Week in Mountain View — March 1, 2026',
    contentHtml: `
      <h3>Top Stories This Week</h3>
      <p><strong>City Council Approves Downtown Revitalization Plan</strong><br>
      The Mountain View City Council voted 5-2 on Tuesday to approve a $12 million downtown revitalization project that will transform the historic Main Street corridor.</p>
      <p><strong>Local Schools Report Record Graduation Rates</strong><br>
      Mountain View County schools achieved a 94.2% graduation rate this year, the highest in the district's history.</p>
      <p><strong>Weekend Events</strong><br>
      Don't miss the Spring Arts Festival this Saturday at Riverside Park, featuring over 40 local artists and live music from 10am to 6pm.</p>
    `,
    unsubscribeUrl: 'https://mountainviewtimes.newsroomaios.com/unsubscribe?token=example',
  },
  planChange: {
    ownerName: 'Sarah Johnson',
    newspaperName: 'Mountain View Times',
    oldPlan: 'Starter',
    newPlan: 'Growth',
    newCredits: 575,
    effectiveDate: 'March 1, 2026',
  },
};

type TemplateName = 'welcome' | 'creditWarning' | 'paymentConfirmation' | 'paymentFailed' | 'newLead' | 'newsletter' | 'planChange';

function renderTemplate(templateName: TemplateName): { html: string; text: string } {
  switch (templateName) {
    case 'welcome':
      return buildWelcomeEmail(SAMPLE_DATA.welcome);
    case 'creditWarning':
      return buildCreditWarningEmail(SAMPLE_DATA.creditWarning);
    case 'paymentConfirmation':
      return buildPaymentConfirmationEmail(SAMPLE_DATA.paymentConfirmation);
    case 'paymentFailed':
      return buildPaymentFailedEmail(SAMPLE_DATA.paymentFailed);
    case 'newLead':
      return buildNewLeadEmail(SAMPLE_DATA.newLead);
    case 'newsletter':
      return buildNewsletterEmail(SAMPLE_DATA.newsletter);
    case 'planChange':
      return buildPlanChangeEmail(SAMPLE_DATA.planChange);
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}

/**
 * GET /api/admin/email-preview?template=welcome
 * Returns rendered HTML + plain text for a template with sample data
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateName = searchParams.get('template') as TemplateName | null;

  if (!templateName) {
    return NextResponse.json(
      { templates: Object.keys(SAMPLE_DATA) },
      { status: 200 }
    );
  }

  try {
    const { html, text } = renderTemplate(templateName);
    return NextResponse.json({ html, text, template: templateName });
  } catch {
    return NextResponse.json({ error: 'Invalid template name' }, { status: 400 });
  }
}

/**
 * POST /api/admin/email-preview
 * Send a test email for a given template
 * Body: { template: string, sendTo: string }
 */
export async function POST(request: Request) {
  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
  }

  try {
    const { template, sendTo } = await request.json();

    if (!template || !sendTo) {
      return NextResponse.json({ error: 'Missing template or sendTo' }, { status: 400 });
    }

    const { html } = renderTemplate(template as TemplateName);

    const result = await sendEmail({
      to: sendTo,
      subject: `[TEST] Email Template Preview: ${template}`,
      html,
    });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
