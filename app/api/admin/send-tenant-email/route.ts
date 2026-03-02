import { NextResponse } from 'next/server';
import { wrapInBrandedTemplate } from '@/lib/emailTemplates';
import { sendEmail, isResendConfigured } from '@/lib/resend';

const ADMIN_EMAIL = 'carlfaring@gmail.com';

/**
 * POST /api/admin/send-tenant-email
 *
 * Send a branded email to a tenant owner from the platform admin.
 * Body: { to: string, subject: string, bodyHtml: string }
 *
 * The bodyHtml is wrapped in the branded Newsroom AIOS template.
 * Carl is BCC'd on every outbound email.
 */
export async function POST(request: Request) {
  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
  }

  try {
    const { to, subject, bodyHtml } = await request.json();

    if (!to || !subject || !bodyHtml) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, bodyHtml' },
        { status: 400 }
      );
    }

    const html = wrapInBrandedTemplate(bodyHtml, {
      preheader: subject,
    });

    const result = await sendEmail({
      to,
      subject,
      html,
      bcc: ADMIN_EMAIL,
    });

    if (result.success) {
      console.log(`[Admin Email] Sent to ${to}: "${subject}" (${result.messageId})`);
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
