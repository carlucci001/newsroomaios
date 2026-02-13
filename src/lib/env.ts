/**
 * Safe environment variable reader.
 *
 * Vercel env vars sometimes contain trailing \n or \r\n from copy-paste
 * or CLI entry. This causes silent failures: invalid URLs for Stripe,
 * broken API keys, bad Firebase config. Every env var read in server-side
 * code should go through this function.
 */
export function safeEnv(key: string, fallback: string = ''): string {
  return (process.env[key] || fallback).trim();
}
