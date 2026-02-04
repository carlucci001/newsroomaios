'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_PLANS, CreditPlan } from '@/types/credits';
import { Settings as SettingsIcon, Mail, Clock, CreditCard, Github, DollarSign, CheckCircle } from 'lucide-react';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultTrialDays: number;
  defaultPlanId: string;
  stripeEnabled: boolean;
  stripePublishableKey?: string;
  gitHubRepo: string;
  gitHubToken?: string;
  notificationEmail: string;
}

const defaultSettings: PlatformSettings = {
  platformName: 'Newsroom AIOS',
  supportEmail: 'support@newsroomaios.com',
  defaultTrialDays: 14,
  defaultPlanId: 'starter',
  stripeEnabled: false,
  gitHubRepo: 'carlucci001/wnct-next',
  notificationEmail: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [plans, setPlans] = useState<CreditPlan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'integrations' | 'plans'>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const db = getDb();
      const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));

      if (settingsDoc.exists()) {
        setSettings({ ...defaultSettings, ...settingsDoc.data() } as PlatformSettings);
      }

      const plansDoc = await getDoc(doc(db, 'settings', 'plans'));
      if (plansDoc.exists()) {
        setPlans(plansDoc.data().plans as CreditPlan[]);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'platform'), settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  }

  async function savePlans() {
    setSaving(true);
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'plans'), { plans });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save plans:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Platform Settings"
        subtitle="Configure platform-wide settings and integrations"
      />

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'integrations', label: 'Integrations', icon: Github },
            { id: 'plans', label: 'Credit Plans', icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platformName" className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-gray-400" />
                    Platform Name
                  </Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Support Email
                  </Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="trialDays" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Default Trial Period (days)
                  </Label>
                  <Input
                    id="trialDays"
                    type="number"
                    value={settings.defaultTrialDays}
                    onChange={(e) => setSettings({ ...settings, defaultTrialDays: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="notificationEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Admin Notification Email
                  </Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                    className="mt-1"
                    placeholder="Receive notifications for new signups, etc."
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button onClick={saveSettings} disabled={saving} variant="primary">
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Stripe Integration</p>
                    <p className="text-sm text-gray-500">Enable payment processing with Stripe</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, stripeEnabled: !settings.stripeEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.stripeEnabled ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.stripeEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.stripeEnabled && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="stripeKey">Stripe Publishable Key</Label>
                    <Input
                      id="stripeKey"
                      value={settings.stripePublishableKey || ''}
                      onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                      placeholder="pk_test_..."
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                    <p className="text-sm text-warning-800">
                      Note: The secret key should be set as an environment variable (STRIPE_SECRET_KEY), not stored in the database.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="defaultPlan">Default Plan for New Tenants</Label>
                <select
                  id="defaultPlan"
                  value={settings.defaultPlanId}
                  onChange={(e) => setSettings({ ...settings, defaultPlanId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.pricePerMonth}/mo ({plan.monthlyCredits.toLocaleString()} credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button onClick={saveSettings} disabled={saving} variant="primary">
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">GitHub</p>
                    <p className="text-sm text-gray-500">Template repository for tenant deployments</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="gitHubRepo">Template Repository</Label>
                  <Input
                    id="gitHubRepo"
                    value={settings.gitHubRepo}
                    onChange={(e) => setSettings({ ...settings, gitHubRepo: e.target.value })}
                    placeholder="owner/repo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gitHubToken">GitHub Personal Access Token</Label>
                  <Input
                    id="gitHubToken"
                    type="password"
                    value={settings.gitHubToken || ''}
                    onChange={(e) => setSettings({ ...settings, gitHubToken: e.target.value })}
                    placeholder="ghp_..."
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Requires repo and workflow scopes for deployment automation
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button onClick={saveSettings} disabled={saving} variant="primary">
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Credit Plans */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Configure credit plans available to tenants. Changes will apply to new subscriptions.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <Card key={plan.id} className="border-2">
                    <CardHeader>
                      <Badge variant={index === 1 ? 'primary' : 'default'} className="w-fit">
                        {plan.name}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Plan Name</Label>
                        <Input
                          value={plan.name}
                          onChange={(e) => {
                            const updated = [...plans];
                            updated[index] = { ...plan, name: e.target.value };
                            setPlans(updated);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Monthly Price ($)</Label>
                          <Input
                            type="number"
                            value={plan.pricePerMonth}
                            onChange={(e) => {
                              const updated = [...plans];
                              updated[index] = { ...plan, pricePerMonth: parseFloat(e.target.value) };
                              setPlans(updated);
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Monthly Credits</Label>
                          <Input
                            type="number"
                            value={plan.monthlyCredits}
                            onChange={(e) => {
                              const updated = [...plans];
                              updated[index] = { ...plan, monthlyCredits: parseInt(e.target.value) };
                              setPlans(updated);
                            }}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Max AI Journalists</Label>
                          <Input
                            type="number"
                            value={plan.maxAIJournalists}
                            onChange={(e) => {
                              const updated = [...plans];
                              updated[index] = { ...plan, maxAIJournalists: parseInt(e.target.value) };
                              setPlans(updated);
                            }}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">-1 = unlimited</p>
                        </div>
                        <div>
                          <Label>Overage Rate ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={plan.pricePerCredit}
                            onChange={(e) => {
                              const updated = [...plans];
                              updated[index] = { ...plan, pricePerCredit: parseFloat(e.target.value) };
                              setPlans(updated);
                            }}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">Per credit</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button onClick={savePlans} disabled={saving} variant="primary">
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Plans'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Toast */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-success-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5" />
          Settings saved successfully
        </div>
      )}
    </PageContainer>
  );
}
