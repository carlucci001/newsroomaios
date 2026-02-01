'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, CreditUsage, CreditTransaction, DEFAULT_PLANS, CREDIT_COSTS } from '@/types/credits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreditOverview {
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  tenantsAtLimit: number;
  tenantsWarning: number;
}

function CreditBar({ used, allocated, showLabels = true }: { used: number; allocated: number; showLabels?: boolean }) {
  const percentage = allocated > 0 ? Math.min(100, (used / allocated) * 100) : 0;
  const colorClass = percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-1">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{used.toLocaleString()} used</span>
          <span>{(allocated - used).toLocaleString()} remaining</span>
        </div>
      )}
    </div>
  );
}

export default function CreditsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [credits, setCredits] = useState<TenantCredits[]>([]);
  const [usage, setUsage] = useState<CreditUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const db = getDb();

      // Fetch tenants
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const tenantsData = tenantsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tenant[];
      setTenants(tenantsData);

      // Fetch credits
      const creditsSnap = await getDocs(collection(db, 'tenantCredits'));
      const creditsData = creditsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TenantCredits[];
      setCredits(creditsData);

      // Fetch recent usage
      try {
        const usageQuery = query(
          collection(db, 'creditUsage'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
        const usageSnap = await getDocs(usageQuery);
        const usageData = usageSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CreditUsage[];
        setUsage(usageData);
      } catch (e) {
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
      const tenantCredit = credits.find((c) => c.tenantId === selectedTenant);

      if (tenantCredit) {
        const newRemaining = tenantCredit.creditsRemaining + amount;

        // Update credit balance
        await updateDoc(doc(db, 'tenantCredits', tenantCredit.id), {
          creditsRemaining: newRemaining,
          status: newRemaining <= 0 ? 'exhausted' : newRemaining < tenantCredit.softLimit ? 'warning' : 'active',
        });

        // Log transaction
        await addDoc(collection(db, 'creditTransactions'), {
          tenantId: selectedTenant,
          type: 'adjustment',
          amount,
          balance: newRemaining,
          description: adjustReason || 'Manual credit adjustment',
          createdAt: new Date(),
        });

        await fetchData();
        setShowAdjustModal(false);
        setAdjustAmount('');
        setAdjustReason('');
        setSelectedTenant('');
      }
    } catch (error) {
      console.error('Failed to adjust credits:', error);
    } finally {
      setAdjustLoading(false);
    }
  }

  // Calculate overview stats
  const overview: CreditOverview = {
    totalAllocated: credits.reduce((sum, c) => sum + c.monthlyAllocation, 0),
    totalUsed: credits.reduce((sum, c) => sum + c.creditsUsed, 0),
    totalRemaining: credits.reduce((sum, c) => sum + c.creditsRemaining, 0),
    tenantsAtLimit: credits.filter((c) => c.status === 'exhausted').length,
    tenantsWarning: credits.filter((c) => c.status === 'warning').length,
  };

  // Group usage by tenant
  const usageByTenant = usage.reduce((acc, u) => {
    if (!acc[u.tenantId]) acc[u.tenantId] = [];
    acc[u.tenantId].push(u);
    return acc;
  }, {} as Record<string, CreditUsage[]>);

  // Group usage by action type
  const usageByAction = usage.reduce((acc, u) => {
    if (!acc[u.action]) acc[u.action] = { count: 0, credits: 0 };
    acc[u.action].count++;
    acc[u.action].credits += u.creditsUsed;
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
          <p className="text-sm text-gray-500 mb-1">Total Allocated</p>
          <p className="text-2xl font-bold text-gray-900">{overview.totalAllocated.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">This billing cycle</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Total Used</p>
          <p className="text-2xl font-bold text-blue-600">{overview.totalUsed.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">
            {overview.totalAllocated > 0
              ? `${((overview.totalUsed / overview.totalAllocated) * 100).toFixed(1)}% of allocation`
              : 'No allocations'}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Total Remaining</p>
          <p className="text-2xl font-bold text-green-600">{overview.totalRemaining.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Available credits</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">At Limit</p>
          <p className={`text-2xl font-bold ${overview.tenantsAtLimit > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {overview.tenantsAtLimit}
          </p>
          <p className="text-xs text-gray-400 mt-1">Tenants exhausted</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Warnings</p>
          <p className={`text-2xl font-bold ${overview.tenantsWarning > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
            {overview.tenantsWarning}
          </p>
          <p className="text-xs text-gray-400 mt-1">Approaching limit</p>
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
            {credits.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No credit allocations yet
              </div>
            ) : (
              credits
                .sort((a, b) => (a.creditsRemaining / a.monthlyAllocation) - (b.creditsRemaining / b.monthlyAllocation))
                .map((credit) => {
                  const tenant = tenants.find((t) => t.id === credit.tenantId);
                  return (
                    <div key={credit.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {tenant?.businessName || credit.tenantId}
                          </p>
                          <p className="text-sm text-gray-500">
                            {credit.creditsRemaining.toLocaleString()} / {credit.monthlyAllocation.toLocaleString()} credits
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            credit.status === 'exhausted'
                              ? 'bg-red-100 text-red-800'
                              : credit.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {credit.status}
                        </span>
                      </div>
                      <CreditBar used={credit.creditsUsed} allocated={credit.monthlyAllocation} showLabels={false} />
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Usage by Action Type */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Usage by Feature</h3>
          </div>
          <div className="p-6">
            {Object.keys(usageByAction).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No usage data yet
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(usageByAction)
                  .sort(([, a], [, b]) => b.credits - a.credits)
                  .map(([action, data]) => (
                    <div key={action} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            action === 'article_generation'
                              ? 'bg-blue-500'
                              : action === 'image_generation'
                              ? 'bg-purple-500'
                              : action === 'fact_check'
                              ? 'bg-green-500'
                              : action === 'seo_optimization'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
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
                {Object.entries(CREDIT_COSTS).map(([action, cost]) => (
                  <div key={action} className="flex justify-between text-gray-600">
                    <span>{action.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{cost} credits</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Usage Log */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">{usage.length} recent transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Action
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
              {usage.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No activity recorded yet
                  </td>
                </tr>
              ) : (
                usage.slice(0, 20).map((u) => {
                  const tenant = tenants.find((t) => t.id === u.tenantId);
                  const timestamp = u.timestamp instanceof Date ? u.timestamp : new Date((u.timestamp as any)?.seconds * 1000 || Date.now());
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {tenant?.businessName || u.tenantId}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-gray-600">
                          {u.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {u.description}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                        -{u.creditsUsed}
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
                      {tenant.businessName}
                    </option>
                  ))}
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
