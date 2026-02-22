'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const auth = getAuthInstance();
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with that email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
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
              Reset your password
            </h1>
            <p className="text-gray-600">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Reset Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">
                    Check your email for a password reset link
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  We sent a password reset link to <strong>{email}</strong>.
                  Check your inbox and spam folder.
                </p>
                <Link
                  href="/account/login"
                  className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  href="/account/login"
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  Sign in
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
