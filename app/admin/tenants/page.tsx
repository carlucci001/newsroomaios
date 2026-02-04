'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, DEFAULT_PLANS } from '@/types/credits';
import Link from 'next/link';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, AlertTriangle, PauseCircle, Plus, MoreVertical, ExternalLink } from 'lucide-react';

type TenantWithCredits = Tenant & { credits?: TenantCredits };

function StatusBadge({ status, type }: { status: string; type: 'status' | 'license' }) {
  const statusMap = {
    status: {
      active: { variant: 'success' as const, label: 'Active' },
      trial: { variant: 'primary' as const, label: 'Trial' },
      suspended: { variant: 'danger' as const, label: 'Suspended' },
      provisioning: { variant: 'warning' as const, label: 'Provisioning' },
      seeding: { variant: 'warning' as const, label: 'Seeding' },
      past_due: { variant: 'danger' as const, label: 'Past Due' },
      canceled: { variant: 'default' as const, label: 'Canceled' },
    },
    license: {
      active: { variant: 'success' as const, label: 'Active' },
      trial: { variant: 'primary' as const, label: 'Trial' },
      suspended: { variant: 'danger' as const, label: 'Suspended' },
      provisioning: { variant: 'warning' as const, label: 'Provisioning' },
      seeding: { variant: 'warning' as const, label: 'Seeding' },
      past_due: { variant: 'danger' as const, label: 'Past Due' },
      canceled: { variant: 'default' as const, label: 'Canceled' },
    },
  };

  const config = statusMap[type][status as keyof typeof statusMap[typeof type]] || { variant: 'default' as const, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Tenant Management"
        subtitle="Manage newspaper licenses and provisioning"
        action={
          <Link href="/admin/tenants/new">
            <Button variant="primary">
              <Plus className="w-4 h-4" />
              Add Newspaper
            </Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Newspapers"
          value={stats.total}
          icon={<Building2 className="w-6 h-6" />}
          color="brand"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
        />
        <StatCard
          label="In Trial"
          value={stats.trial}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          label="Suspended"
          value={stats.suspended}
          icon={<PauseCircle className="w-6 h-6" />}
          color="danger"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Newspapers</CardTitle>
          <CardDescription>{filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTenant(tenant)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Tenant</CardTitle>
                  <CardDescription>{selectedTenant.businessName}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTenant(null)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Actions */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {['active', 'suspended', 'provisioning'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedTenant.status === status ? 'primary' : 'outline'}
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
                      variant={selectedTenant.licensingStatus === status ? 'primary' : 'outline'}
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
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
