import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory cache for maintenance mode status
let maintenanceCache: { value: boolean; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

async function getMaintenanceModeStatus(): Promise<boolean> {
  // First check environment variable (emergency override)
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return true;
  }

  // Check cache
  const now = Date.now();
  if (maintenanceCache && (now - maintenanceCache.timestamp) < CACHE_TTL) {
    return maintenanceCache.value;
  }

  // Fetch from Firestore via API route
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/maintenance-mode`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const isEnabled = data.maintenanceMode === true;

      // Update cache
      maintenanceCache = {
        value: isEnabled,
        timestamp: now,
      };

      return isEnabled;
    }
  } catch (error) {
    console.error('Failed to check maintenance mode:', error);
  }

  // Default to false if fetch fails
  return false;
}

export async function middleware(request: NextRequest) {
  // Allow access to admin routes even in maintenance mode
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // Allow access to maintenance page itself
  const isMaintenancePage = request.nextUrl.pathname === '/maintenance';

  // Allow access to API routes (needed for checking maintenance mode)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Check if maintenance mode is enabled
  const maintenanceMode = await getMaintenanceModeStatus();

  // If maintenance mode is on and not accessing allowed routes
  if (maintenanceMode && !isAdminRoute && !isMaintenancePage && !isApiRoute) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
