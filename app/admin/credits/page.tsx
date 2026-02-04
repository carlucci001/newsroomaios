'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, runTransaction } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, TriangleAlert, Plus, Activity } from 'lucide-react';

// Credit costs for display (from the new system)
const CREDIT_COSTS = {
  article: 5,
  image: 2,
  image_hd: 4,
  tts: 1,
  agent: 3,
  ad_creation: 5,
  ad_manual: 1,
};

interface TenantWithCredits extends Tenant {
  subscriptionCredits: number;
  topOffCredits: number;
  totalCredits: number;
}

interface CreditTransaction {
  id: string;
  tenantId: string;
  type: string;
  creditPool?: string;
  feature?: string;
  amount: number;
  subscriptionBalance?: number;
  topOffBalance?: number;
  description: string;
  createdAt: Date | any;
}

interface CreditOverview {
  totalSubscription: number;
  totalTopOff: number;
  totalCredits: number;
  tenantsLowCredits: number;
  totalTransactions: number;
}

export default function CreditsPage() {
  const [tenants, setTenants] = useState<TenantWithCredits[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustPool, setAdjustPool] = useState<'subscription' | 'topoff'>('topoff');
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const db = getDb();

      // Fetch tenants with credit balances
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const tenantsData = tenantsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        const subscriptionCredits = data.subscriptionCredits || 0;
        const topOffCredits = data.topOffCredits || 0;
        return {
          id: docSnap.id,
          ...data,
          subscriptionCredits,
          topOffCredits,
          totalCredits: subscriptionCredits + topOffCredits,
        } as TenantWithCredits;
      });
      setTenants(tenantsData);

      // Fetch recent credit transactions
      try {
        const transactionsSnap = await getDocs(collection(db, 'creditTransactions'));
        const transactionsData = transactionsSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          } as CreditTransaction;
        });
        setTransactions(transactionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 100));
      } catch (e) {
        console.error('Error fetching transactions:', e);
      }
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function adjustCredits() {
    if (!selectedTenant || !adjustAmount) return;

    setAdjustLoading(true);
    try {
      const db = getDb();
      const amount = parseInt(adjustAmount);
      const tenant = tenants.find((t) => t.id === selectedTenant);

      if (!tenant) {
        alert('Tenant not found');
        return;
      }

      const tenantRef = doc(db, 'tenants', selectedTenant);

      // Use Firestore transaction for atomic update
      await runTransaction(db, async (transaction) => {
        const tenantSnap = await transaction.get(tenantRef);

        if (!tenantSnap.exists()) {
          throw new Error('Tenant not found');
        }

        const data = tenantSnap.data();
        let subscriptionCredits = data.subscriptionCredits || 0;
        let topOffCredits = data.topOffCredits || 0;

        // Update the selected pool
        if (adjustPool === 'subscription') {
          subscriptionCredits = Math.max(0, subscriptionCredits + amount);
        } else {
          topOffCredits = Math.max(0, topOffCredits + amount);
        }

        // Update tenant document
        transaction.update(tenantRef, {
          subscriptionCredits,
          topOffCredits,
          updatedAt: new Date(),
        });

        // Create transaction record
        const transactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(transactionRef, {
          tenantId: selectedTenant,
          type: 'adjustment',
          creditPool: adjustPool,
          amount,
          subscriptionBalance: subscriptionCredits,
          topOffBalance: topOffCredits,
          description: adjustReason || `Manual ${adjustPool} credit adjustment`,
          createdAt: new Date(),
        });
      });

      await fetchData();
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustPool('topoff');
      setSelectedTenant('');
    } catch (error) {
      console.error('Failed to adjust credits:', error);
      alert('Failed to adjust credits: ' + (error as Error).message);
    } finally {
      setAdjustLoading(false);
    }
  }

  // Calculate overview stats
  const overview: CreditOverview = {
    totalSubscription: tenants.reduce((sum, t) => sum + t.subscriptionCredits, 0),
    totalTopOff: tenants.reduce((sum, t) => sum + t.topOffCredits, 0),
    totalCredits: tenants.reduce((sum, t) => sum + t.totalCredits, 0),
    tenantsLowCredits: tenants.filter((t) => t.totalCredits < 50).length,
    totalTransactions: transactions.length,
  };

  // Group usage by feature type
  const usageByFeature = transactions
    .filter((t) => t.type === 'usage' && t.feature)
    .reduce((acc, t) => {
      const feature = t.feature || 'unknown';
      if (!acc[feature]) acc[feature] = { count: 0, credits: 0 };
      acc[feature].count++;
      acc[feature].credits += Math.abs(t.amount);
      return acc;
    }, {} as Record<string, { count: number; credits: number }>);

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
        title="Credit Management"
        subtitle="Monitor and manage tenant credit usage"
        action={
          <Button variant="primary" onClick={() => setShowAdjustModal(true)}>
            <Plus className="w-4 h-4" />
            Adjust Credits
          </Button>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          label="Subscription Credits"
          value={overview.totalSubscription.toLocaleString()}
          subValue="monthly allocation"
          icon={<Coins className="w-6 h-6" />}
          color="brand"
        />

        <StatCard
          label="Top-Off Credits"
          value={overview.totalTopOff.toLocaleString()}
          subValue="purchased credits"
          icon={<TrendingUp className="w-6 h-6" />}
          color="success"
        />

        <StatCard
          label="Total Available"
          value={overview.totalCredits.toLocaleString()}
          subValue="all credits"
          icon={<Coins className="w-6 h-6" />}
          color="gray"
        />

        <StatCard
          label="Low Credit Tenants"
          value={overview.tenantsLowCredits}
          subValue="below 50 credits"
          icon={<TriangleAlert className="w-6 h-6" />}
          color={overview.tenantsLowCredits > 0 ? 'danger' : 'success'}
        />

        <StatCard
          label="Transactions"
          value={overview.totalTransactions.toLocaleString()}
          subValue="recent activity"
          icon={<Activity className="w-6 h-6" />}
          color="gray"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Credit Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Balances</CardTitle>
            <CardDescription>Credit status across all newspapers</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {tenants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No tenants yet
              </div>
            ) : (
              <div className="space-y-3">
                {tenants
                  .sort((a, b) => a.totalCredits - b.totalCredits)
                  .map((tenant) => {
                    const status = tenant.totalCredits === 0 ? 'exhausted' : tenant.totalCredits < 50 ? 'warning' : 'active';
                    return (
                      <div key={tenant.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {tenant.businessName || tenant.id}
                            </p>
                            <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                              <div>Subscription: {tenant.subscriptionCredits.toLocaleString()}</div>
                              <div>Top-off: {tenant.topOffCredits.toLocaleString()}</div>
                              <div className="font-medium">Total: {tenant.totalCredits.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <Badge
                              variant={
                                status === 'exhausted' ? 'danger' :
                                status === 'warning' ? 'warning' :
                                'success'
                              }
                            >
                              {status}
                            </Badge>
                            {tenant.plan && (
                              <div className="text-xs text-gray-400 mt-1 capitalize">{tenant.plan}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage by Feature */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Feature</CardTitle>
            <CardDescription>Credit consumption breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(usageByFeature).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No usage data yet
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {Object.entries(usageByFeature)
                    .sort(([, a], [, b]) => b.credits - a.credits)
                    .map(([feature, data]) => (
                      <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              feature === 'article'
                                ? 'bg-brand-500'
                                : feature === 'image' || feature === 'image_hd'
                                ? 'bg-success-500'
                                : feature === 'tts'
                                ? 'bg-warning-500'
                                : feature === 'agent'
                                ? 'bg-danger-500'
                                : 'bg-gray-500'
                            }`}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-500">{data.count} operations</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{data.credits.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">credits</p>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Credit Cost Reference */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Credit Costs</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(CREDIT_COSTS).map(([feature, cost]) => (
                      <div key={feature} className="flex justify-between text-gray-600">
                        <span>{feature.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{cost} credits</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>{transactions.length} recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Pool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No activity recorded yet
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 20).map((tx) => {
                    const tenant = tenants.find((t) => t.id === tx.tenantId);
                    const timestamp = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt?.seconds * 1000 || Date.now());
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {tenant?.businessName || tx.tenantId}
                        </td>
                        <td className="px-6 py-3">
                          <Badge
                            variant={
                              tx.type === 'usage' ? 'danger' :
                              tx.type === 'subscription' ? 'success' :
                              tx.type === 'topoff' ? 'primary' :
                              tx.type === 'bonus' ? 'warning' :
                              'default'
                            }
                          >
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {tx.creditPool || '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td className="px-6 py-3 text-sm text-right font-medium">
                          <span className={tx.amount > 0 ? 'text-success-600' : 'text-danger-600'}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-gray-500">
                          {timestamp.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Adjust Credits Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Adjust Credits</CardTitle>
              <CardDescription>Add or deduct credits from a tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tenant">Select Tenant</Label>
                <select
                  id="tenant"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Choose a tenant...</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.businessName} ({tenant.totalCredits} total credits)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="pool">Credit Pool</Label>
                <select
                  id="pool"
                  value={adjustPool}
                  onChange={(e) => setAdjustPool(e.target.value as 'subscription' | 'topoff')}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="topoff">Top-Off Credits (never expire)</option>
                  <option value="subscription">Subscription Credits (expire monthly)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="amount">Credit Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount (positive to add, negative to deduct)"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to add credits, negative to deduct
                </p>
              </div>

              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Bonus for promotional period"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setSelectedTenant('');
                    setAdjustAmount('');
                    setAdjustReason('');
                    setAdjustPool('topoff');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!selectedTenant || !adjustAmount || adjustLoading}
                  onClick={adjustCredits}
                >
                  {adjustLoading ? 'Processing...' : 'Apply Adjustment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
