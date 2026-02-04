'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Globe, AlertTriangle, KeyRound } from 'lucide-react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getDb } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        setUser(currentUser);

        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);

        if (userTenant) {
          setBusinessName(userTenant.businessName || '');
          setContactEmail(userTenant.contactEmail || currentUser.email || '');
          setEmailNotifications(userTenant.emailNotifications !== false);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSaveSettings = async () => {
    if (!tenant?.id) return;

    setSaving(true);
    try {
      const db = getDb();
      await updateDoc(doc(db, 'tenants', tenant.id), {
        businessName: businessName.trim(),
        contactEmail: contactEmail.trim(),
        emailNotifications,
        updatedAt: new Date(),
      });

      // Update local state
      setTenant({
        ...tenant,
        businessName: businessName.trim(),
        contactEmail: contactEmail.trim(),
        emailNotifications,
      });

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, user.email);
      alert(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Failed to send password reset email. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    // This would typically open a Stripe customer portal
    // or redirect to a cancellation flow
    alert('Subscription cancellation will be implemented with Stripe integration.');
    setShowCancelModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">No tenant found for your account.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Account Settings"
        subtitle="Manage your newspaper and account preferences"
      />

      {/* Business Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" />
            <CardTitle>Business Information</CardTitle>
          </div>
          <CardDescription>
            Update your newspaper details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              placeholder="Your Newspaper Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="domain">Domain</Label>
            <div className="mt-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <Input
                id="domain"
                value={tenant.domain || 'N/A'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Domain cannot be changed after setup
            </p>
          </div>

          <div>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="contact@yourdomain.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Plan</Label>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="primary" className="capitalize">
                {tenant.plan || 'Starter'} Plan
              </Badge>
              <span className="text-sm text-gray-500">
                {tenant.plan === 'professional' ? '1,000' :
                 tenant.plan === 'growth' ? '575' : '250'} credits/month
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t">
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            disabled={saving || !businessName.trim()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-gray-400" />
            <CardTitle>Account Security</CardTitle>
          </div>
          <CardDescription>
            Manage your login credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email Address</Label>
            <div className="mt-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <Input
                value={user?.email || 'N/A'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email address is managed through your authentication provider
            </p>
          </div>

          <div>
            <Label>Password</Label>
            <div className="mt-1">
              <Button
                variant="outline"
                onClick={handlePasswordReset}
              >
                Send Password Reset Email
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              We'll send a password reset link to {user?.email}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose how you want to receive updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">
                Receive updates about your account, credits, and billing
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t">
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger-200 bg-danger-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger-600" />
            <CardTitle className="text-danger-900">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-danger-700">
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-danger-900">Cancel Subscription</p>
              <p className="text-sm text-danger-700">
                This will cancel your subscription and disable your newspaper
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-danger-900">Cancel Subscription?</CardTitle>
              <CardDescription>
                Are you sure you want to cancel your subscription?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>This action will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Stop your subscription at the end of the current billing period</li>
                  <li>Disable access to your newspaper</li>
                  <li>Prevent new content from being generated</li>
                  <li>Your data will be preserved for 30 days</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelSubscription}
                className="flex-1"
              >
                Yes, Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
