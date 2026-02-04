/**
 * Setup DNS Records Script
 *
 * This script adds required DNS records to GoDaddy for:
 * 1. Resend email verification (SPF, DKIM, DMARC)
 * 2. Vercel domain verification
 *
 * Run with: npx tsx scripts/setup-dns-records.ts
 */

import { addTxtRecords, getTxtRecords } from '../src/lib/godaddy';

interface ResendDNSRecord {
  type: 'TXT' | 'MX' | 'CNAME';
  name: string;
  value: string;
  ttl?: number;
}

async function getResendDNSRecords(): Promise<ResendDNSRecord[]> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not found in environment');
    return [];
  }

  try {
    // Get domain verification records from Resend
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Resend domains:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('Resend domains response:', JSON.stringify(data, null, 2));

    // Find newsroomaios.com domain
    const domain = data.data?.find((d: any) => d.name === 'newsroomaios.com');

    if (!domain) {
      console.error('newsroomaios.com not found in Resend domains');
      console.log('Available domains:', data.data?.map((d: any) => d.name));
      return [];
    }

    // Extract DNS records
    const records: ResendDNSRecord[] = [];

    if (domain.records) {
      domain.records.forEach((record: any) => {
        records.push({
          type: record.record_type,
          name: record.name,
          value: record.value,
          ttl: 3600,
        });
      });
    }

    return records;
  } catch (error) {
    console.error('Error fetching Resend DNS records:', error);
    return [];
  }
}

async function addDNSRecordsToGoDaddy() {
  console.log('🔍 Fetching current TXT records from GoDaddy...\n');

  const existingRecords = await getTxtRecords();
  console.log(`Found ${existingRecords.length} existing TXT records`);
  existingRecords.forEach(r => {
    console.log(`  - ${r.name}: ${r.data.substring(0, 50)}...`);
  });

  console.log('\n📧 Fetching Resend DNS records...\n');

  const resendRecords = await getResendDNSRecords();

  if (resendRecords.length === 0) {
    console.error('❌ No Resend DNS records found. Please check:');
    console.error('   1. RESEND_API_KEY is set in .env.local');
    console.error('   2. newsroomaios.com domain is added in Resend dashboard');
    console.error('   3. Visit: https://resend.com/domains');
    return;
  }

  console.log(`Found ${resendRecords.length} Resend DNS records:\n`);

  const txtRecordsToAdd = resendRecords
    .filter(r => r.type === 'TXT')
    .map(r => ({
      name: r.name,
      data: r.value,
      ttl: r.ttl || 3600,
    }));

  txtRecordsToAdd.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name || '@'}`);
    console.log(`   Type: TXT`);
    console.log(`   Value: ${r.data.substring(0, 60)}${r.data.length > 60 ? '...' : ''}`);
    console.log(`   TTL: ${r.ttl}\n`);
  });

  if (txtRecordsToAdd.length === 0) {
    console.log('⚠️  No TXT records to add');
    return;
  }

  console.log(`\n➕ Adding ${txtRecordsToAdd.length} TXT records to GoDaddy...\n`);

  const result = await addTxtRecords(txtRecordsToAdd);

  if (result.success) {
    console.log(`✅ Success! Added ${result.addedCount} TXT records to newsroomaios.com`);
    console.log('\n📝 Next steps:');
    console.log('   1. Wait 5-10 minutes for DNS propagation');
    console.log('   2. Verify records in Resend dashboard: https://resend.com/domains');
    console.log('   3. Test sending an email');
  } else {
    console.error(`❌ Failed to add DNS records: ${result.message}`);
  }
}

// Run the script
addDNSRecordsToGoDaddy().catch(console.error);
