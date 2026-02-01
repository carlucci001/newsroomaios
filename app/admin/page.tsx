'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { TenantCredits, CreditUsage } from '@/types/credits';
import Link from 'next/link';

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

function StatCard({
  label,
  value,
  subValue,
  trend,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function TenantStatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-green-100 text-green-800',
    trial: 'bg-blue-100 text-blue-800',
    suspended: 'bg-red-100 text-red-800',
    provisioning: 'bg-yellow-100 text-yellow-800',
    seeding: 'bg-purple-100 text-purple-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">
          Monitor your newspaper network and manage tenant resources.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Newspapers"
          value={stats.totalTenants}
          subValue={`${stats.activeTenants} active`}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          label="Trial Newspapers"
          value={stats.trialTenants}
          subValue="In trial period"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          label="Credits Used"
          value={stats.totalCreditsUsed.toLocaleString()}
          subValue="This billing cycle"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="green"
        />
        <StatCard
          label="Credit Warnings"
          value={stats.creditWarnings.length}
          subValue="Tenants at limit"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color={stats.creditWarnings.length > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tenants */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Newspapers</h3>
            <Link
              href="/admin/tenants"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          <div className="divide-y">
            {stats.recentTenants.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No newspapers yet. New signups will appear here.
              </div>
            ) : (
              stats.recentTenants.map((tenant) => (
                <div key={tenant.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{tenant.businessName}</p>
                    <p className="text-sm text-gray-500">{tenant.domain}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TenantStatusBadge status={tenant.status} />
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Credit Alerts */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Credit Alerts</h3>
            <Link
              href="/admin/credits"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Manage credits
            </Link>
          </div>
          <div className="divide-y">
            {stats.creditWarnings.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>All tenants have healthy credit balances.</p>
              </div>
            ) : (
              stats.creditWarnings.map((credit) => (
                <div key={credit.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Tenant {credit.tenantId}</p>
                      <p className="text-sm text-gray-500">
                        {credit.creditsRemaining} credits remaining
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        credit.status === 'exhausted'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {credit.status}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          credit.status === 'exhausted' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.max(
                            5,
                            (credit.creditsRemaining / credit.monthlyAllocation) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/tenants/new"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="p-2 bg-blue-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="ml-3 font-medium text-gray-900">Add Newspaper</span>
          </Link>
          <Link
            href="/admin/credits/add"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="p-2 bg-green-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="ml-3 font-medium text-gray-900">Add Credits</span>
          </Link>
          <Link
            href="/admin/updates"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="p-2 bg-purple-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <span className="ml-3 font-medium text-gray-900">Deploy Update</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="p-2 bg-gray-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="ml-3 font-medium text-gray-900">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}