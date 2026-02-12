/**
 * Validates the X-Platform-Secret header against the configured PLATFORM_SECRET env var.
 * Returns true if valid, false otherwise.
 */
export function verifyPlatformSecret(request: Request): boolean {
  const secret = process.env.PLATFORM_SECRET;
  if (!secret) {
    console.error('[Auth] PLATFORM_SECRET environment variable is not configured');
    return false;
  }
  const provided = request.headers.get('x-platform-secret');
  return provided === secret;
}
