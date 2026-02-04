'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, getUserTenant } from '@/lib/accountAuth';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Check,
  AlertCircle,
  Download,
  ExternalLink,
} from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    credits: 250,
    articles: 50,
    journalists: 1,
    features: [
      '250 AI credits/month',
      '1 AI journalist',
      '50 articles/month',
      'Email support',
      'Basic analytics',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 199,
    credits: 575,
    articles: 115,
    journalists: 3,
    features: [
      '575 AI credits/month',
      '3 AI journalists',
      '115 articles/month',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
    ],
    badge: 'Popular',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    credits: 1000,
    articles: 200,
    journalists: 6,
    features: [
      '1,000 AI credits/month',
      '6 AI journalists',
      '200 articles/month',
      'Dedicated support',
      'Full analytics suite',
      'Custom integrations',
      'AI banner generation',
    ],
  },
];

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        setUser(currentUser);

        const userTenant = await getUserTenant(currentUser.uid);
        setTenant(userTenant);
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handlePlanChange = async (newPlanId: string) => {
    if (!tenant) return;

    setChangingPlan(true);

    try {
      // TODO: Call API to change plan via Stripe
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          newPlanId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      // Reload tenant data
      const updatedTenant = await getUserTenant(user.uid);
      setTenant(updatedTenant);

      alert('Plan updated successfully!');
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to update plan. Please try again.');
    } finally {
      setChangingPlan(false);
    }
  };

  const handleManagePayment = async () => {
    try {
      // Create Stripe Customer Portal session
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open payment management. Please try again.');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
        </div>
      </PageContainer>
    );
  }

  if (!tenant) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500">No billing information available.</p>
        </div>
      </PageContainer>
    );
  }

  const currentPlanId = tenant.plan || 'starter';
  const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
  const isActive = tenant.status === 'active' || tenant.status === 'seeding';
  const nextBillingDate = tenant.nextBillingDate
    ? new Date(tenant.nextBillingDate.seconds * 1000).toLocaleDateString()
    : 'N/A';

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your plan and payment methods"
      />

      {/* Current Plan Hero Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-brand-100 text-sm font-medium mb-1">
                Current Plan
              </p>
              <h2 className="text-3xl font-bold mb-2">{currentPlan.name}</h2>
              <p className="text-brand-50 text-lg">
                ${currentPlan.price}/month • {currentPlan.credits} credits
              </p>
            </div>
            <Badge variant={isActive ? 'success' : 'warning'} className="bg-white/20 text-white border-white/30">
              {isActive ? 'Active' : tenant.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-brand-400">
            <div>
              <p className="text-brand-100 text-sm">Next Billing</p>
              <p className="text-white font-semibold mt-1">{nextBillingDate}</p>
            </div>
            <div>
              <p className="text-brand-100 text-sm">Monthly Credits</p>
              <p className="text-white font-semibold mt-1">{currentPlan.credits} credits</p>
            </div>
            <div>
              <p className="text-brand-100 text-sm">Billing Cycle</p>
              <p className="text-white font-semibold mt-1">Monthly</p>
            </div>
          </div>
        </div>

        <CardFooter className="bg-gray-50 flex flex-col sm:flex-row gap-3 justify-between">
          <Button variant="outline" onClick={handleManagePayment}>
            <CreditCard className="w-4 h-4" />
            Manage Payment Method
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-danger-600 hover:text-danger-700 hover:bg-danger-50">
              Cancel Subscription
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Available Plans */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const canUpgrade = PLANS.findIndex(p => p.id === currentPlanId) < PLANS.findIndex(p => p.id === plan.id);
            const canDowngrade = PLANS.findIndex(p => p.id === currentPlanId) > PLANS.findIndex(p => p.id === plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative ${isCurrent ? 'ring-2 ring-brand-500' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0">
                    <Badge variant="primary" className="shadow-md">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-gray-500">/month</span>
                      </CardDescription>
                    </div>
                    {isCurrent && (
                      <Badge variant="success">Current</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : canUpgrade ? (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={changingPlan}
                    >
                      {changingPlan ? 'Upgrading...' : 'Upgrade'}
                    </Button>
                  ) : canDowngrade ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={changingPlan}
                    >
                      {changingPlan ? 'Downgrading...' : 'Downgrade'}
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No invoices yet. Your first invoice will appear here after billing.</p>
          </div>
          {/* TODO: Fetch and display actual invoices */}
        </CardContent>
      </Card>

      {/* Need Help? */}
      <Card className="mt-6 bg-info-50 border-info-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-info-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-info-900 mb-1">
                Need help with billing?
              </h4>
              <p className="text-sm text-info-700 mb-3">
                Our support team is here to help with any billing questions or concerns.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/account/messages">Contact Support</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
