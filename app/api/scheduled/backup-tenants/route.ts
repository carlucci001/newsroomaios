import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Tenant } from '@/types/tenant';

export const dynamic = 'force-dynamic';

/**
 * Automated Tenant Backup Cron Job
 *
 * Backs up each tenant's data to cloud storage (GCS).
 * Run daily via Vercel cron.
 *
 * Backup includes:
 * - Tenant configuration
 * - All articles
 * - AI journalists
 * - Credit records
 *
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/scheduled/backup-tenants", "schedule": "0 3 * * *" }]
 * }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const db = getDb();
    const results: Array<{
      tenantId: string;
      businessName: string;
      success: boolean;
      articlesBackedUp: number;
      backupUrl?: string;
      error?: string;
    }> = [];

    // Get all active tenants
    const tenantsQuery = query(
      collection(db, 'tenants'),
      where('status', 'in', ['active', 'provisioning', 'seeding'])
    );
    const tenantsSnap = await getDocs(tenantsQuery);

    if (tenantsSnap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No tenants to backup',
        tenantsProcessed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Check if GCS is configured
    const gcsConfigured = !!process.env.GCS_BUCKET_NAME && !!process.env.GCS_SERVICE_ACCOUNT_KEY;

    for (const tenantDoc of tenantsSnap.docs) {
      const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;

      try {
        // Get all articles for this tenant
        const articlesSnap = await getDocs(
          collection(db, `tenants/${tenant.id}/articles`)
        );

        // Get AI journalists for this tenant
        const journalistsQuery = query(
          collection(db, 'aiJournalists'),
          where('tenantId', '==', tenant.id)
        );
        const journalistsSnap = await getDocs(journalistsQuery);

        // Get credit records
        const creditsQuery = query(
          collection(db, 'tenantCredits'),
          where('tenantId', '==', tenant.id)
        );
        const creditsSnap = await getDocs(creditsQuery);

        // Build backup data
        const backupData = {
          tenant: {
            id: tenant.id,
            ...tenantDoc.data(),
          },
          articles: articlesSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
          journalists: journalistsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
          credits: creditsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
          backupMetadata: {
            createdAt: new Date().toISOString(),
            version: '1.0',
            articlesCount: articlesSnap.size,
            journalistsCount: journalistsSnap.size,
          },
        };

        let backupUrl: string | undefined;

        if (gcsConfigured) {
          // Upload to Google Cloud Storage
          backupUrl = await uploadToGCS(tenant.id, backupData);
        } else {
          // Log backup data for development (don't actually store)
          console.log(`[Backup] ${tenant.businessName}: ${articlesSnap.size} articles (GCS not configured)`);
        }

        results.push({
          tenantId: tenant.id,
          businessName: tenant.businessName,
          success: true,
          articlesBackedUp: articlesSnap.size,
          backupUrl,
        });
      } catch (error: any) {
        console.error(`[Backup] Error for ${tenant.businessName}:`, error);
        results.push({
          tenantId: tenant.id,
          businessName: tenant.businessName,
          success: false,
          articlesBackedUp: 0,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const totalArticles = results.reduce((sum, r) => sum + r.articlesBackedUp, 0);

    return NextResponse.json({
      success: true,
      tenantsProcessed: results.length,
      successCount,
      failedCount: results.length - successCount,
      totalArticlesBackedUp: totalArticles,
      gcsConfigured,
      duration: Date.now() - startTime,
      results,
    });
  } catch (error: any) {
    console.error('[Backup Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Upload backup data to Google Cloud Storage
 */
async function uploadToGCS(
  tenantId: string,
  backupData: object
): Promise<string> {
  const bucketName = process.env.GCS_BUCKET_NAME;
  const serviceAccountKey = process.env.GCS_SERVICE_ACCOUNT_KEY;

  if (!bucketName || !serviceAccountKey) {
    throw new Error('GCS not configured');
  }

  // Parse the base64-encoded service account key
  let credentials;
  try {
    const keyJson = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    credentials = JSON.parse(keyJson);
  } catch {
    throw new Error('Invalid GCS service account key');
  }

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `backups/${tenantId}/${date}/backup.json`;

  // Use Google Cloud Storage REST API
  const accessToken = await getGCSAccessToken(credentials);

  const response = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filename)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backupData),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GCS upload failed: ${error}`);
  }

  return `gs://${bucketName}/${filename}`;
}

/**
 * Get access token for GCS using service account
 */
async function getGCSAccessToken(credentials: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  // Create JWT for service account authentication
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
    scope: 'https://www.googleapis.com/auth/devstorage.read_write',
  };

  // Sign the JWT (simplified - in production use a proper JWT library)
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Use crypto to sign
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');

  const jwt = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to get GCS access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}
