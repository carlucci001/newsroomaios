'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export default function AccountLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const auth = getAuthInstance();
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/account');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('configuration') || err.message?.includes('Missing')) {
        setError('Service configuration error. Please contact support.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-brand-50 to-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600">
              Sign in to manage your newspaper
            </p>
          </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900">Password</label>
                <Link
                  href="/account/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/onboarding"
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                Get started
              </Link>
            </p>
          </div>
        </div>

          {/* Help Link */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Need help?{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
