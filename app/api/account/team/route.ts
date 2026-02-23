import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';
import { verifyPlatformSecret } from '@/lib/platformAuth';

// CORS headers for tenant domains
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID, X-API-Key, X-Platform-Secret',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * Authenticate request via:
 * 1. Platform secret (internal/admin calls)
 * 2. Tenant API key (calls from tenant site)
 * 3. Firebase Auth ID token (calls from platform account pages)
 */
async function authenticateRequest(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
  tenantId?: string;
}> {
  const db = getAdminDb();
  if (!db) return { valid: false, error: 'Server configuration error' };

  const platformSecret = request.headers.get('x-platform-secret');
  const tenantId = request.headers.get('x-tenant-id');
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');

  // Option 1: Platform secret (internal/admin calls)
  if (platformSecret) {
    if (!verifyPlatformSecret(request)) {
      return { valid: false, error: 'Invalid platform secret' };
    }
    if (!tenantId) {
      return { valid: false, error: 'Tenant ID required' };
    }
    return { valid: true, tenantId };
  }

  // Option 2: Tenant API key (calls from tenant site)
  if (tenantId && apiKey) {
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return { valid: false, error: 'Tenant not found' };
    }
    if (tenantDoc.data()?.apiKey !== apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }
    return { valid: true, tenantId };
  }

  // Option 3: Firebase Auth ID token (from platform account pages)
  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7);
    const auth = getAdminAuth();
    if (!auth) return { valid: false, error: 'Auth not configured' };

    try {
      const decoded = await auth.verifyIdToken(idToken);
      // Look up user's tenant from the users collection
      const userDoc = await db.collection('users').doc(decoded.uid).get();
      if (!userDoc.exists) {
        return { valid: false, error: 'User not linked to any tenant' };
      }
      const userTenantId = userDoc.data()?.tenantId;
      if (!userTenantId) {
        return { valid: false, error: 'No tenant found for user' };
      }
      return { valid: true, tenantId: userTenantId };
    } catch {
      return { valid: false, error: 'Invalid auth token' };
    }
  }

  return { valid: false, error: 'Authentication required' };
}

/**
 * GET /api/account/team
 * List all users who have platform account access for this tenant
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const db = getAdminDb()!;
    const tenantId = authResult.tenantId!;

    // Get all users linked to this tenant
    const usersSnap = await db.collection('users')
      .where('tenantId', '==', tenantId)
      .get();

    // Get the tenant doc to identify the primary owner
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    const ownerEmail = tenantDoc.data()?.ownerEmail;

    const members = usersSnap.docs.map(doc => {
      const data = doc.data();
      const isPrimary = data.email === ownerEmail;
      const role = isPrimary ? 'owner' : (data.role || 'admin');

      // Auto-fix: if primary owner's doc says 'admin', correct it to 'owner'
      if (isPrimary && data.role !== 'owner') {
        db.collection('users').doc(doc.id).update({ role: 'owner' }).catch(() => {});
      }

      return {
        uid: doc.id,
        email: data.email,
        displayName: data.displayName || null,
        role,
        isPrimaryOwner: isPrimary,
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
      };
    });

    return NextResponse.json(
      { success: true, members },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('[Account Team] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team members' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/account/team
 * Add a team member to the tenant's platform account access
 * Called by tenant sites when an owner/admin user is created
 *
 * Body: { uid, email, displayName, role }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const db = getAdminDb()!;
    const auth = getAdminAuth();
    const tenantId = authResult.tenantId!;
    const { uid, email, displayName, role } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Only owner and admin roles get platform account access
    if (!['owner', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Only owner and admin roles get platform account access' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Determine the Firebase Auth UID
    let resolvedUid = uid;

    if (!resolvedUid && auth) {
      // Try to find existing user by email, or create one
      try {
        const userRecord = await auth.getUserByEmail(email);
        resolvedUid = userRecord.uid;
      } catch {
        // User doesn't exist in platform Firebase Auth — create them
        try {
          const tempPassword = generatePassword();
          const newUser = await auth.createUser({
            email,
            displayName: displayName || email.split('@')[0],
            password: tempPassword,
          });
          resolvedUid = newUser.uid;
          console.log(`[Account Team] Created platform Auth user for ${email}: ${resolvedUid}`);
        } catch (createErr: any) {
          console.error('[Account Team] Failed to create Auth user:', createErr);
          return NextResponse.json(
            { success: false, error: 'Failed to create platform account' },
            { status: 500, headers: CORS_HEADERS }
          );
        }
      }
    }

    if (!resolvedUid) {
      return NextResponse.json(
        { success: false, error: 'Could not resolve user ID' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Check if this user already has a different tenant
    const existingDoc = await db.collection('users').doc(resolvedUid).get();
    if (existingDoc.exists) {
      const existingTenantId = existingDoc.data()?.tenantId;
      if (existingTenantId && existingTenantId !== tenantId) {
        return NextResponse.json(
          { success: false, error: 'This user is already linked to a different newspaper' },
          { status: 409, headers: CORS_HEADERS }
        );
      }
    }

    // Create/update the platform user doc linking them to this tenant
    await db.collection('users').doc(resolvedUid).set({
      uid: resolvedUid,
      email,
      displayName: displayName || null,
      tenantId,
      role,
      status: 'active',
      createdAt: existingDoc.exists ? (existingDoc.data()?.createdAt || new Date()) : new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    console.log(`[Account Team] Added ${email} (${role}) to tenant ${tenantId}`);

    return NextResponse.json(
      { success: true, uid: resolvedUid, message: `${email} added to platform account` },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('[Account Team] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add team member' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * PATCH /api/account/team
 * Update a team member's role or display name
 *
 * Body: { uid, role?, displayName? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const db = getAdminDb()!;
    const tenantId = authResult.tenantId!;
    const { uid, role, displayName } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'uid is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Verify user belongs to this tenant
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'User not found in this tenant' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Protect primary owner's role — cannot be changed
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    const ownerEmail = tenantDoc.data()?.ownerEmail;
    if (userDoc.data()?.email === ownerEmail && role && role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot change the primary owner\'s role' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Validate role if provided
    if (role && !['owner', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be owner or admin' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (role) updates.role = role;
    if (displayName !== undefined) updates.displayName = displayName || null;

    await db.collection('users').doc(uid).update(updates);

    console.log(`[Account Team] Updated ${uid}: ${JSON.stringify(updates)}`);

    return NextResponse.json(
      { success: true, message: 'Team member updated' },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('[Account Team] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team member' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * DELETE /api/account/team
 * Remove a team member's platform account access
 * Called when an owner/admin is demoted, blocked, or removed
 *
 * Body: { uid } or { email }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const db = getAdminDb()!;
    const tenantId = authResult.tenantId!;
    const { uid, email } = await request.json();

    // Get the tenant doc to protect the primary owner
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    const ownerEmail = tenantDoc.data()?.ownerEmail;

    // Resolve UID from email if needed
    let resolvedUid = uid;
    if (!resolvedUid && email) {
      const usersSnap = await db.collection('users')
        .where('email', '==', email)
        .where('tenantId', '==', tenantId)
        .get();
      if (!usersSnap.empty) {
        resolvedUid = usersSnap.docs[0].id;
      }
    }

    if (!resolvedUid) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Get the user doc to check if they're the primary owner
    const userDoc = await db.collection('users').doc(resolvedUid).get();
    if (userDoc.exists && userDoc.data()?.email === ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove the primary owner from platform access' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Remove the platform user document
    await db.collection('users').doc(resolvedUid).delete();

    console.log(`[Account Team] Removed ${resolvedUid} from tenant ${tenantId}`);

    return NextResponse.json(
      { success: true, message: 'Team member removed from platform access' },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('[Account Team] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove team member' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pw = '';
  for (let i = 0; i < 12; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}
