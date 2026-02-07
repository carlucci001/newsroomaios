'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { DEFAULT_PLANS } from '@/types/credits';
import { createDefaultJournalists, createDefaultContentSources } from '@/types/aiJournalist';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Info, Building2, Globe, Mail, MapPin, CreditCard, Clock } from 'lucide-react';

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
        licensingStatus: 'active',
        createdAt: new Date(),
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

      // Auto-provision AI journalists (one per category)
      const journalists = createDefaultJournalists(
        tenantRef.id,
        form.businessName,
        DEFAULT_CATEGORIES
      );
      for (const journalist of journalists) {
        await addDoc(collection(db, 'aiJournalists'), journalist);
      }

      // Auto-provision content sources (local news feeds)
      const sources = createDefaultContentSources(tenantRef.id, form.city, form.state);
      for (const source of sources) {
        await addDoc(collection(db, 'contentSources'), source);
      }

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
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Add New Newspaper"
        subtitle="Provision a new tenant for the Paper Partner Program"
        action={
          <Link href="/admin/tenants">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        }
      />

      {/* Form */}
      <form onSubmit={createTenant} className="space-y-6">
        {error && (
          <Card className="border-danger-200 bg-danger-50">
            <CardContent className="pt-6">
              <p className="text-sm text-danger-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Newspaper Details */}
        <Card>
          <CardHeader>
            <CardTitle>Newspaper Details</CardTitle>
            <CardDescription>Basic information about the newspaper</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                Newspaper Name *
              </Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Mountain View Times"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="domain" className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                Domain *
              </Label>
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

            <div>
              <Label htmlFor="ownerEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Owner Email *
              </Label>
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
          </CardContent>
        </Card>

        {/* Service Area */}
        <Card>
          <CardHeader>
            <CardTitle>Service Area</CardTitle>
            <CardDescription>Geographic coverage region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  City *
                </Label>
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
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Plan and trial configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planId" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  Plan
                </Label>
                <select
                  id="planId"
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {DEFAULT_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.pricePerMonth}/mo ({plan.monthlyCredits.toLocaleString()} credits)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="trialDays" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Trial Period (days)
                </Label>
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
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-brand-200 bg-brand-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-brand-900 mb-2">What happens automatically?</p>
                <ul className="text-sm text-brand-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Tenant created with credits allocated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>6 AI journalists auto-provisioned (one per category)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Content sources configured for their location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-600 mt-1">•</span>
                    <span>Master cron will start generating articles immediately</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/tenants">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? 'Creating...' : 'Create Newspaper'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
