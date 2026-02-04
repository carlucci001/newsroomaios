'use client';

import { use Effect, useState } from 'react';
import Link from 'next/link';
import { getDb } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getCurrentUser, getUserTenant } from '@/src/lib/accountAuth';
import { PageContainer } from '@/src/components/layouts/PageContainer';
import { PageHeader } from '@/src/components/layouts/PageHeader';
import { StatCard } from '@/src/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { ProgressBar } from '@/src/components/ui/progress-bar';
import {
  CreditCard,
  FileText,
  CheckCircle,
  Plus,
  ArrowUpRight,
  MessageSquare,
  Settings,
  TrendingUp,
} from 'lucide-react';

export default function AccountDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        setUser(currentUser);

        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">No tenant found for your account.</p>
        </div>
      </PageContainer>
    );
  }

  const subscriptionCredits = tenant.subscriptionCredits || 0;
  const topOffCredits = tenant.topOffCredits || 0;
  const totalCredits = subscriptionCredits + topOffCredits;
  const monthlyAllocation = tenant.plan === 'professional' ? 1000 :
                            tenant.plan === 'growth' ? 575 : 250;

  const isActive = tenant.status === 'active' || tenant.status === 'seeding';
  const nextBillingDate = tenant.nextBillingDate
    ? new Date(tenant.nextBillingDate.seconds * 1000).toLocaleDateString()
    : 'N/A';

  return (
    <PageContainer maxWidth="2xl">
      {/* Welcome Header */}
      <PageHeader
        title={`Welcome back, ${user?.email?.split('@')[0] || 'User'}`}
        subtitle={`${tenant.businessName} • ${tenant.plan || 'Starter'} Plan`}
        action={
          <Button variant="primary" asChild>
            <Link
              href={`https://${tenant.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              View Your Newspaper
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Credits Remaining"
          value={totalCredits.toLocaleString()}
          subValue={`of ${monthlyAllocation} monthly`}
          icon={<CreditCard className="w-6 h-6" />}
          color="brand"
          trend={{ value: -12, label: 'vs last month' }}
        >
          <ProgressBar
            value={subscriptionCredits}
            max={monthlyAllocation}
            color="brand"
            className="mt-3"
          />
          {topOffCredits > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              + {topOffCredits} top-off credits
            </p>
          )}
        </StatCard>

        <StatCard
          label="Articles This Month"
          value="28"
          subValue="this billing cycle"
          icon={<FileText className="w-6 h-6" />}
          color="success"
          trend={{ value: +8, label: 'vs last month' }}
        />

        <StatCard
          label="Subscription Status"
          value={
            <Badge variant={isActive ? 'success' : 'warning'} dot>
              {isActive ? 'Active' : tenant.status}
            </Badge>
          }
          subValue={`Renews ${nextBillingDate}`}
          icon={<CheckCircle className="w-6 h-6" />}
          color={isActive ? 'success' : 'warning'}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/account/credits/purchase"
                className="flex flex-col items-center gap-2 p-4 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors group"
              >
                <div className="p-2 bg-brand-500 rounded-lg group-hover:bg-brand-600 transition-colors">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">Buy Credits</span>
              </Link>

              <Link
                href="/account/billing"
                className="flex flex-col items-center gap-2 p-4 bg-success-50 rounded-lg hover:bg-success-100 transition-colors group"
              >
                <div className="p-2 bg-success-500 rounded-lg group-hover:bg-success-600 transition-colors">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">Upgrade Plan</span>
              </Link>

              <Link
                href="/account/messages"
                className="flex flex-col items-center gap-2 p-4 bg-info-50 rounded-lg hover:bg-info-100 transition-colors group"
              >
                <div className="p-2 bg-info-500 rounded-lg group-hover:bg-info-600 transition-colors">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">Contact Support</span>
              </Link>

              <Link
                href="/account/settings"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="p-2 bg-gray-500 rounded-lg group-hover:bg-gray-600 transition-colors">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">Settings</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
            <p className="text-brand-100 text-sm font-medium mb-1">Current Plan</p>
            <h3 className="text-2xl font-bold mb-1 capitalize">
              {tenant.plan || 'Starter'}
            </h3>
            <p className="text-brand-50">
              {monthlyAllocation} credits/month
            </p>
          </div>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Monthly Price</span>
                <span className="font-semibold text-gray-900">
                  ${tenant.plan === 'professional' ? '299' :
                    tenant.plan === 'growth' ? '199' : '99'}/mo
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Next Billing</span>
                <span className="font-semibold text-gray-900">{nextBillingDate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge variant={isActive ? 'success' : 'warning'}>
                  {isActive ? 'Active' : tenant.status}
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/account/billing">View Details</Link>
            </Button>
            <Button variant="primary" size="sm" className="flex-1" asChild>
              <Link href="/account/billing#change-plan">Upgrade</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Getting Started / Tips (if new user) */}
      {tenant.status === 'seeding' && (
        <Card className="bg-info-50 border-info-200">
          <CardHeader>
            <CardTitle className="text-info-900">Your newspaper is being set up!</CardTitle>
            <CardDescription className="text-info-700">
              We're generating your initial articles and setting up your categories.
              This usually takes 5-10 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar value={66} max={100} color="info" showLabel label="Setup Progress" />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
