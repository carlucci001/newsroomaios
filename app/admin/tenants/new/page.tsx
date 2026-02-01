'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { DEFAULT_PLANS } from '@/types/credits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const DEFAULT_CATEGORIES = [
  { id: 'local-news', name: 'Local News', slug: 'local-news', directive: 'Local community news and events', enabled: true },
  { id: 'sports', name: 'Sports', slug: 'sports', directive: 'Local sports coverage', enabled: true },
  { id: 'business', name: 'Business', slug: 'business', directive: 'Local business news and economy', enabled: true },
  { id: 'weather', name: 'Weather', slug: 'weather', directive: 'Weather forecasts and alerts', enabled: true },
  { id: 'community', name: 'Community', slug: 'community', directive: 'Community events and announcements', enabled: true },
  { id: 'opinion', name: 'Opinion', slug: 'opinion', directive: 'Editorials and opinion pieces', enabled: true },
];

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    domain: '',
    ownerEmail: '',
    city: '',
    state: '',
    planId: 'starter',
    trialDays: 14,
  });

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const db = getDb();

      // Check if domain already exists
      const domainQuery = query(collection(db, 'tenants'), where('domain', '==', form.domain));
      const domainSnap = await getDocs(domainQuery);
      if (!domainSnap.empty) {
        setError('A newspaper with this domain already exists');
        setLoading(false);
        return;
      }

      // Create slug from business name
      const slug = form.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Generate unique API key
      const apiKey = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      // Create tenant
      const tenantData: Omit<Tenant, 'id'> = {
        businessName: form.businessName,
        slug,
        domain: form.domain,
        ownerEmail: form.ownerEmail,
        apiKey,
        serviceArea: {
          city: form.city,
          state: form.state,
        },
        categories: DEFAULT_CATEGORIES,
        status: 'provisioning',
        licensingStatus: 'trial',
        createdAt: new Date(),
        trialEndsAt: new Date(Date.now() + form.trialDays * 24 * 60 * 60 * 1000),
      };

      const tenantRef = await addDoc(collection(db, 'tenants'), tenantData);

      // Create credit allocation
      const plan = DEFAULT_PLANS.find((p) => p.id === form.planId) || DEFAULT_PLANS[0];
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      await addDoc(collection(db, 'tenantCredits'), {
        tenantId: tenantRef.id,
        planId: plan.id,
        cycleStartDate: now,
        cycleEndDate: endOfMonth,
        monthlyAllocation: plan.monthlyCredits,
        creditsUsed: 0,
        creditsRemaining: plan.monthlyCredits,
        overageCredits: 0,
        softLimit: Math.floor(plan.monthlyCredits * 0.8),
        hardLimit: 0,
        status: 'active',
        softLimitWarned: false,
      });

      // Redirect to tenant detail page
      router.push(`/admin/tenants/${tenantRef.id}`);
    } catch (err: any) {
      console.error('Failed to create tenant:', err);
      setError(err.message || 'Failed to create newspaper');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Newspaper</h2>
          <p className="text-gray-500">Provision a new tenant for the Paper Partner Program</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={createTenant} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Newspaper Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="businessName">Newspaper Name *</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Mountain View Times"
                required
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="domain">Domain *</Label>
              <Input
                id="domain"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="mountainviewtimes.com"
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                The domain where this newspaper will be hosted
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="ownerEmail">Owner Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                placeholder="owner@example.com"
                required
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900">Service Area</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Mountain View"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="CA"
                required
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planId">Plan</Label>
              <select
                id="planId"
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3"
              >
                {DEFAULT_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.pricePerMonth}/mo ({plan.monthlyCredits.toLocaleString()} credits)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="trialDays">Trial Period (days)</Label>
              <Input
                id="trialDays"
                type="number"
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: parseInt(e.target.value) })}
                min={0}
                max={90}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end gap-4">
          <Link href="/admin/tenants">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Creating...' : 'Create Newspaper'}
          </Button>
        </div>
      </form>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">What happens next?</p>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
              <li>The tenant will be created with "provisioning" status</li>
              <li>Credits will be allocated based on the selected plan</li>
              <li>You can deploy their site from the Updates page</li>
              <li>Once deployed, change status to "active"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}