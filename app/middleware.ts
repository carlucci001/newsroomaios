import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled via environment variable
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  // Allow access to admin routes even in maintenance mode
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // Allow access to maintenance page itself
  const isMaintenancePage = request.nextUrl.pathname === '/maintenance';

  // If maintenance mode is on and not accessing allowed routes
  if (maintenanceMode && !isAdminRoute && !isMaintenancePage) {
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
