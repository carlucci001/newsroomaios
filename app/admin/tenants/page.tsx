'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, DEFAULT_PLANS } from '@/types/credits';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TenantWithCredits = Tenant & { credits?: TenantCredits };

function StatusBadge({ status, type }: { status: string; type: 'status' | 'license' }) {
  const statusStyles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    trial: 'bg-blue-100 text-blue-800 border-blue-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    provisioning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    seeding: 'bg-purple-100 text-purple-800 border-purple-200',
    past_due: 'bg-orange-100 text-orange-800 border-orange-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
        statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithCredits | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const db = getDb();

      // Fetch tenants
      const tenantsQuery = query(collection(db, 'tenants'), orderBy('createdAt', 'desc'));
      const tenantsSnap = await getDocs(tenantsQuery);
      const tenantsData = tenantsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tenant[];

      // Fetch credits
      const creditsSnap = await getDocs(collection(db, 'tenantCredits'));
      const creditsMap = new Map<string, TenantCredits>();
      creditsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Omit<TenantCredits, 'id'>;
        creditsMap.set(data.tenantId, { ...data, id: docSnap.id });
      });

      // Merge data
      const merged = tenantsData.map((tenant) => ({
        ...tenant,
        credits: creditsMap.get(tenant.id),
      }));

      setTenants(merged);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateTenantStatus(tenantId: string, status: string) {
    setActionLoading(true);
    try {
      const db = getDb();
      await updateDoc(doc(db, 'tenants', tenantId), { status });
      await fetchTenants();
      setSelectedTenant(null);
    } catch (error) {
      console.error('Failed to update tenant:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function updateLicenseStatus(tenantId: string, licensingStatus: string) {
    setActionLoading(true);
    try {
      const db = getDb();
      await updateDoc(doc(db, 'tenants', tenantId), { licensingStatus });
      await fetchTenants();
      setSelectedTenant(null);
    } catch (error) {
      console.error('Failed to update license:', error);
    } finally {
      setActionLoading(false);
    }
  }

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    trial: tenants.filter((t) => t.licensingStatus === 'trial').length,
    suspended: tenants.filter((t) => t.status === 'suspended').length,
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
          <p className="text-gray-500">Manage newspaper licenses and provisioning</p>
        </div>
        <Link href="/admin/tenants/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Newspaper
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">In Trial</p>
          <p className="text-2xl font-bold text-blue-600">{stats.trial}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Suspended</p>
          <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search by name, domain, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'provisioning', 'seeding', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Newspaper
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No tenants match your filters'
                      : 'No newspapers yet. Add one to get started.'}
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{tenant.businessName}</p>
                        <p className="text-sm text-gray-500">{tenant.domain}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{tenant.ownerEmail}</p>
                      <p className="text-sm text-gray-500">
                        {tenant.serviceArea.city}, {tenant.serviceArea.state}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tenant.status} type="status" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tenant.licensingStatus} type="license" />
                    </td>
                    <td className="px-6 py-4">
                      {tenant.credits ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tenant.credits.creditsRemaining.toLocaleString()} left
                          </p>
                          <p className="text-xs text-gray-500">
                            of {tenant.credits.monthlyAllocation.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/tenants/${tenant.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <button
                          onClick={() => setSelectedTenant(tenant)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage: {selectedTenant.businessName}
              </h3>
              <button
                onClick={() => setSelectedTenant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Actions */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {['active', 'suspended', 'provisioning'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedTenant.status === status ? 'default' : 'outline'}
                      size="sm"
                      disabled={actionLoading || selectedTenant.status === status}
                      onClick={() => updateTenantStatus(selectedTenant.id, status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* License Actions */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">License Status</p>
                <div className="flex flex-wrap gap-2">
                  {['trial', 'active', 'past_due', 'canceled'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedTenant.licensingStatus === status ? 'default' : 'outline'}
                      size="sm"
                      disabled={actionLoading || selectedTenant.licensingStatus === status}
                      onClick={() => updateLicenseStatus(selectedTenant.id, status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Link href={`/admin/tenants/${selectedTenant.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/admin/credits?tenant=${selectedTenant.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Manage Credits
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
