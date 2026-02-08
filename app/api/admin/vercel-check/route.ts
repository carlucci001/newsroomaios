import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/vercel-check
 * Diagnostic endpoint to verify Vercel API configuration on the platform.
 * Protected by PLATFORM_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('X-Platform-Secret');
  if (secret !== process.env.PLATFORM_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.VERCEL_API_TOKEN || '';
  const teamId = process.env.VERCEL_TEAM_ID || '';

  const diag: Record<string, unknown> = {
    tokenSet: !!token,
    tokenLength: token.length,
    tokenPrefix: token.substring(0, 4) + '...',
    teamIdSet: !!teamId,
    teamId: teamId,
  };

  // Try a simple Vercel API call to verify the token works
  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects?teamId=${teamId}&limit=1`
      : `https://api.vercel.com/v9/projects?limit=1`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    diag.vercelApiStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      diag.vercelApiWorking = true;
      diag.projectCount = data.projects?.length || 0;
      diag.firstProject = data.projects?.[0]?.name || 'none';
    } else {
      const err = await res.json();
      diag.vercelApiWorking = false;
      diag.vercelError = err.error?.message || JSON.stringify(err).substring(0, 200);
    }
  } catch (e: unknown) {
    diag.vercelApiWorking = false;
    diag.vercelError = e instanceof Error ? e.message : 'Unknown error';
  }

  return NextResponse.json(diag);
}
