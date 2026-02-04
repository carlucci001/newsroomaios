'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Coins, TrendingDown, Infinity, Plus, ArrowUpRight } from 'lucide-react';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

interface CreditTransaction {
  id: string;
  type: string;
  feature?: string;
  amount: number;
  subscriptionBalance?: number;
  topOffBalance?: number;
  description: string;
  createdAt: any;
}

export default function CreditsPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);

        // Fetch credit transactions for this tenant
        if (userTenant?.id) {
          const db = getDb();
          const transactionsQuery = query(
            collection(db, 'creditTransactions'),
            where('tenantId', '==', userTenant.id),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
          const transactionsSnap = await getDocs(transactionsQuery);
          const transactionsData = transactionsSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            } as CreditTransaction;
          });
          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error('Error loading credit data:', error);
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
  const percentUsed = monthlyAllocation > 0 ? ((monthlyAllocation - subscriptionCredits) / monthlyAllocation) * 100 : 0;

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Credit Balance"
        subtitle="Monitor your credit usage and purchase additional credits"
        action={
          <Button variant="primary" asChild>
            <Link href="/account/credits/purchase">
              <Plus className="w-4 h-4" />
              Purchase Credits
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Subscription Credits"
          value={subscriptionCredits.toLocaleString()}
          subValue={`of ${monthlyAllocation} monthly`}
          icon={<Coins className="w-6 h-6" />}
          color="brand"
        >
          <ProgressBar
            value={subscriptionCredits}
            max={monthlyAllocation}
            color="brand"
            className="mt-3"
          />
          <p className="text-xs text-gray-500 mt-2">
            Resets on your billing date
          </p>
        </StatCard>

        <StatCard
          label="Top-Off Credits"
          value={topOffCredits.toLocaleString()}
          subValue="never expire"
          icon={<Infinity className="w-6 h-6" />}
          color="success"
        />

        <StatCard
          label="Total Available"
          value={totalCredits.toLocaleString()}
          subValue="ready to use"
          icon={<TrendingDown className="w-6 h-6" />}
          color="warning"
        />
      </div>

      {/* How Credits Work */}
      <Card className="bg-brand-50 border-brand-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-500 rounded-lg">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-900 mb-1">
                How Credit Usage Works
              </h3>
              <p className="text-sm text-brand-700 mb-3">
                Your subscription credits are used first, then top-off credits are consumed automatically.
              </p>
              <div className="space-y-2 text-sm text-brand-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium">1.</span>
                  <span>Subscription credits reset every billing cycle</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">2.</span>
                  <span>Top-off credits never expire and roll over indefinitely</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">3.</span>
                  <span>Unused subscription credits don't carry over</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Usage This Month */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Billing Cycle</CardTitle>
          <CardDescription>
            {percentUsed.toFixed(0)}% of monthly subscription credits used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Subscription Credits</span>
                <span className="text-sm text-gray-500">
                  {subscriptionCredits} / {monthlyAllocation}
                </span>
              </div>
              <ProgressBar
                value={subscriptionCredits}
                max={monthlyAllocation}
                color="brand"
              />
            </div>

            {topOffCredits > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold text-success-600">{topOffCredits}</span> top-off credits available
                </p>
                <p className="text-xs text-gray-500">
                  These will be used after your subscription credits run out
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Link href="/account/billing" className="text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1">
                Upgrade your plan for more credits
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your credit transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">No transactions yet</p>
              <p className="text-sm text-gray-400">
                Your credit activity will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          tx.type === 'usage' ? 'danger' :
                          tx.type === 'subscription' ? 'success' :
                          tx.type === 'topoff' ? 'primary' :
                          'default'
                        }
                      >
                        {tx.type}
                      </Badge>
                      {tx.feature && (
                        <span className="text-xs text-gray-500">
                          {tx.feature}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{tx.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tx.createdAt instanceof Date
                        ? tx.createdAt.toLocaleString()
                        : new Date(tx.createdAt).toLocaleString()
                      }
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-semibold ${tx.amount > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {(tx.subscriptionBalance || 0) + (tx.topOffBalance || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
