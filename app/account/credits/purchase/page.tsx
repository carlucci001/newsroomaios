'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check } from 'lucide-react';

const CREDIT_PACKAGES = [
  {
    id: 'credits_100',
    credits: 100,
    price: 19,
    priceId: 'price_credits_100',
    popular: false,
  },
  {
    id: 'credits_250',
    credits: 250,
    price: 45,
    priceId: 'price_credits_250',
    popular: true,
    savings: '5%',
  },
  {
    id: 'credits_500',
    credits: 500,
    price: 85,
    priceId: 'price_credits_500',
    popular: false,
    savings: '10%',
  },
  {
    id: 'credits_1000',
    credits: 1000,
    price: 150,
    priceId: 'price_credits_1000',
    popular: false,
    savings: '21%',
  },
];

export default function PurchaseCreditsPage() {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packageId: string, priceId: string) => {
    setPurchasing(packageId);

    try {
      // TODO: Implement Stripe checkout for one-time credit purchase
      alert('Credit purchase coming soon! This will create a Stripe checkout session.');

      // const response = await fetch('/api/stripe/create-checkout', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ priceId }),
      // });
      // const data = await response.json();
      // window.location.href = data.url;
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to initiate purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Purchase Credits"
        subtitle="Top-off credits never expire and are used after your monthly subscription credits"
        action={
          <Button variant="ghost" asChild>
            <Link href="/account/credits">
              <ArrowLeft className="w-4 h-4" />
              Back to Credits
            </Link>
          </Button>
        }
      />

      {/* Info Card */}
      <Card className="bg-brand-50 border-brand-200 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-500 rounded-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-900 mb-1">
                Top-Off Credits Never Expire
              </h3>
              <p className="text-sm text-brand-700">
                These credits are used automatically after your monthly subscription credits run out.
                They never expire and roll over indefinitely.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative ${pkg.popular ? 'ring-2 ring-brand-500' : ''}`}
          >
            {pkg.popular && (
              <div className="absolute top-0 right-0 -translate-y-1/2">
                <Badge variant="primary" className="shadow-md">
                  Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold">
                {pkg.credits}
              </CardTitle>
              <CardDescription>credits</CardDescription>
            </CardHeader>

            <CardContent className="text-center pb-4">
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${pkg.price}
                </span>
                <span className="text-gray-500 text-sm ml-1">one-time</span>
              </div>

              {pkg.savings && (
                <Badge variant="success" className="mb-4">
                  Save {pkg.savings}
                </Badge>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-success-500" />
                  <span>Never expires</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-success-500" />
                  <span>Use anytime</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-success-500" />
                  <span>${(pkg.price / pkg.credits).toFixed(2)}/credit</span>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                variant={pkg.popular ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => handlePurchase(pkg.id, pkg.priceId)}
                disabled={purchasing !== null}
              >
                {purchasing === pkg.id ? 'Processing...' : 'Purchase'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              When are top-off credits used?
            </h4>
            <p className="text-sm text-gray-600">
              Top-off credits are automatically used after your monthly subscription credits are depleted.
              Your subscription credits reset each billing cycle, but top-off credits roll over indefinitely.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Do top-off credits expire?
            </h4>
            <p className="text-sm text-gray-600">
              No! Top-off credits never expire and remain available for as long as you maintain an active subscription.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Can I get a refund on unused credits?
            </h4>
            <p className="text-sm text-gray-600">
              Top-off credit purchases are non-refundable, but since they never expire, you can use them at any time in the future.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
