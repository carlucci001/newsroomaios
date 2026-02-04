'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, CreditUsage, CreditTransaction, DEFAULT_PLANS } from '@/types/credits';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import Link from 'next/link';
import {
  ArrowLeft,
  Coins,
  TrendingUp,
  Activity,
  MapPin,
  Mail,
  Globe,
  Calendar,
  Layers,
} from 'lucide-react';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [credits, setCredits] = useState<TenantCredits | null>(null);
  const [usage, setUsage] = useState<CreditUsage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'settings'>('overview');

  // Edit form state
  const [editForm, setEditForm] = useState({
    businessName: '',
    domain: '',
    ownerEmail: '',
    status: '',
    licensingStatus: '',
    softLimit: 0,
    hardLimit: 0,
  });

  useEffect(() => {
    fetchTenantData();
  }, [tenantId]);

  async function fetchTenantData() {
    try {
      const db = getDb();

      // First fetch tenant to check if it exists
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (!tenantDoc.exists()) {
        router.push('/admin/tenants');
        return;
      }

      const tenantData = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
      setTenant(tenantData);
      setEditForm({
        businessName: tenantData.businessName,
        domain: tenantData.domain,
        ownerEmail: tenantData.ownerEmail,
        status: tenantData.status,
        licensingStatus: tenantData.licensingStatus,
        softLimit: 0,
        hardLimit: 0,
      });

      // Fetch credits, usage, and transactions in parallel for faster loading
      const creditsQuery = query(collection(db, 'tenantCredits'), where('tenantId', '==', tenantId));
      const usageQuery = query(
        collection(db, 'creditUsage'),
        where('tenantId', '==', tenantId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const txQuery = query(
        collection(db, 'creditTransactions'),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const [creditsSnap, usageSnap, txSnap] = await Promise.all([
        getDocs(creditsQuery),
        getDocs(usageQuery).catch(() => null), // Collection might not exist
        getDocs(txQuery).catch(() => null),    // Collection might not exist
      ]);

      // Process credits
      if (!creditsSnap.empty) {
        const creditData = { id: creditsSnap.docs[0].id, ...creditsSnap.docs[0].data() } as TenantCredits;
        setCredits(creditData);
        setEditForm((prev) => ({
          ...prev,
          softLimit: creditData.softLimit,
          hardLimit: creditData.hardLimit,
        }));
      }

      // Process usage
      if (usageSnap) {
        setUsage(usageSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as CreditUsage[]);
      }

      // Process transactions
      if (txSnap) {
        setTransactions(txSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as CreditTransaction[]);
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTenant() {
    if (!tenant) return;

    setSaving(true);
    try {
      const db = getDb();

      // Update tenant
      await updateDoc(doc(db, 'tenants', tenantId), {
        businessName: editForm.businessName,
        domain: editForm.domain,
        ownerEmail: editForm.ownerEmail,
        status: editForm.status,
        licensingStatus: editForm.licensingStatus,
      });

      // Update credit limits if credits exist
      if (credits) {
        await updateDoc(doc(db, 'tenantCredits', credits.id), {
          softLimit: editForm.softLimit,
          hardLimit: editForm.hardLimit,
        });
      }

      await fetchTenantData();
    } catch (error) {
      console.error('Failed to save tenant:', error);
    } finally {
      setSaving(false);
    }
  }

  async function allocateCredits() {
    if (!tenant) return;

    const plan = DEFAULT_PLANS.find((p) => p.id === 'starter') || DEFAULT_PLANS[0];
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
      const db = getDb();
      await addDoc(collection(db, 'tenantCredits'), {
        tenantId,
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

      await fetchTenantData();
    } catch (error) {
      console.error('Failed to allocate credits:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={tenant.businessName}
        subtitle={tenant.domain}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/tenants">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <Badge
              variant={
                tenant.status === 'active' ? 'success' :
                tenant.status === 'suspended' ? 'danger' :
                'warning'
              }
            >
              {tenant.status}
            </Badge>
            <Badge
              variant={
                tenant.licensingStatus === 'active' ? 'success' :
                tenant.licensingStatus === 'trial' ? 'warning' :
                'default'
              }
            >
              {tenant.licensingStatus}
            </Badge>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'credits', label: 'Credits & Usage' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Newspaper Information</CardTitle>
                <CardDescription>Basic details and configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Owner Email</p>
                      <p className="text-sm font-medium text-gray-900">{tenant.ownerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Domain</p>
                      <p className="text-sm font-medium text-gray-900">{tenant.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Service Area</p>
                      <p className="text-sm font-medium text-gray-900">
                        {tenant.serviceArea.city}, {tenant.serviceArea.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Categories</p>
                      <p className="text-sm font-medium text-gray-900">
                        {tenant.categories?.length || 0} configured
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-sm font-medium text-gray-900">
                        {tenant.createdAt instanceof Date
                          ? tenant.createdAt.toLocaleDateString()
                          : new Date((tenant.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credits Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Credit Balance</CardTitle>
                <CardDescription>Current allocation</CardDescription>
              </CardHeader>
              <CardContent>
                {credits ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900">
                        {credits.creditsRemaining.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">credits remaining</p>
                    </div>
                    <ProgressBar
                      value={credits.creditsRemaining}
                      max={credits.monthlyAllocation}
                      color={
                        credits.status === 'exhausted' ? 'danger' :
                        credits.status === 'warning' ? 'warning' :
                        'success'
                      }
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{credits.creditsUsed.toLocaleString()} used</span>
                      <span>{credits.monthlyAllocation.toLocaleString()} total</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No credits allocated</p>
                    <Button onClick={allocateCredits} size="sm" variant="primary">
                      Allocate Credits
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'credits' && (
        <div className="space-y-6">
          {/* Credit Stats */}
          {credits && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Allocated"
                value={credits.monthlyAllocation.toLocaleString()}
                icon={<Coins className="w-6 h-6" />}
                color="brand"
              />
              <StatCard
                label="Used"
                value={credits.creditsUsed.toLocaleString()}
                icon={<TrendingUp className="w-6 h-6" />}
                color="warning"
              />
              <StatCard
                label="Remaining"
                value={credits.creditsRemaining.toLocaleString()}
                icon={<Coins className="w-6 h-6" />}
                color="success"
              />
              <StatCard
                label="Overage"
                value={credits.overageCredits.toLocaleString()}
                icon={<Activity className="w-6 h-6" />}
                color={credits.overageCredits > 0 ? 'danger' : 'gray'}
              />
            </div>
          )}

          {/* Recent Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Usage</CardTitle>
              <CardDescription>Credit consumption activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {usage.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">No usage recorded</div>
                ) : (
                  usage.map((u) => (
                    <div key={u.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{u.action.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-500 truncate max-w-md">{u.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">-{u.creditsUsed}</p>
                        <p className="text-xs text-gray-500">
                          {u.timestamp instanceof Date
                            ? u.timestamp.toLocaleString()
                            : new Date((u.timestamp as any)?.seconds * 1000 || Date.now()).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant Settings</CardTitle>
            <CardDescription>Update tenant configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={editForm.domain}
                  onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ownerEmail">Owner Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={editForm.ownerEmail}
                  onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="active">Active</option>
                  <option value="provisioning">Provisioning</option>
                  <option value="seeding">Seeding</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <Label htmlFor="licensingStatus">License Status</Label>
                <select
                  id="licensingStatus"
                  value={editForm.licensingStatus}
                  onChange={(e) => setEditForm({ ...editForm, licensingStatus: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            </div>

            {credits && (
              <div className="pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-4">Credit Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="softLimit">Soft Limit (Warning)</Label>
                    <Input
                      id="softLimit"
                      type="number"
                      value={editForm.softLimit}
                      onChange={(e) => setEditForm({ ...editForm, softLimit: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Send warning when this usage is reached</p>
                  </div>
                  <div>
                    <Label htmlFor="hardLimit">Hard Limit (Stop)</Label>
                    <Input
                      id="hardLimit"
                      type="number"
                      value={editForm.hardLimit}
                      onChange={(e) => setEditForm({ ...editForm, hardLimit: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Stop AI operations at this limit (0 = no limit)</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.push('/admin/tenants')}>
                Cancel
              </Button>
              <Button onClick={saveTenant} disabled={saving} variant="primary">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
