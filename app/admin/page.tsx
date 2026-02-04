'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, CreditUsage } from '@/types/credits';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import {
  Building2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  Coins,
  Upload,
  Settings as SettingsIcon,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalCreditsUsed: number;
  totalRevenue: number;
  recentTenants: Tenant[];
  creditWarnings: TenantCredits[];
  recentUsage: CreditUsage[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const db = getDb();

        // Fetch tenants
        const tenantsSnap = await getDocs(collection(db, 'tenants'));
        const tenants = tenantsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Tenant[];

        // Calculate tenant stats
        const activeTenants = tenants.filter((t) => t.status === 'active').length;
        const trialTenants = tenants.filter((t) => t.licensingStatus === 'trial').length;
        const suspendedTenants = tenants.filter((t) => t.status === 'suspended').length;

        // Get recent tenants (last 5)
        const recentTenants = tenants
          .sort((a, b) => {
            const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any);
            const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any);
            return bDate.getTime() - aDate.getTime();
          })
          .slice(0, 5);

        // Fetch credit data
        const creditsSnap = await getDocs(collection(db, 'tenantCredits'));
        const credits = creditsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TenantCredits[];

        // Find tenants with credit warnings
        const creditWarnings = credits.filter(
          (c) => c.status === 'warning' || c.status === 'exhausted'
        );

        // Calculate total credits used
        const totalCreditsUsed = credits.reduce((sum, c) => sum + (c.creditsUsed || 0), 0);

        // Fetch recent usage (last 10)
        let recentUsage: CreditUsage[] = [];
        try {
          const usageQuery = query(
            collection(db, 'creditUsage'),
            orderBy('timestamp', 'desc'),
            limit(10)
          );
          const usageSnap = await getDocs(usageQuery);
          recentUsage = usageSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as CreditUsage[];
        } catch (e) {
          // Collection might not exist yet
        }

        setStats({
          totalTenants: tenants.length,
          activeTenants,
          trialTenants,
          suspendedTenants,
          totalCreditsUsed,
          totalRevenue: 0, // TODO: Calculate from Stripe
          recentTenants,
          creditWarnings,
          recentUsage,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Monitor your newspaper network and manage tenant resources"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Newspapers"
          value={stats.totalTenants}
          subValue={`${stats.activeTenants} active`}
          icon={<Building2 className="w-6 h-6" />}
          color="brand"
        >
          <ProgressBar
            value={stats.activeTenants}
            max={stats.totalTenants}
            color="brand"
            className="mt-3"
          />
        </StatCard>

        <StatCard
          label="Trial Period"
          value={stats.trialTenants}
          subValue="in trial"
          icon={<Clock className="w-6 h-6" />}
          color="warning"
        />

        <StatCard
          label="Credits Used"
          value={stats.totalCreditsUsed.toLocaleString()}
          subValue="this billing cycle"
          icon={<TrendingUp className="w-6 h-6" />}
          color="success"
        />

        <StatCard
          label="Credit Warnings"
          value={stats.creditWarnings.length}
          subValue="tenants at limit"
          icon={<AlertTriangle className="w-6 h-6" />}
          color={stats.creditWarnings.length > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Newspapers</CardTitle>
                <CardDescription>Latest tenant sign-ups</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/tenants">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentTenants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No newspapers yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentTenants.map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/admin/tenants/${tenant.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {tenant.businessName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {tenant.domain}
                      </p>
                    </div>
                    <Badge
                      variant={
                        tenant.status === 'active' ? 'success' :
                        tenant.status === 'seeding' ? 'warning' :
                        tenant.status === 'suspended' ? 'danger' :
                        'default'
                      }
                      dot
                    >
                      {tenant.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Credit Alerts</CardTitle>
                <CardDescription>Tenants requiring attention</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/credits">
                  Manage
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.creditWarnings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-success-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  All tenants have healthy credit balances
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.creditWarnings.map((credit) => (
                  <div key={credit.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">
                        Tenant {credit.tenantId}
                      </p>
                      <Badge
                        variant={credit.status === 'exhausted' ? 'danger' : 'warning'}
                      >
                        {credit.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {credit.creditsRemaining} credits remaining
                    </p>
                    <ProgressBar
                      value={credit.creditsRemaining}
                      max={credit.monthlyAllocation}
                      color={credit.status === 'exhausted' ? 'danger' : 'warning'}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/tenants/new"
              className="flex flex-col items-center gap-2 p-4 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors group"
            >
              <div className="p-2 bg-brand-500 rounded-lg group-hover:bg-brand-600 transition-colors">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">Add Newspaper</span>
            </Link>

            <Link
              href="/admin/credits"
              className="flex flex-col items-center gap-2 p-4 bg-success-50 rounded-lg hover:bg-success-100 transition-colors group"
            >
              <div className="p-2 bg-success-500 rounded-lg group-hover:bg-success-600 transition-colors">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">Manage Credits</span>
            </Link>

            <Link
              href="/admin/updates"
              className="flex flex-col items-center gap-2 p-4 bg-warning-50 rounded-lg hover:bg-warning-100 transition-colors group"
            >
              <div className="p-2 bg-warning-500 rounded-lg group-hover:bg-warning-600 transition-colors">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">Deploy Update</span>
            </Link>

            <Link
              href="/admin/settings"
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="p-2 bg-gray-500 rounded-lg group-hover:bg-gray-600 transition-colors">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">Settings</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
