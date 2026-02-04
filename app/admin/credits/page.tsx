'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, query, where, orderBy, limit, runTransaction } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        const transactionsQuery = query(
          collection(db, 'creditTransactions'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const transactionsSnap = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          } as CreditTransaction;
        });
        setTransactions(transactionsData);
      } catch (e) {
        console.error('Error fetching transactions:', e);
        // Collection might not exist yet
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

  // Group transactions by tenant
  const transactionsByTenant = transactions.reduce((acc, t) => {
    if (!acc[t.tenantId]) acc[t.tenantId] = [];
    acc[t.tenantId].push(t);
    return acc;
  }, {} as Record<string, CreditTransaction[]>);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Credit Management</h2>
          <p className="text-gray-500">Monitor and manage tenant credit usage</p>
        </div>
        <Button
          onClick={() => setShowAdjustModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Adjust Credits
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Subscription Credits</p>
          <p className="text-2xl font-bold text-blue-600">{overview.totalSubscription.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Monthly allocation</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Top-Off Credits</p>
          <p className="text-2xl font-bold text-purple-600">{overview.totalTopOff.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Purchased credits</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Total Available</p>
          <p className="text-2xl font-bold text-green-600">{overview.totalCredits.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">All credits</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Low Credit Tenants</p>
          <p className={`text-2xl font-bold ${overview.tenantsLowCredits > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {overview.tenantsLowCredits}
          </p>
          <p className="text-xs text-gray-400 mt-1">Below 50 credits</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{overview.totalTransactions.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Recent activity</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Credit Balances */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Tenant Balances</h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {tenants.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No tenants yet
              </div>
            ) : (
              tenants
                .sort((a, b) => a.totalCredits - b.totalCredits)
                .map((tenant) => {
                  const status = tenant.totalCredits === 0 ? 'exhausted' : tenant.totalCredits < 50 ? 'warning' : 'active';
                  return (
                    <div key={tenant.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {tenant.businessName || tenant.id}
                          </p>
                          <div className="text-sm text-gray-500 space-y-0.5">
                            <div>Subscription: {tenant.subscriptionCredits.toLocaleString()}</div>
                            <div>Top-off: {tenant.topOffCredits.toLocaleString()}</div>
                            <div className="font-medium">Total: {tenant.totalCredits.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              status === 'exhausted'
                                ? 'bg-red-100 text-red-800'
                                : status === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {status}
                          </span>
                          {tenant.plan && (
                            <div className="text-xs text-gray-400 mt-1">{tenant.plan}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Usage by Feature */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Usage by Feature</h3>
          </div>
          <div className="p-6">
            {Object.keys(usageByFeature).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No usage data yet
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(usageByFeature)
                  .sort(([, a], [, b]) => b.credits - a.credits)
                  .map(([feature, data]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            feature === 'article'
                              ? 'bg-blue-500'
                              : feature === 'image' || feature === 'image_hd'
                              ? 'bg-purple-500'
                              : feature === 'tts'
                              ? 'bg-green-500'
                              : feature === 'agent'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }`}
                        ></div>
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
            )}

            {/* Credit Cost Reference */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Credit Costs</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(CREDIT_COSTS).map(([feature, cost]) => (
                  <div key={feature} className="flex justify-between text-gray-600">
                    <span>{feature.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{cost} {feature === 'tts' ? 'per 500 chars' : 'credits'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">{transactions.length} recent transactions</span>
        </div>
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
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          tx.type === 'usage' ? 'bg-red-100 text-red-800' :
                          tx.type === 'subscription' ? 'bg-green-100 text-green-800' :
                          tx.type === 'topoff' ? 'bg-purple-100 text-purple-800' :
                          tx.type === 'bonus' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {tx.creditPool || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium">
                        <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
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
      </div>

      {/* Adjust Credits Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Adjust Credits</h3>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedTenant('');
                  setAdjustAmount('');
                  setAdjustReason('');
                  setAdjustPool('topoff');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="tenant">Select Tenant</Label>
                <select
                  id="tenant"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="topoff">Top-Off Credits (never expire)</option>
                  <option value="subscription">Subscription Credits (expire monthly)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Top-off credits never expire; subscription credits reset monthly
                </p>
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedTenant || !adjustAmount || adjustLoading}
                  onClick={adjustCredits}
                >
                  {adjustLoading ? 'Processing...' : 'Apply Adjustment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
