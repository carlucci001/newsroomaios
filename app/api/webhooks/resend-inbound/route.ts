import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * Email forwarding rules: address → destination(s)
 *
 * Catch-all ('*') forwards any unmatched address.
 * Addresses are matched case-insensitively against the local part
 * (everything before @newsroomaios.com).
 */
const FORWARDING_RULES: Record<string, string[]> = {
  'carl':    ['carlfaring@gmail.com'],
  'hello':   ['carlfaring@gmail.com'],
  'support': ['carlfaring@gmail.com'],
  'info':    ['carlfaring@gmail.com'],
  '*':       ['carlfaring@gmail.com'], // catch-all
};

/**
 * Resolve where to forward an inbound email based on the "to" address.
 */
function getForwardingDestinations(toAddresses: string[]): string[] {
  const destinations = new Set<string>();

  for (const addr of toAddresses) {
    const localPart = addr.split('@')[0]?.toLowerCase();
    const rules = FORWARDING_RULES[localPart] || FORWARDING_RULES['*'];
    if (rules) {
      rules.forEach(d => destinations.add(d));
    }
  }

  return Array.from(destinations);
}

/**
 * Fetch the full email content from Resend's received emails API.
 */
async function fetchEmailContent(emailId: string): Promise<{
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
} | null> {
  try {
    const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
    });

    if (!response.ok) {
      console.error(`[Inbound] Failed to fetch email ${emailId}: HTTP ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Inbound] Error fetching email ${emailId}:`, error);
    return null;
  }
}

/**
 * Forward an email to the specified destinations via Resend send API.
 */
async function forwardEmail(
  destinations: string[],
  originalFrom: string,
  originalTo: string[],
  subject: string,
  html?: string,
  text?: string,
): Promise<boolean> {
  const forwardedSubject = `Fwd: ${subject}`;
  const forwardHeader = `<div style="padding: 12px 16px; margin-bottom: 16px; background: #f3f4f6; border-left: 4px solid #2563eb; border-radius: 4px; font-size: 13px; color: #4b5563;">
    <strong>Forwarded email</strong> from <strong>${originalFrom}</strong><br>
    To: ${originalTo.join(', ')}<br>
    Subject: ${subject}
  </div>`;

  const forwardedHtml = html
    ? `${forwardHeader}${html}`
    : `${forwardHeader}<pre style="white-space: pre-wrap; font-family: inherit;">${text || '(no content)'}</pre>`;

  const forwardedText = `--- Forwarded email ---\nFrom: ${originalFrom}\nTo: ${originalTo.join(', ')}\nSubject: ${subject}\n\n${text || '(no content)'}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Newsroom AIOS Mail <hello@newsroomaios.com>`,
        to: destinations,
        reply_to: originalFrom,
        subject: forwardedSubject,
        html: forwardedHtml,
        text: forwardedText,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[Inbound] Failed to forward:', err);
      return false;
    }

    const data = await response.json();
    console.log(`[Inbound] Forwarded to ${destinations.join(', ')}: ${data.id}`);
    return true;
  } catch (error) {
    console.error('[Inbound] Error forwarding email:', error);
    return false;
  }
}

/**
 * POST /api/webhooks/resend-inbound
 *
 * Receives Resend's email.received webhook events and forwards
 * inbound emails to the appropriate destination based on FORWARDING_RULES.
 */
export async function POST(request: Request) {
  try {
    if (!RESEND_API_KEY) {
      console.error('[Inbound] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const payload = await request.json();

    // Resend sends different event types — we only care about email.received
    if (payload.type !== 'email.received') {
      console.log(`[Inbound] Ignoring event type: ${payload.type}`);
      return NextResponse.json({ received: true });
    }

    const { email_id, from, to, subject } = payload.data || {};

    if (!email_id || !from || !to) {
      console.error('[Inbound] Missing required fields in webhook payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`[Inbound] Received email from ${from} to ${to.join(', ')}: "${subject}"`);

    // Determine forwarding destinations
    const destinations = getForwardingDestinations(to);
    if (destinations.length === 0) {
      console.log('[Inbound] No forwarding rules matched, dropping email');
      return NextResponse.json({ received: true, forwarded: false });
    }

    // Avoid forwarding loops: don't forward emails FROM a destination address
    const fromAddress = from.replace(/.*<([^>]+)>/, '$1').toLowerCase();
    const filteredDestinations = destinations.filter(d => d.toLowerCase() !== fromAddress);
    if (filteredDestinations.length === 0) {
      console.log('[Inbound] Skipping forward to avoid loop (sender is a destination)');
      return NextResponse.json({ received: true, forwarded: false, reason: 'loop prevention' });
    }

    // Fetch full email content (webhook only has metadata)
    const fullEmail = await fetchEmailContent(email_id);

    const forwarded = await forwardEmail(
      filteredDestinations,
      from,
      to,
      subject || '(no subject)',
      fullEmail?.html,
      fullEmail?.text,
    );

    return NextResponse.json({ received: true, forwarded, destinations: filteredDestinations });
  } catch (error) {
    console.error('[Inbound] Webhook error:', error);
    // Return 200 so Resend doesn't retry on parse errors
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}
