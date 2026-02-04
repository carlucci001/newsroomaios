/**
 * Add missing Resend DNS records to GoDaddy
 */

const GODADDY_API_KEY = process.env.GODADDY_API_KEY;
const GODADDY_API_SECRET = process.env.GODADDY_API_SECRET;
const DOMAIN = 'newsroomaios.com';

async function addResendRecords() {
  if (!GODADDY_API_KEY || !GODADDY_API_SECRET) {
    console.error('❌ GoDaddy API credentials not found');
    return;
  }

  const authHeader = `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`;

  // Records to add
  const records = [
    // MX record for sending (send subdomain)
    {
      type: 'MX',
      name: 'send',
      data: 'feedback-smtp.us-east-1.amazonses.com',
      priority: 10,
      ttl: 3600,
    },
    // SPF TXT record for sending (send subdomain)
    {
      type: 'TXT',
      name: 'send',
      data: 'v=spf1 include:amazonses.com ~all',
      ttl: 3600,
    },
    // MX record for receiving (root domain)
    {
      type: 'MX',
      name: '@',
      data: 'inbound-smtp.us-east-1.amazonaws.com',
      priority: 10,
      ttl: 3600,
    },
  ];

  console.log('➕ Adding Resend DNS records to GoDaddy...\n');

  for (const record of records) {
    console.log(`Adding ${record.type} record: ${record.name || '@'} → ${record.data}`);

    try {
      const response = await fetch(
        `https://api.godaddy.com/v1/domains/${DOMAIN}/records`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([record]),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error(`  ❌ Failed: ${error.message || response.status}`);
      } else {
        console.log(`  ✅ Added successfully`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }

    console.log('');
  }

  console.log('✅ Done! Wait 5-10 minutes for DNS propagation, then verify in Resend dashboard.');
}

addResendRecords();
