/**
 * GoDaddy DNS API Service
 *
 * Handles automatic subdomain creation for tenant sites.
 * Each tenant gets {slug}.newsroomaios.com pointing to Vercel.
 */

const GODADDY_API_KEY = process.env.GODADDY_API_KEY;
const GODADDY_API_SECRET = process.env.GODADDY_API_SECRET;
const DOMAIN = 'newsroomaios.com';
const VERCEL_CNAME = 'cname.vercel-dns.com';

interface GoDaddyDNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'SOA' | 'SRV' | 'TXT';
  name: string;
  data: string;
  ttl: number;
}

interface GoDaddyError {
  code: string;
  message: string;
  fields?: { path: string; message: string }[];
}

/**
 * Check if GoDaddy API credentials are configured
 */
export function isGoDaddyConfigured(): boolean {
  return !!(GODADDY_API_KEY && GODADDY_API_SECRET);
}

/**
 * Get authorization header for GoDaddy API
 */
function getAuthHeader(): string {
  return `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`;
}

/**
 * Add a CNAME record for a subdomain pointing to Vercel
 *
 * @param subdomain - The subdomain name (e.g., "the42" for the42.newsroomaios.com)
 * @returns Success status and any error message
 */
export async function addSubdomainRecord(subdomain: string): Promise<{
  success: boolean;
  message: string;
  subdomain: string;
  fullDomain: string;
}> {
  const fullDomain = `${subdomain}.${DOMAIN}`;

  if (!isGoDaddyConfigured()) {
    console.warn('[GoDaddy] API credentials not configured, skipping DNS setup');
    return {
      success: false,
      message: 'GoDaddy API credentials not configured',
      subdomain,
      fullDomain,
    };
  }

  try {
    // First, check if record already exists
    const existingRecord = await getRecord(subdomain);
    if (existingRecord) {
      console.log(`[GoDaddy] Record already exists for ${fullDomain}`);
      return {
        success: true,
        message: 'DNS record already exists',
        subdomain,
        fullDomain,
      };
    }

    // Add the CNAME record
    const record: GoDaddyDNSRecord = {
      type: 'CNAME',
      name: subdomain,
      data: VERCEL_CNAME,
      ttl: 3600, // 1 hour
    };

    const response = await fetch(
      `https://api.godaddy.com/v1/domains/${DOMAIN}/records`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([record]),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as GoDaddyError;
      const errorMessage = errorData.message || `HTTP ${response.status}`;
      console.error(`[GoDaddy] Failed to add record: ${errorMessage}`);
      return {
        success: false,
        message: `Failed to add DNS record: ${errorMessage}`,
        subdomain,
        fullDomain,
      };
    }

    console.log(`[GoDaddy] Successfully added CNAME record for ${fullDomain}`);
    return {
      success: true,
      message: 'DNS record created successfully',
      subdomain,
      fullDomain,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[GoDaddy] Error adding record: ${errorMessage}`);
    return {
      success: false,
      message: `Error adding DNS record: ${errorMessage}`,
      subdomain,
      fullDomain,
    };
  }
}

/**
 * Get an existing DNS record for a subdomain
 */
export async function getRecord(subdomain: string): Promise<GoDaddyDNSRecord | null> {
  if (!isGoDaddyConfigured()) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.godaddy.com/v1/domains/${DOMAIN}/records/CNAME/${subdomain}`,
      {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // 404 means record doesn't exist, which is fine
      if (response.status === 404) {
        return null;
      }
      return null;
    }

    const records = await response.json() as GoDaddyDNSRecord[];
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error('[GoDaddy] Error checking record:', error);
    return null;
  }
}

/**
 * Delete a DNS record for a subdomain
 * Use this when a tenant is deleted or suspended
 */
export async function deleteSubdomainRecord(subdomain: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isGoDaddyConfigured()) {
    return {
      success: false,
      message: 'GoDaddy API credentials not configured',
    };
  }

  try {
    const response = await fetch(
      `https://api.godaddy.com/v1/domains/${DOMAIN}/records/CNAME/${subdomain}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json().catch(() => ({})) as GoDaddyError;
      return {
        success: false,
        message: `Failed to delete DNS record: ${errorData.message || response.status}`,
      };
    }

    console.log(`[GoDaddy] Deleted CNAME record for ${subdomain}.${DOMAIN}`);
    return {
      success: true,
      message: 'DNS record deleted successfully',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Error deleting DNS record: ${errorMessage}`,
    };
  }
}

/**
 * List all CNAME records for the domain
 * Useful for admin/debugging
 */
export async function listAllSubdomains(): Promise<GoDaddyDNSRecord[]> {
  if (!isGoDaddyConfigured()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.godaddy.com/v1/domains/${DOMAIN}/records/CNAME`,
      {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    return await response.json() as GoDaddyDNSRecord[];
  } catch (error) {
    console.error('[GoDaddy] Error listing records:', error);
    return [];
  }
}

/**
 * Add TXT records to the domain
 * Used for email verification (SPF, DKIM, DMARC) and other verifications
 */
export async function addTxtRecords(records: Array<{ name: string; data: string; ttl?: number }>): Promise<{
  success: boolean;
  message: string;
  addedCount: number;
}> {
  if (!isGoDaddyConfigured()) {
    return {
      success: false,
      message: 'GoDaddy API credentials not configured',
      addedCount: 0,
    };
  }

  try {
    const txtRecords: GoDaddyDNSRecord[] = records.map(r => ({
      type: 'TXT',
      name: r.name,
      data: r.data,
      ttl: r.ttl || 3600,
    }));

    const response = await fetch(
      `https://api.godaddy.com/v1/domains/${DOMAIN}/records`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(txtRecords),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as GoDaddyError;
      const errorMessage = errorData.message || `HTTP ${response.status}`;
      console.error(`[GoDaddy] Failed to add TXT records: ${errorMessage}`);
      return {
        success: false,
        message: `Failed to add TXT records: ${errorMessage}`,
        addedCount: 0,
      };
    }

    console.log(`[GoDaddy] Successfully added ${txtRecords.length} TXT records`);
    return {
      success: true,
      message: `Added ${txtRecords.length} TXT records successfully`,
      addedCount: txtRecords.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[GoDaddy] Error adding TXT records: ${errorMessage}`);
    return {
      success: false,
      message: `Error adding TXT records: ${errorMessage}`,
      addedCount: 0,
    };
  }
}

/**
 * Get all TXT records for the domain
 */
export async function getTxtRecords(): Promise<GoDaddyDNSRecord[]> {
  if (!isGoDaddyConfigured()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.godaddy.com/v1/domains/${DOMAIN}/records/TXT`,
      {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    return await response.json() as GoDaddyDNSRecord[];
  } catch (error) {
    console.error('[GoDaddy] Error getting TXT records:', error);
    return [];
  }
}
